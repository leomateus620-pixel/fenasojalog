

# Security Audit Self-Check (Revisado)

## Princípios revisados

1. **Sem service role para leitura geral** — o edge function usa o client autenticado do caller (anon key + JWT) para queries de dados, e service role **apenas** para consultas de metadados do sistema (pg_class/pg_policies via RPCs dedicadas).
2. **Whitelist de queries** — cada check é uma função pura com query fixa e pré-definida. Nenhuma query dinâmica ou construída com strings.
3. **Saída agregada** — apenas contagens e flags booleanos (ex: `piiExposedCount: 3`, `rlsEnabled: true`). Zero registros de exemplo, nem mascarados.
4. **Relatório no banco** — resultado completo salvo em `security_audit_reports` (RLS: somente admin). Frontend recebe apenas o `summary`.

## Implementação

### 1. Migração: tabela `security_audit_reports` + RPCs de metadados

```sql
-- Tabela de relatórios
CREATE TABLE public.security_audit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  run_by_user_id uuid NOT NULL,
  scope text NOT NULL DEFAULT 'quick',
  summary jsonb NOT NULL,
  findings jsonb NOT NULL,
  metadata jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.security_audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_reports_select" ON public.security_audit_reports
  FOR SELECT TO authenticated
  USING (get_user_org_role(auth.uid(), org_id) = 'admin'::org_role);

CREATE POLICY "audit_reports_insert" ON public.security_audit_reports
  FOR INSERT TO authenticated
  WITH CHECK (get_user_org_role(auth.uid(), org_id) = 'admin'::org_role);

-- RPC: listar tabelas com status RLS (SECURITY DEFINER, read-only)
CREATE OR REPLACE FUNCTION public.audit_check_rls_status()
RETURNS TABLE(table_name text, rls_enabled boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT c.relname::text, c.relrowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r';
$$;

-- RPC: contar policies por tabela
CREATE OR REPLACE FUNCTION public.audit_count_policies()
RETURNS TABLE(table_name text, policy_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT c.relname::text, COUNT(p.polname)
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_policy p ON p.polrelid = c.oid
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  GROUP BY c.relname;
$$;
```

### 2. Edge Function: `supabase/functions/security-audit-selfcheck/index.ts`

**Autenticação**: `verify_jwt = false` no config.toml. Valida JWT no código + verifica role admin via `get_user_org_role` usando o client do caller.

**Arquitetura de clients**:
- `callerClient` — criado com anon key + Authorization header do caller. Usado para todas as queries de dados (respeita RLS).
- `metaClient` — service role, usado **exclusivamente** para chamar as 2 RPCs de metadados (`audit_check_rls_status`, `audit_count_policies`) e para inserir o relatório na tabela `security_audit_reports`.

**Whitelist de checks** (cada um é uma função com query fixa):

| ID | Módulo | Query fixa | Retorno |
|---|---|---|---|
| CFG-001 | Config | `callerClient.rpc('audit_check_rls_status')` | `{tablesWithoutRls: number}` |
| CFG-002 | Config | `callerClient.rpc('audit_count_policies')` | `{tablesWithoutPolicies: number}` |
| CFG-003 | Config | Verifica se `audit_log` tem registros: `SELECT count(*) FROM audit_log WHERE org_id = $orgId LIMIT 1` | `{auditLogActive: boolean}` |
| TRN-001 | Transportes | `SELECT count(*) FROM transports WHERE org_id = $orgId` | `{totalRecords: number, hasData: boolean}` |
| TRN-002 | Transportes | `SELECT count(*) FROM transports WHERE org_id = $orgId AND motorista_user_id IS NULL AND status != 'pendente'` | `{activeWithoutDriver: number}` |
| GST-001 | Hospedes | `SELECT count(*) FROM guests WHERE org_id = $orgId AND telefone IS NOT NULL` | `{guestsWithPhone: number}` — flag de PII presente |
| GST-002 | Hospedes | `SELECT count(*) FROM guests WHERE org_id = $orgId AND checkin_em > checkout_em` | `{inconsistentDates: number}` |
| VEH-001 | Veiculos | `SELECT count(*) FROM vehicles WHERE org_id = $orgId AND km_atual < 0` | `{negativeKm: number}` |
| EQP-001 | Equipe | `SELECT count(*) FROM org_members WHERE org_id = $orgId AND telefone IS NOT NULL` | `{membersWithPhone: number}` |
| CFG-004 | Settings | Verifica roles da org: `SELECT role, count(*) FROM org_members WHERE org_id = $orgId GROUP BY role` | `{adminCount: number, hasMultipleAdmins: boolean}` |

Cada check retorna **apenas contagens e flags**. Nenhum dado de registro.

**Fluxo de execução**:
1. Validar auth (JWT + admin role)
2. Executar checks da whitelist sequencialmente
3. Montar `findings[]` com severity/recommendation baseada nas contagens
4. Inserir relatório completo em `security_audit_reports` via `metaClient`
5. Retornar apenas `{ reportId, summary: { critical, high, medium, low, info, total } }` ao frontend

### 3. Atualizar `supabase/config.toml`

```toml
[functions.security-audit-selfcheck]
verify_jwt = false
```

### 4. Frontend: `src/pages/SettingsPage.tsx`

Adicionar seção visível apenas para admins:
- Botao "Executar Auditoria de Seguranca"
- Ao clicar, chama `supabase.functions.invoke('security-audit-selfcheck', { body: { scope: 'full', orgId } })`
- Exibe apenas o `summary` retornado (contagens por severidade)
- Link "Ver relatório completo" que faz `SELECT` na tabela `security_audit_reports` pelo `reportId` e exibe os findings detalhados (sem PII, apenas contagens e recomendações)

### 5. Secret necessário

`AUDIT_INTERNAL_KEY` — para execucoes via cron sem usuario logado. Solicitar ao usuario via `add_secret`.

## Arquivos

- **Criar**: `supabase/functions/security-audit-selfcheck/index.ts`
- **Modificar**: `src/pages/SettingsPage.tsx`
- **Migração**: tabela `security_audit_reports` + 2 RPCs

