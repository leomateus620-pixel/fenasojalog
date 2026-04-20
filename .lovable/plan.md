

## Diagnóstico

Hoje o ciclo de status é: `pendente → em_andamento → concluido`. Quando o motorista chega no destino, o operador clica em "Finalizar" e o transporte é fechado. Não há nenhuma fase intermediária para acompanhar o **trajeto de volta** (Destino → Origem) com mapa, ETA e tracking ao vivo — apesar de a contabilização interna (km, custo) já considerar ida + volta.

A captura mostra justamente isso: o card mostra `Origem → Destino → Origem` no header, mas o mapa, polyline e ETA só funcionam para a perna de **ida**.

## Solução: novo status `em_retorno`

Adicionar uma fase intermediária na máquina de estados, mantendo **um único registro de transporte** (sem duplicação) e **o mesmo veículo vinculado**.

```text
pendente → em_andamento → chegou_destino → em_retorno → concluido
                              (botão)        (tracking    (finalizar
                                              da volta)    com KM)
```

### Novos campos no banco (`transports`)

| Campo | Tipo | Uso |
|---|---|---|
| `chegada_destino_em` | `timestamptz` | timestamp da chegada no destino (auditoria) |
| `inicio_retorno_em` | `timestamptz` | timestamp do clique "Iniciar Volta" |
| `fim_retorno_em` | `timestamptz` | finalização do retorno (= `fim_real_em`) |
| `destino_lat_chegada` / `destino_lng_chegada` | `double precision` | coordenadas exatas do check-in (ponto de partida da volta) |
| `rota_polyline_volta` | `text` | polyline da rota Destino → Origem |
| `origem_lat` / `origem_lng` | `double precision` | coordenadas da origem (chegada da volta) |
| `somente_ida` | `boolean default false` | flag opcional para suprimir a volta |
| `fase_atual` | `text` (`'ida' | 'volta'`) | indica perna ativa para a UI |

Atualizar o enum `transport_status` adicionando `'chegou_destino'` e `'em_retorno'`.

Trigger `validate_transport`: ajustar para aceitar as novas transições e marcar `fim_real_em = now()` apenas em `concluido`.

### Edge function `transport-lifecycle`

Adicionar 3 novas ações (com mesma RBAC `admin/gestor/operador`):

1. **`arrive_destination`** — transição `em_andamento → chegou_destino`. Salva `chegada_destino_em`, `destino_lat_chegada/lng_chegada` (do último GPS em `transport_locations`), e mantém o tracking ativo (sem parar). Auditoria.
2. **`start_return`** — transição `chegou_destino → em_retorno`. Bloqueia se `somente_ida=true`. Define `inicio_retorno_em`, `fase_atual='volta'`. Dispara WhatsApp opcional ("Motorista iniciou retorno"). Auditoria.
3. **`complete_return`** — transição `em_retorno → concluido`. Define `fim_retorno_em`, `fim_real_em`, e segue o fluxo atual de `vehicle_usage` (KM saída/chegada — mantém comportamento atual).

A ação `start` existente continua igual (perna de ida). A ação `update` (modal "Finalizar") **não muda o status para `concluido` direto** se a fase for ida — em vez disso, sugere `chegou_destino`.

### Frontend

#### `TransportDynamicIsland.tsx`
- **Status `chegou_destino`**: mapa congelado no destino, badge âmbar "Chegou no destino", botão grande **"Iniciar Viagem de Volta"** (oculto se `somente_ida`).
- **Status `em_retorno`**: mesmo motor de tracking ativo (`useTransportLocation`), mas com `destCoords` = `(origem_lat, origem_lng)`, polyline = `rota_polyline_volta`, badge "Em rota de retorno" (cor distinta — roxo/índigo). ETA calculada via `estimate-return` com `mode: 'LIVE_ROUTE'` apontando para a origem.
- Header passa a destacar visualmente a perna ativa: `Origem → **Destino** → Origem` (ida) vs `Origem → Destino → **Origem**` (volta).

