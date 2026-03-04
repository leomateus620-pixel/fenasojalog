import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Safety: hardcoded read-only ──────────────────────────────────────
const DRY_RUN = true; // NEVER change — no writes to production tables

interface Finding {
  id: string;
  module: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  risk: string;
  evidence: Record<string, unknown>;
  recommendation: string;
}

// ── Whitelisted checks ───────────────────────────────────────────────

async function checkRlsStatus(metaClient: any): Promise<Finding[]> {
  const { data, error } = await metaClient.rpc("audit_check_rls_status");
  if (error) return [{ id: "CFG-001", module: "Config", title: "Falha ao verificar RLS", severity: "high", risk: "Não foi possível verificar status de RLS", evidence: { error: error.message }, recommendation: "Verificar função audit_check_rls_status" }];
  const withoutRls = (data || []).filter((t: any) => !t.rls_enabled);
  if (withoutRls.length === 0) return [{ id: "CFG-001", module: "Config", title: "RLS habilitado em todas as tabelas", severity: "info", risk: "Nenhum", evidence: { tablesChecked: data.length, tablesWithoutRls: 0 }, recommendation: "Nenhuma ação necessária" }];
  return [{ id: "CFG-001", module: "Config", title: "Tabelas sem RLS detectadas", severity: "critical", risk: "Dados podem ser acessados sem restrição", evidence: { tablesWithoutRls: withoutRls.length, tableNames: withoutRls.map((t: any) => t.table_name) }, recommendation: "Habilitar RLS em todas as tabelas públicas" }];
}

async function checkPolicyCoverage(metaClient: any): Promise<Finding[]> {
  const { data, error } = await metaClient.rpc("audit_count_policies");
  if (error) return [{ id: "CFG-002", module: "Config", title: "Falha ao verificar policies", severity: "high", risk: "Não foi possível contar policies", evidence: { error: error.message }, recommendation: "Verificar função audit_count_policies" }];
  const withoutPolicies = (data || []).filter((t: any) => Number(t.policy_count) === 0);
  if (withoutPolicies.length === 0) return [{ id: "CFG-002", module: "Config", title: "Todas as tabelas possuem policies", severity: "info", risk: "Nenhum", evidence: { tablesChecked: data.length, tablesWithoutPolicies: 0 }, recommendation: "Nenhuma ação necessária" }];
  return [{ id: "CFG-002", module: "Config", title: "Tabelas sem policies de RLS", severity: "high", risk: "Tabelas com RLS habilitado mas sem policies bloqueiam todo acesso ou são muito permissivas", evidence: { tablesWithoutPolicies: withoutPolicies.length, tableNames: withoutPolicies.map((t: any) => t.table_name) }, recommendation: "Adicionar policies de RLS apropriadas" }];
}

async function checkAuditLogActive(callerClient: any, orgId: string): Promise<Finding[]> {
  const { count, error } = await callerClient.from("audit_log").select("id", { count: "exact", head: true }).eq("org_id", orgId).limit(1);
  if (error) return [{ id: "CFG-003", module: "Config", title: "Falha ao verificar audit_log", severity: "medium", risk: "Não foi possível acessar audit_log", evidence: { error: error.message }, recommendation: "Verificar permissões de acesso ao audit_log" }];
  const active = (count || 0) > 0;
  return [{ id: "CFG-003", module: "Config", title: active ? "Audit log ativo" : "Audit log vazio", severity: active ? "info" : "medium", risk: active ? "Nenhum" : "Ações críticas podem não estar sendo registradas", evidence: { auditLogActive: active, recordCount: count || 0 }, recommendation: active ? "Nenhuma ação necessária" : "Verificar se logAudit está sendo chamado em todas as operações críticas" }];
}

async function checkTransports(callerClient: any, orgId: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  const { count: total } = await callerClient.from("transports").select("id", { count: "exact", head: true }).eq("org_id", orgId);
  findings.push({ id: "TRN-001", module: "Transportes", title: "Contagem de transportes", severity: "info", risk: "Nenhum", evidence: { totalRecords: total || 0, hasData: (total || 0) > 0 }, recommendation: "Nenhuma ação necessária" });

  const { count: noDriver } = await callerClient.from("transports").select("id", { count: "exact", head: true }).eq("org_id", orgId).is("motorista_user_id", null).neq("status", "pendente");
  if ((noDriver || 0) > 0) {
    findings.push({ id: "TRN-002", module: "Transportes", title: "Transportes ativos sem motorista", severity: "medium", risk: "Transportes em andamento sem motorista atribuído", evidence: { activeWithoutDriver: noDriver }, recommendation: "Atribuir motorista antes de iniciar transporte" });
  }

  return findings;
}

