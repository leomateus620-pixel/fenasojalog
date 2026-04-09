

# Rota real no mapa em tempo real (usando Routes API + Roads API)

## Problema atual

1. **Rota estática**: O polyline é salvo no banco apenas na criação do transporte (origem fixa → destino). Durante a viagem, o mapa mostra uma **linha reta tracejada** entre o motorista e o destino porque a chamada de ETA ao vivo (`RETURN_TO_ORIGIN`) não retorna polyline.
2. **Sem recálculo de rota**: Conforme o motorista se move, a rota não é recalculada — apenas o ETA é atualizado a cada 2 minutos.

## Solução

Usar a Routes API (já habilitada) para buscar a rota real (polyline) junto com o ETA durante o acompanhamento ao vivo, e exibir essa rota no mapa.

## Alterações

### 1. `supabase/functions/estimate-return/index.ts`

- Modificar o modo `RETURN_TO_ORIGIN` para **sempre incluir o polyline** na resposta (adicionar `encodedPolyline` ao fieldMask)
- Adicionar novo modo `LIVE_ROUTE` que aceita `origin_lat/lng` + `dest_lat/lng` e retorna duração + distância + polyline (rota do motorista até o destino, não de volta à origem)
- Assim o frontend pode pedir a rota real motorista→destino E motorista→origem

### 2. `src/components/TransportDynamicIsland.tsx`

- No `useEffect` de ETA ao vivo, trocar o modo para `LIVE_ROUTE` passando as coordenadas do destino real do transporte
- Extrair o `polyline` da resposta e decodificá-lo para atualizar o mapa com a rota rodoviária real
- Adicionar state `livePolyline` que substitui o `routePolyline` estático quando disponível
- Passar `livePolyline || routePolyline` para o componente `DriverLocationMap`
- Fazer uma segunda chamada `RETURN_TO_ORIGIN` (com polyline) para calcular ETA de retorno

### 3. `src/components/DriverLocationMap.tsx`

- Quando receber um `routePolyline` com pontos suficientes (>2), desenhar como linha **sólida** (não tracejada) para indicar rota real
- Manter a linha tracejada apenas para fallback de linha reta (≤2 pontos)
- Ajustar `fitBounds` para incluir toda a polyline, não apenas motorista + destino

### 4. `src/components/transport/FullscreenMapDialog.tsx`

- Passar `livePolyline` também para o mapa fullscreen, garantindo consistência

## Fluxo durante viagem ativa

```text
A cada 2 min (quando GPS atualiza):
  1. Frontend envia posição do motorista → edge function (modo LIVE_ROUTE)
  2. Edge function chama Google Routes API com polyline no fieldMask
  3. Retorna: duração, distância, polyline encodado
  4. Frontend decodifica polyline → atualiza mapa com rota real
  5. Atualiza ETA e distância restante
```

## Resultado esperado

- Mapa mostra a rota rodoviária real (curvas, estradas) em vez de linha reta
- ETA baseado em tráfego real atualizado a cada 2 minutos
- Rota recalculada conforme motorista se move

| Arquivo | Ação |
|---|---|
| `supabase/functions/estimate-return/index.ts` | Adicionar modo LIVE_ROUTE com polyline |
| `src/components/TransportDynamicIsland.tsx` | Buscar e exibir rota ao vivo |
| `src/components/DriverLocationMap.tsx` | Estilo sólido para rota real, fitBounds na polyline |
| `src/components/transport/FullscreenMapDialog.tsx` | Passar polyline ao vivo |

