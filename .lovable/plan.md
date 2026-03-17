

# Auditoria Completa do Sistema Fenasoja Logistica

## Resumo Executivo

Apos analise detalhada de todo o sistema -- frontend, backend, banco de dados, autenticacao, hooks, servicos, edge functions, cache e fluxo de dados -- foram identificados **23 problemas** organizados por severidade e frente de atuacao.

---

## 1. BUGS E PROBLEMAS CRITICOS

### BUG-01: Race condition no useAuth (dupla inicializacao)
**Arquivo:** `src/hooks/useAuth.ts`
**Problema:** `onAuthStateChange` e `getSession` executam em paralelo. Ambos chamam `setLoading(false)`, mas se `getSession` resolver primeiro com sessao nula (antes do listener disparar), o app mostra LoginPage por um instante e depois faz "flash" ao receber o evento de auth.
**Correcao:** Remover `setLoading(false)` de `getSession` e deixar apenas no `onAuthStateChange`. Usar flag para evitar processamento duplicado.

### BUG-02: Sidebar carrega dados desnecessarios em TODAS as paginas
**Arquivo:** `src/components/Sidebar.tsx`
**Problema:** A Sidebar importa `useTransports`, `useEvents`, `useTasks`, `useOrgMembers` para mostrar badges. Isso significa que TODA navegacao do app executa 4+ queries extras ao banco, mesmo quando o usuario esta em paginas que ja carregam esses dados. Impacto direto em performance.
**Correcao:** Reutilizar os dados ja cacheados pelo React Query (as queries ja estao no cache com `staleTime: 30000`). O problema real e que cada instancia do hook cria uma nova subscricao. Solucao: confiar no cache existente sem duplicar a logica, ou mover contadores para um contexto centralizado.

### BUG-03: `useEffect` com dependencia faltante no LocationTracking
**Arquivo:** `src/pages/TransportsPage.tsx`, linha 262-266
**Problema:** `useEffect` depende de `trackingTransportId` e verifica `locationTracker.isTracking`, mas `locationTracker` nao esta nas dependencias. Se `locationTracker` mudar de referencia (o que acontece a cada render pois o hook retorna um novo objeto), isso causa chamadas repetidas de `startTracking`.
**Correcao:** Adicionar `locationTracker.isTracking` e `locationTracker.startTracking` as dependencias ou usar `useRef` para a referencia do tracker.

### BUG-04: Erro silencioso ao criar transporte de volta
**Arquivo:** `src/pages/TransportsPage.tsx`, linha 461
**Problema:** O catch vazio (`catch { /* silent */ }`) no bloco de criacao do transporte de volta esconde completamente qualquer erro. Se a criacao da volta falhar, o usuario recebe "Ida e volta agendados" mas so a ida foi criada.
**Correcao:** Notificar o usuario caso a criacao do retorno falhe.

### BUG-05: Filtro de eventos no Dashboard usa `startsWith` com timezone
**Arquivo:** `src/pages/Dashboard.tsx`, linhas 108-109
**Problema:** `e.inicio_em?.startsWith(todayStr)` compara a string ISO completa com uma data YYYY-MM-DD. Se o banco retornar timestamps com timezone (ex: `2026-03-17T23:00:00+00:00`), um evento as 23h UTC que e na verdade dia 18 em SP sera contado como dia 17.
**Correcao:** Converter `inicio_em` para data SP antes de comparar, ou usar a funcao `todaySP()` com conversao adequada.

---

## 2. PROBLEMAS DE PERFORMANCE

### PERF-01: TransportsPage e um mega-componente (890 linhas)
**Arquivo:** `src/pages/TransportsPage.tsx`
**Problema:** 890 linhas com 15+ estados, logica de formularios, PDF generator, helpers -- tudo no mesmo arquivo. Cada mudanca de estado re-renderiza todo o componente.
**Correcao:** Extrair `handleAdd`, `handleEditSave`, `generatePDF`, `cycleStatus` para hooks customizados. Mover dialogs para componentes separados com lazy loading.

