# Plano definitivo — Localização real do motorista em tempo real

## Diagnóstico (o que realmente está quebrado hoje)

Auditando o código atual, três problemas explicam o "carro falso" no mapa:

1. **`DriverLocationMap` cria uma polyline-fallback `[motorista → destino]` em linha reta (linhas 84–86 de `src/components/DriverLocationMap.tsx`)** quando não há `routePolyline`. Mesmo com `hideDriverMarker`, isso desenha uma linha saindo da `latitude/longitude` recebida (no fallback é a *origem do transporte*) — ou seja, dá a impressão visual de "trajeto do motorista" partindo da origem planejada. Esse é o principal causador da sensação de "ícone posicionado em ponto fixo/origem".

2. **`FullscreenMapDialog` recebe `latitude/longitude = location ?? originCoords ?? destCoords` (linha 613–614 de `TransportDynamicIsland.tsx`)** e repassa para `DriverLocationMap` *sem* `hideDriverMarker`. Quando ainda não há GPS real, o mapa fullscreen renderiza o ícone 🚗 *na origem* do transporte. É exatamente o "carro estacionado em Santa Rosa" relatado.

3. **`useDriverAutoArm` reivindica GPS para qualquer transporte ativo onde `motorista_user_id === user.id`** assim que o app monta. Em iOS/Safari isso roda *fora* de gesto e falha em silêncio — então o motorista logado nunca chega a publicar coordenadas reais e os outros usuários só veem o "preview da rota planejada", confundido com tracking.

Permissões hoje já estão corretas no banco (`publish_transport_location` exige `motorista_user_id = auth.uid()` e ownership por `tracking_device_id`), e o `useTransportLocation` lê `transport_locations` em realtime sem restrição — ou seja, **a regra "todos visualizam, só o motorista publica" já está honrada no backend**. O problema é puramente no frontend mascarando ausência de GPS real com dados planejados.

## O que vamos mudar

### 1. Remover qualquer marcador/linha derivada de origem/destino

`src/components/DriverLocationMap.tsx`
- Aceitar `latitude/longitude` opcionais (`null`).
- Se `hideDriverMarker` estiver ativo OU se não houver coordenadas, **não desenhar marcador, não desenhar círculo de accuracy, não desenhar polyline-fallback** entre motorista e destino. Só desenhar a `routePolyline` real (>2 pontos vindo da Routes API) e os marcadores de origem/destino.
- Centralizar/fitar o mapa pela polyline + destino quando não houver GPS, em vez de centralizar nas coords passadas.
- Tornar o ícone do motorista 100% condicionado a coordenadas reais recebidas via prop (o pai garante que só passa quando `location && !location.isStale`).

### 2. Não passar coordenadas falsas ao Fullscreen

`src/components/TransportDynamicIsland.tsx`
- `FullscreenMapDialog` passa a receber `latitude/longitude = null` quando `!location || location.isStale`, e um booleano novo `hasRealDriverLocation`.
- O Fullscreen abre normalmente para visualizadores e para o motorista — mas o ícone 🚗 só aparece quando `hasRealDriverLocation === true`. Caso contrário mostra um chip "Aguardando localização real do motorista" (ida) / "Aguardando GPS do motorista no retorno".
- O preview da rota base (chamado a `estimate-return` mode `ROUTE_PREVIEW`) continua, **mas explicitamente identificado como "rota planejada"**, nunca como localização do motorista.

`src/components/transport/FullscreenMapDialog.tsx`
- Aceitar `latitude?: number | null`, `longitude?: number | null`, `hasRealDriverLocation: boolean`.
- Passar `hideDriverMarker={!hasRealDriverLocation}` para `DriverLocationMap`.
- Esconder a `NavigationMap3D` (vista navegação) quando não houver GPS real — ela só faz sentido com posição real.
- Mostrar overlay claro: "Aguardando localização real do motorista".

### 3. Eliminar auto-arm fora de gesto e restringir tracking só ao motorista designado

`src/hooks/useDriverAutoArm.ts`
- **Remover a reivindicação automática (passos 2 e 3 atuais).** Manter apenas a continuidade quando o usuário **já é dono no banco** (`tracking_started_by_user_id === user.id`) — nesse caso pode chamar `locationTracker.start` porque o navegador já concedeu permissão antes (ou o Service Worker tem cached permission). Em qualquer outro caso o GPS só inicia via clique no banner ou no botão "Ativar GPS desta viagem".
- Garantir explicitamente: se `motorista_user_id !== user.id` para qualquer transporte ativo, **nunca** chamar `locationTracker.start`. Isso elimina o risco de admins/outros motoristas dispararem watchPosition por engano.

`src/lib/locationTracker.ts`
- Adicionar uma trava no `start()`: refetch curto de `motorista_user_id` antes de chamar `navigator.geolocation.*`. Se `motorista_user_id` existir e for diferente de `userId`, abortar com erro claro "Apenas o motorista designado pode ativar o GPS".
- Logar (`console.info`) cada transição com prefixos `[gps:start]`, `[gps:fix]`, `[gps:publish-ok]`, `[gps:publish-block]` para o painel de diagnóstico.

