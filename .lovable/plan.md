

## Diagnóstico — fui mais a fundo dessa vez

Confirmei no banco que os roles **estão corretos**:
- `fenasojalog@gmail.com` → role `admin` ✅
- `leomateus620@gmail.com` → role `operador` ✅
- `fenasojalog2026@hotmail.com` → role `leitura` + capability `mobility_access` ✅

A função SQL `has_capability` retorna `true` para admin/operador automaticamente. Logo, no papel, tudo deveria funcionar. Mas tem **3 bugs de fato** no front-end:

### Bug 1 — Erro de hooks do React derruba os guards
O console mostra `Uncaught Error: Should have a queue. This is likely a bug in React` no `AuthGuard.tsx` linha 30 (`if (showSplash)`). Isso acontece porque cada componente que chama `useAuth()` cria sua **própria instância de `useState`/`useEffect`/`useRef`** (Sidebar, AuthGuard, CapabilityGuard via useCapabilities, etc.). Quando o `onAuthStateChange` dispara, várias instâncias chamam `queryClient.clear()` e mexem em refs ao mesmo tempo, gerando reconciliação inconsistente. Quando o React quebra a fila de hooks, **os guards falham silenciosamente** e o conteúdo renderiza sem proteção — explica por que o usuário restrito viu Settings.

### Bug 2 — Race condition em `useCapabilities`
O hook calcula `hasFullAccessByRole` **antes** do `myRole` estar resolvido. Em milissegundos iniciais: `myRole = null` → `hasFullAccessByRole = false` → query roda → enquanto carrega, `hasCapability(qualquer_coisa)` retorna `false`. Para admin, isso significa que **TODOS os menus somem** até o role chegar. E o `useMemo` de `groups` no Sidebar usa `hasCapability` como dep — mas `hasCapability` é uma função nova a cada render, fazendo o memo recomputar com valores parciais.

### Bug 3 — Cache cruzado por queryKey colidindo
O `PersistQueryClientProvider` usa chave única `fenasoja-query-cache`. Mesmo que cada queryKey inclua `user?.id`, **as queries que NÃO usam user.id na key** (transports, events, tasks, members, mobility-forms) são compartilhadas entre usuários. O sidebar renderiza badges com dados do usuário anterior e o restritivo vê pistas do sistema todo. Pior: quando o admin loga depois do restrito, o cache antigo serve `myRole = 'leitura'` por instantes antes do refetch, ocultando todos os menus.

---

## Correções

### 1. Centralizar `useAuth` em um Context (fonte única de verdade)
- Criar `src/contexts/AuthProvider.tsx` que monta `useState`/`onAuthStateChange` **uma única vez**
- `useAuth()` passa a ler do Context, sem `useState` próprio
- Elimina a multiplicidade de subscriptions, refs e o React queue error

### 2. Centralizar `useCapabilities` em Context também
- `src/contexts/CapabilitiesProvider.tsx` calcula uma única vez
- Garante `isLoading = true` até `authLoading || orgLoading || (!!user && (!orgId || myRole == null))`
- Retorna `hasCapability` como função estável (`useCallback`) para Sidebar não recomputar

### 3. Sidebar
- Trocar `useMemo([hasCapability])` por dependência das primitivas (`hasFullAccess`, `capSet`)
- Enquanto `capsLoading` ou role não resolvido, mostrar skeletons (não esconder)

### 4. Versionar o cache persistido por usuário
- Trocar `key: 'fenasoja-query-cache'` por chave dinâmica ou usar `buster` no `PersistQueryClientProvider` baseado em `user.id`
- Assim, o cache persistido fica isolado por sessão de usuário e nunca contamina o próximo

### 5. CapabilityGuard
- Garantir que enquanto `isLoading`, NUNCA renderiza children nem redireciona
- Para usuários sem `full_access` mas com `mobility_access`, redirecionar `/` → `/mobility-auth` (mantém o que já existe, mas com guarda de loading robusta)

### 6. Limpeza pós-logout no login
- Adicionar limpeza explícita de cache + reload suave ao detectar troca de user no `AuthProvider` (uma vez só, no nível raiz), evitando race conditions que múltiplos `useAuth` causam hoje

---

## Arquivos a alterar
| Arquivo | Mudança |
|---|---|
| `src/contexts/AuthProvider.tsx` | **Novo** — Provider único que substitui estado local de useAuth |
| `src/hooks/useAuth.ts` | Vira consumer do AuthContext |
| `src/contexts/CapabilitiesProvider.tsx` | **Novo** — Provider único de capabilities |
| `src/hooks/useCapabilities.ts` | Vira consumer do CapabilitiesContext |
| `src/App.tsx` | Envolver app com `<AuthProvider><CapabilitiesProvider>`. Configurar `buster` dinâmico no Persister por user.id |
| `src/components/Sidebar.tsx` | Deps estáveis no useMemo, loading robusto |
| `src/components/CapabilityGuard.tsx` | Já está OK, apenas validar |

## Resultado esperado
- Admin (`fenasojalog@gmail.com`) e operador (`leomateus620@gmail.com`): **veem todos os menus, incluindo Mobilidade**, sem flash
- Restrito (`fenasojalog2026@hotmail.com`): vê **apenas Mobilidade + Sair**, e tentativas de URL direta para `/`, `/settings`, etc. redirecionam para `/mobility-auth`
- Sem o erro `Should have a queue` no console
- Sem contaminação de cache entre logins