### PERF-02: `getGuestsForTransport` chamado dentro de loops de filtragem
**Arquivo:** `src/pages/TransportsPage.tsx`, linha 602
**Problema:** Na funcao de filtragem por search, `getGuestsForTransport(t.id)` e chamado para CADA transporte durante CADA filtragem. Isso faz um `.filter()` no array `transportGuests` para cada transporte.
**Correcao:** Pre-computar um `Map<transportId, guestIds[]>` usando `useMemo`.

### PERF-03: Dashboard re-renderiza lista de equipe com closures
**Arquivo:** `src/pages/Dashboard.tsx`, linhas 296-343
**Problema:** A secao "Equipe Logistica" usa uma IIFE (funcao anonima imediata) dentro do JSX que cria um `Map` de shifts a cada render. Isso impede memoizacao.
**Correcao:** Extrair a logica de shift para um `useMemo` separado e o componente de membro para um sub-componente.

### PERF-04: Queries sem paginacao em tabelas que podem crescer
**Arquivos:** Todos os hooks de dados
**Problema:** Todas as queries carregam `SELECT *` sem LIMIT. Com crescimento de dados (transports, events, guests), o payload pode exceder 1000 linhas (limite padrao do Supabase) sem aviso.
**Correcao:** Adicionar `.limit(1000)` explicito e/ou implementar paginacao para transportes historicos.

---

## 3. PROBLEMAS DE SEGURANCA

### SEC-01: Edge function `estimate-return` sem verificacao JWT
**Arquivo:** `supabase/config.toml` -- `verify_jwt = false`
**Problema:** A funcao `estimate-return` aceita requests sem autenticacao. Qualquer pessoa com a URL pode fazer requests ilimitados, potencialmente consumindo creditos da API do Google Maps.
**Correcao:** Habilitar `verify_jwt = true` ou adicionar validacao manual do token.

### SEC-02: `transport-lifecycle` nao valida role do usuario
**Arquivo:** `supabase/functions/transport-lifecycle/index.ts`
**Problema:** A funcao valida que o usuario esta autenticado, mas usa o `admin` client (service role) para todas as operacoes. Nao verifica se o usuario tem permissao (role operador/gestor/admin) para a operacao solicitada. Um usuario com role `leitura` pode criar/editar/deletar transportes via esta funcao.
**Correcao:** Adicionar verificacao de role usando `get_user_org_role` antes de executar operacoes.

### SEC-03: `auditService.ts` usa `getUser()` a cada chamada
**Arquivo:** `src/services/auditService.ts`
**Problema:** Cada operacao de auditoria faz uma chamada `supabase.auth.getUser()` ao servidor. Em sequencias de operacoes (criar transporte + auditoria + criar evento + auditoria), isso pode gerar 3-4 roundtrips extras.
**Correcao:** Passar `userId` como parametro em vez de buscar do auth a cada chamada.

---

## 4. INCONSISTENCIAS DE FLUXO DE DADOS

### DATA-01: Duplicacao de logica `ensureSPTimestamptz`
**Arquivos:** `src/lib/utils.ts` (como `ensureSPOffset`) e `src/pages/TransportsPage.tsx` (como `ensureSPTimestamptz`)
**Problema:** A mesma logica existe em dois lugares com nomes diferentes e implementacoes ligeiramente distintas.
**Correcao:** Remover `ensureSPTimestamptz` do TransportsPage e usar `ensureSPOffset` do utils.

### DATA-02: Casting `as any` massivo em queries Supabase
**Arquivos:** Todos os hooks
**Problema:** Praticamente todas as queries usam `(supabase as any)`, perdendo completamente a type-safety. Erros de nome de coluna ou tabela so sao descobertos em runtime.
**Correcao:** Este e um problema de tipagem. As tabelas `guests_safe`, `org_members_safe` (views) e outras nao estao nos tipos gerados. Documentar quais tabelas precisam de cast e quais podem usar tipagem nativa.

