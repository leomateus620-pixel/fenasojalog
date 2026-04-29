Plano de correção do GPS, mapas e rotas dos transportes

Diagnóstico encontrado

1. A Dynamic Island está exibindo mapa em transportes pendentes porque o componente mostra preview de rota quando existe `rota_polyline` ou `previewPolyline`, mesmo com `status = pendente`. Isso bate com os anexos: cards pendentes renderizam mini mapa antes de a viagem iniciar.

2. O rastreamento ao vivo hoje não está preso ao usuário que iniciou a viagem. O fluxo atual salva um `trackingTransportId` no `localStorage` do navegador e também tenta auto-retomar por `motorista_user_id`. Isso pode fazer:
   - um usuário que apenas abriu/operou a tela publicar localização sem ser o iniciador real;
   - um transporte de teste continuar salvo localmente no navegador;
   - o motorista designado começar a publicar localização ao abrir o app, mesmo se outra pessoa iniciou a viagem.

3. O banco está sem linhas ao vivo em `transport_locations` para os transportes ativos no momento. Ou seja, os mapas ativos estão sem GPS publicado de fato e acabam caindo para preview/fallback.

4. Há inconsistências reais de georreferência:
   - existem transportes “Aeroporto” para Santo Ângelo com `voo_cidade` nulo e coordenadas de destino nulas; quando o código tenta resolver, pode cair em fallback errado.
   - destinos genéricos como “Centro / Passo Fundo” ou hotel/cidade estão usando fallback de Santa Rosa/Hotel quando não possuem coordenadas exatas.
   - origem está sendo salva quase sempre como Santa Rosa fixa, mesmo quando o texto operacional indica “hotel até cidade de destino”. Para esses casos, a origem precisa ser geocodificada pelo endereço/hotel, não assumida como Parque/Santa Rosa.

Correção proposta

1. Esconder mapas nos pendentes
- Alterar `TransportDynamicIsland.tsx` para renderizar mapa somente quando o transporte estiver em viagem ou em fase de acompanhamento:
  - `em_andamento`
  - `chegou_destino`
  - `em_retorno`
- Para `pendente`, manter apenas a linha compacta com rota “Partida → Destino → Retorno”, status, tempo/distância e botão “Iniciar”, sem mapa.
- Remover a condição que mostra mapa para pendentes quando existe `rota_polyline`/preview.

2. Separar “visualizar mapa” de “publicar GPS”
- Qualquer usuário autenticado da organização continuará podendo abrir detalhes/mapa e acompanhar transportes de outros motoristas.
- Apenas o usuário/dispositivo que iniciou aquela fase da viagem publicará GPS ao vivo.
- Remover o comportamento que auto-retoma GPS por `motorista_user_id`.
- Remover risco de `localStorage` antigo interferir em transportes de teste.

Fluxo desejado:
```text
Usuário A clica Iniciar
  -> backend marca tracking_started_by_user_id = Usuário A
  -> somente navegador do Usuário A liga GPS para esse transporte

Usuário B abre o mesmo transporte
  -> vê mapa e localização ao vivo publicada pelo Usuário A
  -> não publica a própria localização automaticamente
```

3. Persistir no backend quem iniciou o rastreamento
- Criar migração para adicionar campos de controle no transporte, por exemplo:
  - `tracking_started_by_user_id`
  - `tracking_started_at`
  - `tracking_phase` ou reaproveitar `fase_atual`
- Ao iniciar ida (`start`), gravar o usuário que clicou em iniciar.
- Ao iniciar retorno (`start_return`), atualizar o usuário que iniciou a volta.
- Ajustar `publish_transport_location` para aceitar publicação prioritariamente do `tracking_started_by_user_id` do transporte ativo.
- Para evitar bloqueios em transportes antigos/sem dono de tracking, permitir fallback seguro: se o transporte ativo ainda não tiver `tracking_started_by_user_id`, o primeiro membro autenticado que publicar assume esse campo automaticamente.

4. Limpar cache/localStorage de testes
- Trocar a chave simples `fenasoja_tracking_transport` por uma chave com dono/fase, por exemplo contendo:
  - `transportId`
  - `userId`
  - `phase`
  - `startedAt`
