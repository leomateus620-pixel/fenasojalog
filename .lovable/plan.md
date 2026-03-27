

# Mostrar KM Ida e Volta em Cada Transporte

## Contexto
A tabela `transports` já possui a coluna `distancia_estimada_km`, mas não está sendo populada nem exibida. O sistema já tem a edge function `estimate-return` que usa Google Routes API para calcular distâncias reais.

## Solução

### 1. Mapa de distâncias conhecidas (fallback estático)
Criar um mapa de distâncias conhecidas de ida (Santa Rosa → destino) no arquivo `src/lib/utils.ts` para uso imediato sem chamada à API:

```typescript
const KNOWN_DISTANCES_KM: Record<string, number> = {
  'Aeroporto_Chapecó': 185,
  'Aeroporto_Santo Ângelo': 55,
  'Aeroporto_Passo Fundo': 210,
  'Aeroporto_Porto Alegre': 490,
  'Parque': 3,
  'Hotel': 2,
  'Centro': 2,
  'Escolta Policial': 2,
  'Outros': 0,
};

export function getRoundTripKm(titulo: string, vooCidade?: string): number | null {
  const key = titulo === 'Aeroporto' && vooCidade ? `Aeroporto_${vooCidade}` : titulo;
  const oneWay = KNOWN_DISTANCES_KM[key];
  if (oneWay === undefined || oneWay === 0) return null;
  return oneWay * 2;
}
```

### 2. Exibir KM no TransportCard (`src/components/transport/TransportCard.tsx`)
Na linha da rota (Dynamic Island, linha que mostra "Santa Rosa → Passo Fundo"), adicionar o KM ida+volta:

- Priorizar `t.distancia_estimada_km` (salvo no banco) se existir
- Fallback: usar `getRoundTripKm(t.titulo, t.voo_cidade)`
- Exibir como chip nos info chips: `🛣️ ~420 km (ida e volta)`

### 3. Calcular e salvar KM ao criar transporte (`src/components/transport/TransportForm.tsx`)
No formulário, quando o título e cidade são selecionados:

- Mostrar label informativo com o KM estimado ida+volta
- O valor será passado como `distancia_estimada_km` no payload de criação

### 4. Salvar no payload de criação (`src/pages/TransportsPage.tsx`)
Ao submeter o formulário de criação, incluir `distancia_estimada_km` calculado via `getRoundTripKm()`.

## Arquivos alterados
1. `src/lib/utils.ts` — adicionar `getRoundTripKm()`
2. `src/components/transport/TransportCard.tsx` — exibir chip de KM ida+volta
3. `src/components/transport/TransportForm.tsx` — mostrar KM estimado no form
4. `src/pages/TransportsPage.tsx` — incluir `distancia_estimada_km` no payload

## Validação
- Valores baseados em distâncias reais Google Maps (Santa Rosa–RS)
- Sem chamadas extras à API (usa mapa estático para performance)
- Transportes existentes com `distancia_estimada_km` salvo usam o valor do banco
- Transportes sem valor salvo usam fallback estático
- "Outros" sem cidade conhecida não mostra KM (evita números genéricos)