### DATA-03: `useCurrentOrg` depende de `localStorage` como fallback
**Arquivo:** `src/hooks/useCurrentOrg.ts`, linha 33
**Problema:** `orgId` usa `localStorage.getItem(ORG_KEY)` como fallback quando `membership` ainda nao carregou. Isso pode retornar um org_id invalido (de sessao anterior com outro usuario).
**Correcao:** Retornar `null` enquanto membership nao carregou, em vez de usar localStorage como fallback.

---

## 5. MELHORIAS DE ROBUSTEZ

### ROB-01: Login nao faz trim no email
**Arquivo:** `src/pages/LoginPage.tsx`
**Problema:** Espacos antes/depois do email causam falha silenciosa de autenticacao.
**Correcao:** Adicionar `.trim()` ao email antes de chamar `signIn`.

### ROB-02: Formularios nao desabilitam submit durante loading
**Arquivo:** `src/pages/TransportsPage.tsx`
**Problema:** Os botoes de submit usam `disabled={create.isPending}` mas nao ha protecao contra duplo-submit via Enter no formulario. O `handleAdd` pode ser chamado multiplas vezes.
**Correcao:** Adicionar flag local de submitting ou guardar ref de promise.

### ROB-03: Service Worker cache desatualizado
**Arquivo:** `public/sw.js`
**Problema:** `CACHE_NAME = 'fenasoja-v1'` e estatico. Atualizacoes de assets nao invalidam o cache automaticamente pois o Vite gera hashes nos nomes de arquivos, mas o SW tenta cachear `/index.html` que pode servir referencias antigas.
**Correcao:** Atualizar o cache name em cada deploy ou usar uma estrategia de cache-busting.

### ROB-04: Catch vazio em multiplos edge function handlers
**Arquivo:** `supabase/functions/transport-lifecycle/index.ts`, linhas 110, 160, 167, 187
**Problema:** Varios `catch { /* silent */ }` escondem erros de criacao de eventos, shifts, vehicle_usage. Se essas operacoes falharem, o sistema fica em estado inconsistente (transporte criado sem evento correspondente).
**Correcao:** Logar erros no console do edge function para debug, e para operacoes criticas (vehicle_usage), propagar o erro.

---

## 6. PLANO DE IMPLEMENTACAO (Priorizado)

### Fase 1 -- Critico (corrigir imediatamente)
1. **SEC-02**: Validar role no `transport-lifecycle`
2. **BUG-01**: Corrigir race condition no useAuth
3. **BUG-05**: Corrigir filtragem de eventos por timezone
4. **ROB-01**: Trim no email do login

### Fase 2 -- Alta prioridade
5. **SEC-01**: Proteger estimate-return com JWT
6. **PERF-01/02**: Refatorar TransportsPage (extrair logica)
7. **DATA-01**: Unificar funcoes de timezone
8. **BUG-04**: Notificar falha na criacao do retorno

### Fase 3 -- Melhorias
9. **PERF-03**: Otimizar Dashboard equipe
10. **BUG-02**: Otimizar badges da Sidebar
11. **ROB-03**: Melhorar estrategia de SW cache
12. **ROB-04**: Logar erros no edge function
13. **SEC-03**: Otimizar auditService
14. **DATA-03**: Corrigir fallback de orgId

### Fase 4 -- Divida tecnica
15. **DATA-02**: Documentar/resolver casts `as any`
16. **PERF-04**: Implementar paginacao
17. **BUG-03**: Corrigir dependencias de useEffect
18. **ROB-02**: Protecao contra duplo-submit

---

Todas as correcoes preservam funcionalidades existentes. Nenhuma alteracao visual ou de regras de negocio sera feita -- apenas correcao de bugs, melhoria de performance e fortalecimento de seguranca.

