

## Exibir dias com eventos fora do período 01/05–10/05 nos chips da Fenasoja

### Diagnóstico
A página `FenasojaEventsPage` permite **criar** eventos em qualquer data (após a alteração anterior em `EventForm`), mas a lista de chips de dias é gerada por `buildFenasojaDays()` que retorna **apenas os 10 dias fixos de 01/05 a 10/05/2026**. Resultado: um evento criado em 30/04 existe no banco, mas não há chip para selecioná-lo — ele fica invisível na UI.

Confirmado em `src/pages/FenasojaEventsPage.tsx`:
- `buildFenasojaDays()` itera 10 dias a partir de `FENASOJA_RANGE.start` (01/05)
- `dayEvents` filtra por `selectedDate`, que só pode ser um desses 10 dias
- Eventos em datas externas nunca aparecem em `dayEvents` nem têm contador

### Mudança

| Arquivo | Mudança |
|---|---|
| `src/pages/FenasojaEventsPage.tsx` | Substituir `buildFenasojaDays()` (estático) por uma lista dinâmica computada via `useMemo` que **une**: (a) os 10 dias oficiais 01/05→10/05 + (b) qualquer dia extra que tenha pelo menos 1 evento, ordenados cronologicamente. |
| | Marcar visualmente os chips de dias **fora** do período oficial com um badge sutil "Extra" (cor `text-muted-foreground` + borda mais discreta) para deixar claro que não fazem parte da programação institucional principal, sem atrapalhar a leitura. |
| | Ajustar `initialDay`: se houver `today` na lista combinada, seleciona; senão mantém o primeiro dia oficial (01/05). |

### Detalhes técnicos
- A união usa `Set<string>` de chaves `YYYY-MM-DD` para deduplicar
- Ordenação por `localeCompare` (formato ISO ordena cronologicamente)
- Os dias oficiais continuam sempre visíveis mesmo sem eventos (preserva comportamento atual)
- Dias extras só aparecem quando têm eventos — quando o último evento extra é excluído, o chip some automaticamente
- Zero impacto em `EventForm`, hooks, banco ou RLS

### Critério de aceite
1. Evento em 30/04/2026 passa a aparecer com chip próprio antes do chip 01/05
2. Contador de eventos do chip 30/04 mostra a quantidade correta
3. Os 10 chips oficiais (01/05→10/05) continuam exibidos mesmo sem eventos
4. Excluir o último evento de um dia extra remove o chip correspondente
5. Hoje (24/04) o `initialDay` continua válido — abre em 01/05 por padrão (ou no dia atual se houver evento nele)