#### `TransportsPage.tsx` — `cycleStatus`
Reescrever a fila de transição:
```text
pendente → start (mutation existente)
em_andamento → arrive_destination (novo botão "Cheguei")
chegou_destino → start_return (botão "Iniciar Volta") OU pula direto para finalizar se somente_ida
em_retorno → abre modal Finalizar (KM devolução) → complete_return
```

#### `TransportDetailView.tsx`
Adicionar duas seções/abas claras:
- **Ida** — `inicio_real_em` → `chegada_destino_em`, polyline ida, KM ida (estimado).
- **Volta** — `inicio_retorno_em` → `fim_retorno_em`, polyline volta, KM volta (estimado).
Métricas totais (km_rodados, custo) seguem unificadas no card "Métricas da Viagem".

#### `TransportCard.tsx` / `TransportForm.tsx`
- Card: badge de fase ativa (Ida/Volta) e botão contextual.
- Form de criação: checkbox **"Transporte só ida"** (`somente_ida`), default `false`.

### Bloqueios de erro

- Tentar `start_return` sem `chegou_destino` → erro "Registre a chegada no destino primeiro".
- Tentar `arrive_destination` sem GPS recente → permite, mas sem coordenadas (usa destino conhecido como fallback).
- Trocar veículo durante `em_retorno` → backend rejeita.

### Restrição ao período Fenasoja (29/04 a 10/05/2026)

- Frontend: o botão "Iniciar Volta" e a UI da nova fase **só aparecem** se `inicio_em` cair entre `2026-04-29` e `2026-05-10` (SP). Fora desse intervalo, o fluxo permanece o atual (`em_andamento → concluido` direto).
- Backend `transport-lifecycle`: as ações `arrive_destination`, `start_return`, `complete_return` validam o mesmo intervalo e retornam 400 se fora.
- Para transportes `somente_ida=true` ou fora da janela, `cycleStatus` segue o caminho legado.

### Realtime / offline
- A tabela `transports` já está em `supabase_realtime`; mudanças de status propagam para todos os clientes sem ajuste.
- `useTransportLocation` continua persistindo posições — apenas o consumidor (Dynamic Island) reaponta `destCoords` para a origem quando `fase_atual='volta'`.

### Auditoria
Todas as 3 novas ações gravam linhas em `audit_log` com `entity='transports'`, `action='arrive_destination' | 'start_return' | 'complete_return'`, e `before/after_data` com timestamps.

## Arquivos a editar

| Arquivo | Mudança |
|---|---|
| `supabase/migrations/<novo>.sql` | enum + colunas + trigger ajustado |
| `supabase/functions/transport-lifecycle/index.ts` | 3 handlers novos + validação de janela 29/04–10/05 |
| `src/hooks/useTransports.ts` | mutações `arriveDestination`, `startReturn`, `completeReturn` |
| `src/components/TransportDynamicIsland.tsx` | UI fase volta, botão "Iniciar Volta", reaponto de `destCoords`/polyline |
| `src/components/transport/TransportCard.tsx` | badge de fase + botão contextual |
| `src/components/transport/TransportDetailView.tsx` | abas/seções Ida × Volta |
| `src/components/transport/TransportForm.tsx` | checkbox "Somente ida" |
| `src/pages/TransportsPage.tsx` | reescrever `cycleStatus` para a nova máquina de estados |
| `src/integrations/supabase/types.ts` | regenerado automaticamente |

## Critérios de aceite (validação)

1. Transporte criado para 02/05/2026 mostra botão "Cheguei" durante `em_andamento`.
2. Após "Cheguei", surge "Iniciar Volta"; mapa para de avançar a ida.
3. Ao iniciar a volta, polyline e ETA mostram **Destino → Origem** ao vivo.
4. Veículo vinculado permanece o mesmo (impossível trocar).
5. Ao chegar na origem, modal "Finalizar" abre com KM devolução; após salvar, status vira `concluido` e `vehicle_usage` é gravado uma única vez.
6. Marcar "Somente ida" suprime toda a fase de retorno (fluxo legado).
7. Transporte criado para 28/04 ou 11/05 segue o ciclo antigo (sem botão de volta).
8. `audit_log` registra `arrive_destination`, `start_return`, `complete_return` com timestamps.