### 4. Banner e CTA no card só para o motorista designado

`src/components/DriverGpsBanner.tsx` e bloco "Ativar GPS desta viagem" em `TransportDynamicIsland.tsx`
- Manter a lógica atual (já checa `motorista_user_id === user.id`), mas adicionar `gpsClaimedByOther === false` como condição estrita e exibir uma faixa neutra para os demais usuários do tipo "Visualizando trajeto de {motorista}. Localização em tempo real." quando `location && !location.isStale && !isAssignedDriver`.

### 5. Painel de Diagnóstico (modo dev/admin)

Novo componente `src/components/transport/TransportLocationDiagnostics.tsx`, renderizado dentro da ilha apenas quando o usuário é admin (`get_user_org_role === 'admin'`) e quando uma flag local `localStorage.getItem('fenasoja_gps_debug') === '1'` estiver ativa. Mostra, por transporte ativo:

- `transport_id`, `motorista`, `fase`, `status`
- `currentUser.id`, `assignedDriver.user_id`
- `canViewTransportMap`, `canUpdateTransportLocation`, `canControlTrip`
- `geolocation_permission` (via `navigator.permissions.query`)
- `watchPosition_status` (do snapshot do `locationTracker`)
- Última coord recebida do navegador (lat/lng/accuracy/speed/heading/timestamp)
- Última coord no banco (de `transport_locations`)
- Coord usada no marcador atual + `source` (`gps` | `database` | `realtime` | `none`)
- Idade da localização em segundos
- Logs recentes do tracker (buffer in-memory de 20 últimas linhas)

A ativação fica em `Configurações → Diagnóstico de transporte` (toggle simples que escreve a flag em `localStorage`).

### 6. Estados de UI explícitos

Em vez do texto genérico atual, padronizar:

- Sem GPS ainda: **"Aguardando localização real do motorista"**
- GPS antigo: **"Última localização recebida há X min — aguardando atualização"**
- Permissão negada (motorista designado): **"Permissão de localização negada. Ative no navegador para enviar sua posição."**
- Visualizador (não motorista): **"Visualizando trajeto de {motorista} · localização em tempo real"** quando há fix; ou "Aguardando localização do motorista" quando não há.
- Botão de controle de viagem para visualizadores: aparece desabilitado com tooltip **"Apenas o motorista responsável pode controlar esta viagem."**

## Banco / RLS

Nenhuma mudança estrutural necessária — as policies atuais já implementam corretamente "leitura para todos os membros da org, escrita apenas pelo motorista vinculado e dispositivo dono". A `publish_transport_location` já bloqueia escrita por outro usuário/dispositivo.

Vamos apenas confirmar via inspeção (sem migrations novas) que `transport_locations` está no publication `supabase_realtime`. Caso não esteja, criamos uma migration mínima `ALTER PUBLICATION supabase_realtime ADD TABLE public.transport_locations;`.

## Arquivos tocados

- `src/components/DriverLocationMap.tsx` (remover fallback de polyline e marcador derivado)
- `src/components/TransportDynamicIsland.tsx` (não passar coords falsas, exibir estados claros)
- `src/components/transport/FullscreenMapDialog.tsx` (aceitar lat/lng nulos + flag `hasRealDriverLocation`)
- `src/components/DriverGpsBanner.tsx` (texto/condições neutras para visualizadores)
- `src/hooks/useDriverAutoArm.ts` (remover claim automático fora de gesto)
- `src/lib/locationTracker.ts` (trava extra de motorista designado + logs de diagnóstico)
- `src/components/transport/TransportLocationDiagnostics.tsx` (novo)
- `src/pages/SettingsPage.tsx` (toggle do modo diagnóstico)
- (condicional) migration adicionando `transport_locations` ao publication realtime, se faltar.

## Critério de aceite

- O ícone 🚗 nunca aparece sem que `useTransportLocation` retorne uma coord fresca (`!isStale`). Sem GPS real → sem carro, em qualquer mapa (card, fullscreen, navegação).
- Quando o motorista designado clica em "Ativar GPS desta viagem", `watchPosition` inicia, a coord chega ao banco, o realtime entrega para todos os membros da org, e o ícone aparece *para todos* — vindo do banco/realtime, não da Google Maps API.
- Visualizadores nunca disparam `watchPosition`. Verificável no painel de diagnóstico: `watchPosition_status = inativo` para quem não é o motorista vinculado.
- Botões de controle (Iniciar / Cheguei / Iniciar retorno / Finalizar) só funcionam para o motorista vinculado; aparecem desabilitados com mensagem clara para os demais.
- Em iPhone/Safari o GPS é destravado pelo botão "Ativar GPS desta viagem" e o marcador passa a se mover quando o motorista anda fisicamente.
- Painel de diagnóstico mostra `source = gps` no aparelho do motorista e `source = realtime` para os demais — nunca `origin`, `destination`, `route` ou `fallback`.
