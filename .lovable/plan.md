

## Diagnóstico — 3 problemas reais identificados

### Problema 1: `fenasojalog2026@hotmail.com` vê o sistema todo
**Causa real:** No `useCapabilities.ts` linha 12, o hook concede `full_access` automaticamente para qualquer role `admin/gestor/operador`. Mas o usuário está com role `leitura` no banco (correto). Então isso não é o bug.

O **bug verdadeiro** está em `useCurrentOrg`: quando o usuário não tem role definido ainda (carregamento async) ou quando há fallback, `myRole` pode vir como undefined e o cache do React Query persistido em localStorage (`fenasoja-query-cache`) pode estar **servindo dados de uma sessão anterior** (ex.: do admin que logou antes nesse navegador). O `PersistQueryClientProvider` mantém cache por 24h sem invalidar no signOut/signIn. Resultado: novo login herda capabilities/queries do usuário anterior.

### Problema 2: `fenasojalog@gmail.com` (admin) e `leomateus620@gmail.com` (operador) NÃO veem o menu Mobilidade
**Causa real:** No `Sidebar.tsx` linha 26, o item Mobilidade exige `cap: 'mobility_access'`. No hook `useCapabilities`, quando o usuário tem role admin/operador → `hasFullAccess = true` → `hasCapability('mobility_access')` retorna `true`. Isso **deveria funcionar**.

Mas: o `useQuery` para capabilities tem `enabled: !!user && !!orgId && !hasFullAccessByRole`. Quando `myRole` ainda está carregando (undefined), `hasFullAccessByRole = false`, a query roda e retorna `[]`, e `hasCapability` retorna `false` para tudo — escondendo a Mobilidade até o role carregar. Mas o problema real é que **a sidebar renderiza antes do role estar pronto e não re-renderiza** corretamente em alguns casos por causa do cache persistido com chave estática ignorando user_id.

Além disso, **falta o item Mobilidade na lista para admins** porque ele está marcado com `cap: 'mobility_access'` (não `full_access`). Embora `hasCapability` deva retornar true para admin via fallback, se houve qualquer hidratação errada do cache, pode falhar.

### Problema 3: Cache cross-user via localStorage
O `PersistQueryClientProvider` usa chave fixa `fenasoja-query-cache`. Quando user A faz logout e user B faz login no mesmo browser, B vê dados/capabilities de A até o refetch.

---

## Correções

### 1. Limpar cache no logout/login (`useAuth.ts` + `App.tsx`)
- No `signOut`: `queryClient.clear()` + `localStorage.removeItem('fenasoja-query-cache')`
- No `onAuthStateChange` quando user_id mudar: limpar cache

### 2. Corrigir `useCapabilities` para evitar flash de "sem permissão"
- Aguardar o `myRole` estar definido antes de decidir `hasCapability`
- Expor `isLoading` que cobre tanto a query quanto o carregamento do role
- Quando `isLoading`, sidebar não filtra menus (mostra skeleton) ao invés de esconder

### 3. Garantir que Mobilidade aparece para admins
- Trocar `cap: 'mobility_access'` por uma lógica OR: visível se `full_access` OU `mobility_access`
- Como `hasCapability('mobility_access')` já retorna true para quem tem `full_access`, basta corrigir o bug de cache + loading

### 4. Endurecer guarda no `CapabilityGuard`
- Não redirecionar enquanto `isLoading` (evita flicker pra `/mobility-auth` em refresh)
- Para usuário `mobility_access` only, redirecionar `/` → `/mobility-auth` automaticamente

### 5. Ajustar `useCurrentOrg` para invalidar org ao trocar de user
- Detectar mudança de user.id e resetar `orgId` do localStorage se não pertencer ao novo user

---

## Arquivos a alterar
| Arquivo | Mudança |
|---|---|
| `src/hooks/useAuth.ts` | `queryClient.clear()` + remove localStorage no signOut e ao detectar troca de user |
| `src/App.tsx` | Expor queryClient para useAuth; redirect `/` → `/mobility-auth` se sem `full_access` |
| `src/hooks/useCapabilities.ts` | `isLoading` cobre role+query; aguardar role definido |
| `src/hooks/useCurrentOrg.ts` | Resetar org persistida quando user.id mudar |
| `src/components/CapabilityGuard.tsx` | Não decidir enquanto loading; redirect inteligente |
| `src/components/Sidebar.tsx` | Skeleton enquanto capabilities loading; não esconder Mobilidade prematuramente |

## Resultado esperado
- Logout/login limpos: cada usuário só vê o que tem permissão, sem herdar do anterior
- Admin e operador veem **todos** os menus, incluindo Mobilidade
- `fenasojalog2026@hotmail.com` vê **somente** Mobilidade + Sair, sem flicker, sem acesso por URL direta
- Refresh em `/mobility-auth` mantém o usuário restrito na página correta

