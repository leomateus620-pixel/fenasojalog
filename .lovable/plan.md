

# Corrigir KM estimado para destinos como Passo Fundo

## Problema

A função `getRoundTripKm` resolve a distância usando apenas `titulo` + `voo_cidade`. Quando o transporte tem `titulo` diferente de "Aeroporto" (ex: "Centro", "Outros") mas o `destino` é "Passo Fundo", o sistema retorna 4 km (valor do "Centro") em vez de 560 km.

## Solução

Adicionar o campo `destino` como parâmetro de fallback em `getRoundTripKm`. Se a resolução por `titulo`/`voo_cidade` retornar um valor genérico (≤10 km) e o `destino` corresponder a uma cidade conhecida com distância maior, usar o valor correto.

## Alterações

### `src/lib/utils.ts`

- Adicionar mapa de destinos conhecidos por nome de cidade:
  ```
  'Passo Fundo': 560, 'Chapecó': 630, 'Santo Ângelo': 143, 'Porto Alegre': 1024
  ```
- Atualizar `getRoundTripKm` para aceitar `destino` como 3º parâmetro opcional
- Lógica: se o resultado pelo título for ≤10 km e o `destino` contiver uma cidade conhecida com distância maior, usar essa distância

### `src/components/transport/TransportCard.tsx`

- Passar `t.destino` para `getRoundTripKm(t.titulo, t.voo_cidade, t.destino)`

### `src/pages/TransportsPage.tsx`

- Atualizar chamadas a `getRoundTripKm` para incluir o destino

### `src/lib/kmConsolidation.ts`

- Atualizar chamada para incluir `t.destino`

### `src/components/transport/TransportForm.tsx`

- Atualizar preview de KM para incluir destino

| Arquivo | Ação |
|---|---|
| `src/lib/utils.ts` | Adicionar fallback por destino em `getRoundTripKm` |
| `src/components/transport/TransportCard.tsx` | Passar `destino` |
| `src/pages/TransportsPage.tsx` | Passar `destino` nas chamadas |
| `src/lib/kmConsolidation.ts` | Passar `destino` |
| `src/components/transport/TransportForm.tsx` | Passar `destino` no preview |

