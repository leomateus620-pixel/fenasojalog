

## Corrigir contagem regressiva (dias inflacionados em +1)

### Diagnóstico
Em `src/components/dashboard/FenasojaCountdown.tsx`, linha 19:

```ts
const days = Math.ceil(diff / 86_400_000);
```

`Math.ceil` arredonda **para cima**, então sempre que houver qualquer fração de dia restante (o que é quase sempre o caso), o contador exibe **1 dia a mais** do que realmente falta. Como horas/minutos/segundos já são mostrados em blocos separados via módulo (`diff % 86_400_000`), o correto é usar `Math.floor` para `days` — caso contrário o card mostra, por exemplo, `07d 12h 30m 15s` quando na verdade faltam `6d 12h 30m 15s`.

A data-alvo (`2026-05-01T10:00:00-03:00`) e o fuso (offset `-03:00` explícito = horário de Brasília) estão **corretos**. O problema é apenas o cálculo dos dias.

### Verificação rápida (data atual: 24/04/2026)
- Alvo: 01/05/2026 10:00 SP
- Agora: 24/04/2026 ~03:35 SP (UTC-3)
- Diferença real: **~7 dias e 6h**
- Hoje o card mostra: `08` dias (incorreto, deveria mostrar `07`)
- Quando o usuário viu mudar para `07`, na verdade faltavam 6 dias e poucas horas

### Mudança

| Arquivo | Linha | De | Para |
|---|---|---|---|
| `src/components/dashboard/FenasojaCountdown.tsx` | 19 | `const days = Math.ceil(diff / 86_400_000);` | `const days = Math.floor(diff / 86_400_000);` |

### Critério de aceite
1. Em 24/04/2026 às 10:00 SP, faltando exatamente 7 dias para 01/05 10:00, o card mostra `07d 00h 00m 00s` (e não `08d`)
2. Quando faltam menos de 24h, mostra `00` dias + horas restantes (não mais `01d 23h`)
3. Horas, minutos e segundos continuam decrescendo normalmente em sincronia com os dias
4. Mensagem celebratória ainda aparece corretamente em 01/05/2026 10:00 SP
5. Barra de progresso e textos auxiliares (`headline`) precisam refletir o novo valor — verificar:
   - `parts.days > 1` → "Faltam N dias…"
   - `parts.days === 1` → "Falta 1 dia…"
   - `parts.days === 0` → "Faltam poucas horas…" (esse caso agora aparece corretamente nas últimas 24h, não só nas últimas <1h como antes)

### Compatibilidade
- Zero impacto em outros componentes
- Apenas 1 caractere alterado (`ceil` → `floor`)

