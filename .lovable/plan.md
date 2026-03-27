

# Atualizar Distâncias de Rotas com Valores Reais

## O que muda

Atualizar o mapeamento estático de distâncias em `src/lib/utils.ts` com os valores reais fornecidos pelo usuário (ida e volta):

| Rota | Valor atual (ida×2) | Novo valor (ida e volta) |
|---|---|---|
| Santo Ângelo | 110 km | 142,6 km |
| Chapecó | 370 km | 630 km |
| Passo Fundo | 420 km | 560 km |
| Porto Alegre | 980 km | 1.024 km |

## Implementação

Alterar `KNOWN_DISTANCES_KM` para armazenar valores de **ida e volta** diretamente (em vez de ida × 2) e renomear para `KNOWN_ROUNDTRIP_KM`. Remover a multiplicação `* 2` em `getRoundTripKm`.

```typescript
const KNOWN_ROUNDTRIP_KM: Record<string, number> = {
  'Aeroporto_Chapecó': 630,
  'Aeroporto_Santo Ângelo': 143,
  'Aeroporto_Passo Fundo': 560,
  'Aeroporto_Porto Alegre': 1024,
  'Parque': 6,
  'Hotel': 4,
  'Centro': 4,
  'Escolta Policial': 4,
};

export function getRoundTripKm(...): number | null {
  ...
  const km = KNOWN_ROUNDTRIP_KM[key];
  if (km === undefined || km === 0) return null;
  return km; // já é ida e volta
}
```

## Arquivo alterado
- `src/lib/utils.ts` — atualizar mapa de distâncias e remover `* 2`

