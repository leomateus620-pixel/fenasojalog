

## Plano: Picker de Data/Hora moderno para todo o sistema

### Problema
O `<input type="datetime-local">` nativo do browser tem UX ruim, especialmente no desktop — calendário feio, seletor de hora minúsculo, visual inconsistente entre browsers.

### Solução
Criar um componente reutilizável `DateTimePicker` que combine:
- **Calendário** visual (shadcn `Calendar` / react-day-picker, já instalado)
- **Seletores de hora/minuto** com scroll ou dropdowns estilizados
- Tudo dentro de um `Popover` que abre ao clicar no campo
- Visual Liquid Glass consistente com o resto do sistema

### Componente: `src/components/ui/date-time-picker.tsx`

**Props:**
- `value: string` (ISO datetime string ou date string)
- `onChange: (value: string) => void`
- `mode: 'datetime' | 'date' | 'time'` (default: 'datetime')
- `placeholder?: string`
- `className?: string`

**Estrutura:**
1. **Trigger**: Botão estilizado mostrando data/hora formatada, com ícone de calendário
2. **Popover content**:
   - `Calendar` do shadcn para selecionar o dia
   - Abaixo do calendário: dois `Select` lado a lado para Hora (00-23) e Minuto (00-59)
   - Botão "Confirmar" para fechar o popover
3. **Modo `date`**: só mostra calendário, sem hora
4. **Modo `time`**: só mostra seletores de hora/minuto

**Visual**: `bg-card/95 backdrop-blur-xl border-border` no popover, coerente com modais existentes.

### Substituições em 8 arquivos

Todos os `<Input type="datetime-local" ...>` e `<Input type="date" ...>` serão substituídos por `<DateTimePicker>`:

| Arquivo | Ocorrências | Modo |
|---|---|---|
| `AgendaPage.tsx` | 2 (inicio_em, fim_em) | datetime |
| `TransportsPage.tsx` | 3 (inicio_em, fim_em, filterData) | datetime + date |
| `ChecklistPage.tsx` | 3 (due_em create, due_em edit, filterDate) | datetime + date |
| `GuestsPage.tsx` | 2 (checkin_em, checkout_em) | datetime |
| `ElectricCartsPage.tsx` | 2 (retirada_em, devolucao_em) | datetime |
| `ScootersPage.tsx` | 2 (retirada_em, devolucao_em) | datetime |
| `VerEscalaPage.tsx` | 4 (filterDate, schedStart, schedEnd, shiftStart/End) | date + datetime |
| `TeamPage.tsx` | 2 (data_inicio, data_fim) | date |

### Arquivos modificados
1. **Criar** `src/components/ui/date-time-picker.tsx` — componente reutilizável
2. **Editar** 8 páginas — substituir inputs nativos pelo novo componente

