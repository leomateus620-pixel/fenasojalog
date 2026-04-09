

# Corrigir detecção de conflito de veículos

## Problema

A função `isVehicleBusyAt` verifica apenas se o horário de início do novo transporte é anterior ao retorno estimado do transporte existente (`newStart < existingReturn`). Isso é uma verificação de "sobreposição" incompleta — falta verificar se o transporte existente começa antes do fim estimado do novo transporte.

Exemplo real: AMAROK tem transporte pendente no dia 01/05 às 03:15. Ao tentar agendar um transporte no dia 29/04, o sistema diz "em uso até ~10:00" porque `29/04 10:25 < 01/05 05:15` é verdadeiro, mesmo que os transportes sejam em dias completamente diferentes.

## Solução

Corrigir a lógica de sobreposição temporal em `isVehicleBusyAt` e `getVehicleConflictInfo` para verificar sobreposição real entre dois intervalos de tempo:

**Dois intervalos [startA, endA] e [startB, endB] se sobrepõem quando:**
`startA < endB AND startB < endA`

Onde:
- `startA` / `endA` = início e retorno estimado do **novo** transporte
- `startB` / `endB` = início e retorno estimado do transporte **existente**

Para o novo transporte, estimar o retorno usando a mesma lógica de duração (título ou 60min padrão).

## Alterações

### `src/pages/TransportsPage.tsx`

Atualizar `isVehicleBusyAt` e `getVehicleConflictInfo`:

```
// Antes (incorreto):
return new Date(startTime) < estReturn;

// Depois (correto - verifica sobreposição real):
const newStart = new Date(startTime);
const newEnd = new Date(newStart.getTime() + (durationMin) * 60000); // duração estimada do novo
return newStart < estReturn && existingStart < newEnd;
```

Receber opcionalmente o título/duração do novo transporte para calcular seu fim estimado, ou usar um fallback de 60-120 minutos.

| Arquivo | Ação |
|---|---|
| `src/pages/TransportsPage.tsx` | Corrigir lógica de sobreposição em `isVehicleBusyAt` e `getVehicleConflictInfo` |

