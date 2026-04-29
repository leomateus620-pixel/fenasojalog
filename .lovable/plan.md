
## Resumo da auditoria

Fiz a varredura do fluxo: `useTransports` + `transport-lifecycle` (RBAC + admin client), `locationTracker` (singleton com `watchPosition`, ownership por usuário+device via RPC `publish_transport_location`), `useLocationTracking`/`useTransportLocation` (Realtime via `postgres_changes`), `TransportDynamicIsland` (auto-arm GPS, mapa Leaflet, ETA via `estimate-return`) e as Edge Functions `places-autocomplete` e `estimate-return`.

**O fluxo está arquiteturalmente correto.** Os transportes ativos hoje no banco (`em_retorno`) estão com `tracking_started_by_user_id = NULL` e sem linhas em `transport_locations` — isso significa que os motoristas designados (`motorista_user_id`) não estão com a aba aberta no celular para reivindicar o GPS. A UI já mostra "Aguardando o motorista abrir o app…" nesse caso e existe o auto-arm + botão "Iniciar meu GPS desta viagem", então a parte mais crítica é estabilizar erros que estão impedindo a tela funcionar e melhorar a recuperação.

## Bugs reais encontrados (com causa)

1. **401 em `estimate-return`** — `TransportsPage.tsx` (linhas 78-90, 104-123) e `TransportDynamicIsland.tsx` (186-203, 250-271) chamam `fetch` direto com `Authorization: Bearer ${session?.access_token || ''}`. Se a sessão ainda não carregou, vai `Bearer ` vazio → 401 → mapa sem rota nem ETA. É exatamente o mesmo padrão que já corrigimos em `places-autocomplete`.
2. **GPS não retoma sozinho ao perder ownership** — quando o `publish` no `locationTracker` falha porque outro usuário/device já dono, o tracker chama `stopInternal()` permanentemente. Se o "outro usuário" era um coordenador antigo e o lifecycle limpou ownership numa transição de fase, o motorista correto não rearma sozinho e o card fica preso.
3. **Auto-arm não dispara em pages que não sejam `/transports`** — o `useEffect` de auto-arm vive em `TransportsPage`. Se o motorista abrir o app numa rota diferente (Dashboard, Escala), o GPS não inicia. Isso explica casos de "abriu o app e nada".
4. **`stopInternal` zera coordenadas mesmo durante erro recuperável** — perde o último ponto bom da UI e cria um piscar de "Aguardando…".
5. **`useTransportLocation` não revalida ao reconectar** — se a aba foi suspensa (mobile bloqueou tela), o canal Realtime pode reabrir vazio. Falta um refetch no `visibilitychange`/`online`.
6. **Restrição da Google Maps API key** — a key precisa estar com restrição **None** (regra do projeto memorizada). Validar no Cloud antes de mexer em código.

## O que NÃO está quebrado (não vamos mexer)

- RBAC do `transport-lifecycle` (admin client + verificação de role via `get_user_org_role`).
- RPC `publish_transport_location` (já garante motorista designado, ownership por user e device, status ativo).
- Reset de ownership a cada transição de fase no lifecycle (`start`, `arrive_destination`, `start_return`).
- Realtime em `transport_locations` filtrado por `transport_id`.
- Fluxo de ida → chegou_destino → em_retorno → concluido (já implementado e em uso).
- Janela 29/04–10/05 e flag `somente_ida`.

## Plano de correção (cirúrgico, sem refactor)

### 1. Corrigir 401 em `estimate-return` (idem ao fix de `places-autocomplete`)
Trocar os 4 `fetch` brutos por `supabase.functions.invoke('estimate-return', { body })`. Locais:
- `src/pages/TransportsPage.tsx` — `fetchTravelMinutes` e `fetchRoutePreview`.
- `src/components/TransportDynamicIsland.tsx` — preview polyline e LIVE_ROUTE.

`functions.invoke` anexa o JWT da sessão automaticamente e aguarda a sessão estar pronta, eliminando o `Bearer ` vazio.

### 2. `locationTracker`: retomar GPS quando a viagem ainda é minha
- Quando o `publish` retornar erro de ownership, **não destruir o watch** se a checagem mostrar que `motorista_user_id === uid` e `tracking_started_by_user_id IS NULL` ou `=== uid`. Apenas re-tentar.
- Manter `latitude/longitude` na UI durante erros transitórios (não zerar no `stopInternal` quando a parada foi por erro recuperável).
- Garantir que ao mudar para um transporte novo o tracker faça `getCurrentPosition` imediato (já faz) e mantenha `watchPosition` mesmo se o primeiro `publish` falhar.

### 3. Auto-arm GPS global (App-level), não só em `/transports`
Extrair o `useEffect` de auto-arm para um hook `useDriverAutoArm()` montado uma vez no `App`/`Layout`, para que o motorista designado tenha seu GPS reivindicado assim que abre o app em qualquer rota. Mantém a mesma lógica de prioridade já validada (DB ownership → cache local → designated driver → cleanup).

### 4. `useTransportLocation`: refetch em visibilidade/reconexão
- Recarregar a última posição quando `document.visibilitychange === 'visible'` ou `window.online`.
- Já temos o canal Realtime; só adicionar o refetch evita "card sem live" depois de tela bloqueada.

### 5. UX/feedback claros (não invasivo)
- Mensagem específica quando `motorista_user_id` é diferente do usuário logado e o card está aguardando: "Aguardando o motorista X abrir o app".
- Indicador de "última atualização há Xs" no card ao vivo (usando `location.updated_at`).
- Toast amigável quando Maps API falha (já há `try/catch`, só exibir uma vez por sessão para não spammar).

### 6. Verificações operacionais (sem código)
- Confirmar que `GOOGLE_MAPS_API_KEY` no Cloud está com restrição **None** (memória do projeto).
- Avisar (toast/onboarding curto) que o motorista precisa abrir o app no celular dele uma vez para o GPS começar — esse é o único caminho seguro com a RPC atual.

## Arquivos que vamos mexer

- `src/pages/TransportsPage.tsx` — 2 funções fetch → `invoke`; mover auto-arm para hook global.
- `src/components/TransportDynamicIsland.tsx` — 2 fetch → `invoke`; UX de última atualização.
- `src/lib/locationTracker.ts` — não destruir state em erros recuperáveis; retry inteligente.
- `src/hooks/useLocationTracking.ts` — `useTransportLocation` com refetch em `visibilitychange`/`online`.
- `src/hooks/useDriverAutoArm.ts` — novo hook; montado em `src/App.tsx` (ou layout).
- Sem alterações no banco, RPCs, RLS ou Edge Functions.

## Critérios de aceite

- Sem 401 em `estimate-return` mesmo logo após login.
- Motorista designado vê o pino vivo dele ao abrir o app em qualquer rota, não só `/transports`.
- Card mostra "atualizado há Xs" e não "pisca" quando ocorre erro temporário de GPS.
- Mapa volta a aparecer automaticamente após reconexão/tela bloqueada.
- Coordenadores que iniciam viagem remotamente continuam não travando o GPS para o motorista (fluxo atual preservado).
- Nenhum usuário, RLS ou política altera-se; histórico e transportes existentes seguem funcionando.

Posso seguir implementando esse plano?