async function checkGuests(callerClient: any, orgId: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  const { count: withPhone } = await callerClient.from("guests").select("id", { count: "exact", head: true }).eq("org_id", orgId).not("telefone", "is", null);
  findings.push({ id: "GST-001", module: "Hospedes", title: "Hóspedes com telefone armazenado", severity: (withPhone || 0) > 0 ? "low" : "info", risk: (withPhone || 0) > 0 ? "PII (telefone) armazenado — garantir mascaramento em exibição" : "Nenhum", evidence: { guestsWithPhone: withPhone || 0 }, recommendation: (withPhone || 0) > 0 ? "Implementar mascaramento server-side para campos de telefone" : "Nenhuma ação necessária" });

  const { count: inconsistent } = await callerClient.from("guests").select("id", { count: "exact", head: true }).eq("org_id", orgId).not("checkin_em", "is", null).not("checkout_em", "is", null).gt("checkin_em", "checkout_em");
  if ((inconsistent || 0) > 0) {
    findings.push({ id: "GST-002", module: "Hospedes", title: "Datas de check-in/out inconsistentes", severity: "medium", risk: "Check-in posterior ao check-out indica erro de validação", evidence: { inconsistentDates: inconsistent }, recommendation: "Adicionar validação server-side para garantir checkin_em < checkout_em" });
  }

  return findings;
}

async function checkVehicles(callerClient: any, orgId: string): Promise<Finding[]> {
  const { count: negKm } = await callerClient.from("vehicles").select("id", { count: "exact", head: true }).eq("org_id", orgId).lt("km_atual", 0);
  if ((negKm || 0) > 0) {
    return [{ id: "VEH-001", module: "Veiculos", title: "Veículos com km negativo", severity: "medium", risk: "Valores de odômetro inválidos", evidence: { negativeKm: negKm }, recommendation: "Adicionar constraint CHECK(km_atual >= 0) ou validação trigger" }];
  }
  return [{ id: "VEH-001", module: "Veiculos", title: "Odômetros válidos", severity: "info", risk: "Nenhum", evidence: { negativeKm: 0 }, recommendation: "Nenhuma ação necessária" }];
}

async function checkTeam(callerClient: any, orgId: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  const { count: withPhone } = await callerClient.from("org_members").select("id", { count: "exact", head: true }).eq("org_id", orgId).not("telefone", "is", null);
  findings.push({ id: "EQP-001", module: "Equipe", title: "Membros com telefone exposto", severity: (withPhone || 0) > 0 ? "low" : "info", risk: (withPhone || 0) > 0 ? "PII (telefone) acessível a todos os membros da org" : "Nenhum", evidence: { membersWithPhone: withPhone || 0 }, recommendation: (withPhone || 0) > 0 ? "Considerar restringir visibilidade de telefone por role" : "Nenhuma ação necessária" });

  return findings;
}

async function checkSettings(callerClient: any, orgId: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  const { data: roles } = await callerClient.from("org_members").select("role").eq("org_id", orgId);
  const roleCounts: Record<string, number> = {};
  (roles || []).forEach((r: any) => { roleCounts[r.role] = (roleCounts[r.role] || 0) + 1; });
  const adminCount = roleCounts["admin"] || 0;

  findings.push({ id: "CFG-004", module: "Settings", title: adminCount > 1 ? "Múltiplos administradores" : "Administrador único", severity: adminCount > 3 ? "medium" : "info", risk: adminCount > 3 ? "Excesso de administradores aumenta superfície de ataque" : "Nenhum", evidence: { adminCount, roleCounts, hasMultipleAdmins: adminCount > 1 }, recommendation: adminCount > 3 ? "Revisar necessidade de tantos administradores — princípio do menor privilégio" : "Nenhuma ação necessária" });

  return findings;
}

