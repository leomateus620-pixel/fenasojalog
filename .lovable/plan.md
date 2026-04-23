

## Atualizar contagem regressiva para 01/05 às 10:00 e remover badge de datas

### Mudanças

| Arquivo | Mudança |
|---|---|
| `src/components/dashboard/FenasojaCountdown.tsx` | 2 alterações: |
| | 1. Alterar `TARGET_ISO` de `2026-05-01T00:00:00-03:00` para `2026-05-01T10:00:00-03:00` (contagem até 01/05 às 10h) |
| | 2. Remover o span que exibe "28/04 → 09/05" (linhas 129-131) |

### Resultado esperado
- O contador regressivo agora conta até **01 de maio de 2026 às 10:00** (horário de Brasília)
- O badge de datas no canto superior direito do card é removido
- O texto "Faltam N dias para a abertura oficial" permanece inalterado