- Ao carregar a página, validar contra o transporte atual:
  - status precisa estar ativo;
  - usuário logado precisa ser o `tracking_started_by_user_id`;
  - fase precisa bater;
  - se não bater, limpar o cache imediatamente.
- Isso evita que testes feitos pelo usuário atual atrapalhem o motorista depois.

5. Corrigir origem/destino e geocodificação
- Centralizar a resolução de coordenadas em uma função única usada pelo backend:
  - aeroportos por cidade quando `voo_cidade` existir;
  - se `titulo = Aeroporto` mas `voo_cidade` estiver vazio, inferir pelo texto de `destino` (“Santo Ângelo”, “Passo Fundo”, “Chapecó”, “Porto Alegre”);
  - destinos de cidade/hotel/outros via Google Maps API/Geocoding quando não houver coordenada salva;
  - origem via Google Maps API quando o texto não for claramente Santa Rosa/Parque.
- Ajustar `estimate-return` e `transport-lifecycle` para usarem essa mesma lógica.
- Recalcular `rota_polyline`, distância e duração quando origem/destino forem corrigidos.

6. Corrigir os dados já cadastrados
- Criar migração/rotina de reparo para os transportes pendentes/ativos:
  - Santo Ângelo sem `voo_cidade`: preencher `voo_cidade = 'Santo Ângelo'` quando `destino` indicar Santo Ângelo;
  - Passo Fundo sem coordenadas: preencher coordenadas corretas quando o destino indicar Passo Fundo;
  - apagar polylines curtas/incorretas antigas (`poly_len` muito pequeno ou rota gerada com fallback);
  - remover registros de `transport_locations` de transportes não ativos;
  - preencher `tracking_started_by_user_id` dos ativos a partir do `audit_log` quando existir.
- Para casos que dependem de endereço exato de hotel, usar Google Maps API para geocodificar e salvar coordenadas antes de gerar a rota.

7. Ajustes visuais e de experiência
- Em transporte ativo sem GPS ainda, mostrar um estado claro: “Aguardando GPS do usuário que iniciou a viagem”, sem usar destino errado como posição do carro.
- Em mapas ativos, priorizar sempre:
  1. localização ao vivo publicada em `transport_locations`;
  2. rota Google Maps da posição ao vivo até destino;
  3. rota planejada origem → destino somente como fallback visual.
- O mapa em tela cheia continuará disponível para acompanhamento por qualquer membro da organização.

Arquivos que serão alterados

- `src/components/TransportDynamicIsland.tsx`
  - esconder mapa em pendentes;
  - ajustar fallback visual;
  - abrir mapa apenas para transporte ativo/chegou destino/retorno.

- `src/pages/TransportsPage.tsx`
  - remover auto tracking por motorista designado;
  - validar cache por usuário/fase;
  - ativar GPS somente quando o usuário atual iniciou a fase da viagem.

- `src/hooks/useLocationTracking.ts`
  - publicar GPS somente quando o backend confirmar que o usuário atual é o dono do tracking da fase;
  - limpar cache inválido;
  - manter assinatura realtime para visualização por qualquer usuário autorizado.

- `supabase/functions/transport-lifecycle/index.ts`
  - gravar `tracking_started_by_user_id` no start/start_return;
  - corrigir backfill de origem/destino;
  - gerar rota via Google Maps API com origem/destino corretos.

- `supabase/functions/estimate-return/index.ts`
  - aceitar origem/destino explícitos corretamente;
  - melhorar fallback por texto/cidade;
  - evitar retornar rota de Santa Rosa quando o destino real é Santo Ângelo/Passo Fundo.

- `supabase/migrations/*`
  - adicionar campos de tracking;
  - atualizar `publish_transport_location`;
  - corrigir dados existentes e remover dados/cache de tracking no banco.

Resultado esperado

- Pendentes não mostram mapa na Dynamic Island.
- Qualquer usuário consegue abrir e acompanhar o mapa de qualquer transporte permitido.
- A localização ao vivo vem do usuário que iniciou a viagem/fase, não necessariamente do motorista cadastrado e não de quem apenas visualizou.
- Cache local de testes não interfere nos motoristas.
- Santo Ângelo, Passo Fundo e demais destinos passam a usar coordenadas corretas e rotas geradas pela Maps API.
- Transportes ativos sem GPS mostram estado de espera correto, sem marcador/rota enganosa.