// ── Simulate RBAC access (pure logic, no DB writes) ──────────────────
function simulateRbacChecks(): Finding[] {
  const findings: Finding[] = [];

  const expectedMatrix = [
    { resource: "transports", action: "delete", allowedRoles: ["admin", "gestor"] },
    { resource: "transports", action: "insert", allowedRoles: ["admin", "gestor", "operador"] },
    { resource: "vehicles", action: "delete", allowedRoles: ["admin", "gestor"] },
    { resource: "vehicles", action: "insert", allowedRoles: ["admin", "gestor"] },
    { resource: "guests", action: "delete", allowedRoles: ["admin", "gestor"] },
    { resource: "org_members", action: "delete", allowedRoles: ["admin"] },
    { resource: "org_members", action: "update", allowedRoles: ["admin", "gestor"] },
    { resource: "schedules", action: "delete", allowedRoles: ["admin", "gestor"] },
    { resource: "tasks", action: "delete", allowedRoles: ["admin", "gestor"] },
    { resource: "electric_carts", action: "delete", allowedRoles: ["admin", "gestor"] },
  ];

  // This is a static analysis — the actual RLS policies are verified by CFG-001/002.
  // Here we document the expected matrix for reference.
  findings.push({
    id: "RBAC-001",
    module: "RBAC",
    title: "Matriz RBAC documentada",
    severity: "info",
    risk: "Nenhum — verificação estática de design",
    evidence: { rulesCount: expectedMatrix.length, criticalActions: expectedMatrix.filter(r => r.action === "delete").length },
    recommendation: "Manter matriz atualizada conforme novas tabelas/ações são adicionadas",
  });

  return findings;
}

// ── Main handler ─────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const startTime = Date.now();

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    const auditKey = req.headers.get("X-Audit-Key");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const internalKey = Deno.env.get("AUDIT_INTERNAL_KEY");

    let callerUserId: string | null = null;

    // Auth via internal key (cron)
    if (auditKey && internalKey && auditKey === internalKey) {
      // OK — internal cron execution
    } else if (authHeader?.startsWith("Bearer ")) {
      // Auth via JWT
      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      callerUserId = claimsData.claims.sub as string;
    } else {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Parse body ──
    const body = await req.json();
    const scope = body.scope === "full" ? "full" : "quick";
    const orgId = body.orgId;
    const requestId = body.requestId || crypto.randomUUID();

    if (!orgId) {
      return new Response(JSON.stringify({ error: "orgId é obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Verify caller is admin in org ──
    if (callerUserId) {
      const metaCheck = createClient(supabaseUrl, serviceKey);
      const { data: role } = await metaCheck.rpc("get_user_org_role", { _user_id: callerUserId, _org_id: orgId });
      if (role !== "admin") {
        return new Response(JSON.stringify({ error: "Apenas administradores podem executar auditoria" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ── Create clients ──
    // callerClient: uses caller's JWT for data queries (respects RLS)
    const callerClient = authHeader
      ? createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
      : createClient(supabaseUrl, serviceKey); // fallback for cron

    // metaClient: service role ONLY for metadata RPCs + inserting report
    const metaClient = createClient(supabaseUrl, serviceKey);

    // ── Run whitelisted checks ──
    const allFindings: Finding[] = [];

    // Config checks (use metaClient for pg_catalog RPCs)
    allFindings.push(...await checkRlsStatus(metaClient));
    allFindings.push(...await checkPolicyCoverage(metaClient));
    allFindings.push(...await checkAuditLogActive(callerClient, orgId));

    // Data checks (use callerClient — respects RLS)
    allFindings.push(...await checkTransports(callerClient, orgId));
    allFindings.push(...await checkGuests(callerClient, orgId));
    allFindings.push(...await checkVehicles(callerClient, orgId));
    allFindings.push(...await checkTeam(callerClient, orgId));
    allFindings.push(...await checkSettings(callerClient, orgId));

    // RBAC simulation (pure logic)
    allFindings.push(...simulateRbacChecks());

    // ── Build summary ──
    const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: allFindings.length };
    for (const f of allFindings) {
      summary[f.severity]++;
    }

    const metadata = {
      requestId,
      timestamp: new Date().toISOString(),
      scope,
      modulesChecked: [...new Set(allFindings.map(f => f.module))],
      dryRun: DRY_RUN,
      checksRun: allFindings.length,
      durationMs: Date.now() - startTime,
    };

    // ── Save full report to DB via metaClient ──
    const { data: report, error: insertError } = await metaClient.from("security_audit_reports").insert({
      org_id: orgId,
      run_by_user_id: callerUserId || "00000000-0000-0000-0000-000000000000",
      scope,
      summary,
      findings: allFindings,
      metadata,
    }).select("id").single();

    if (insertError) {
      console.error("Failed to save report:", insertError);
    }

    // ── Return only summary to frontend ──
    return new Response(JSON.stringify({
      reportId: report?.id || null,
      summary,
      metadata: { requestId, timestamp: metadata.timestamp, scope, dryRun: true, checksRun: summary.total, durationMs: metadata.durationMs },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
