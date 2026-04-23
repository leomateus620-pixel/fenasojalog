

## Permitir eventos Fenasoja fora do período 01/05–10/05

### Diagnóstico
Hoje o `EventForm` (`src/components/fenasoja/EventForm.tsx`) bloqueia datas fora da janela `FENASOJA_RANGE` (01/05 a 10/05/2026) via função `isInRange`, exibindo o toast *"Datas devem estar entre 01/05/2026 e 10/05/2026"*. A repetição diária também usa `2026-05-10T23:59` como limite fixo. Isso impede o cadastro de eventos preparatórios (ex.: reuniões em abril) ou pós-evento.

### Mudanças

| Arquivo | Mudança |
|---|---|
| `src/components/fenasoja/EventForm.tsx` | 1. Remover a validação `isInRange` no `handleSave` (e a função `isInRange` se ficar sem uso) — passa a aceitar qualquer data válida. |
| | 2. No fluxo de **Repetir diariamente**, trocar o limite fixo `2026-05-10T23:59` por um limite configurável: estender até **31/05/2026 23:59** como teto de segurança (evita loops absurdos), mantendo a opção utilizável tanto dentro quanto fora do período principal. |
| | 3. Atualizar o texto auxiliar do switch *"Cria cópias até 10/05/2026"* para *"Cria cópias diárias por até 30 dias"*. |
| | 4. Manter o subtítulo do diálogo *"Programação institucional · 01/05 a 10/05/2026"* como referência informativa, mas **não restritiva** (o período oficial continua sendo a referência visual). |

### Compatibilidade
- Zero alteração de schema, RLS, hooks ou banco
- Eventos já criados continuam intactos
- A página `FenasojaEventsPage` apenas lista o que vier do banco — não filtra por data, então novos eventos fora do período aparecem normalmente
- Critérios de aceite:
  1. Criar evento em 15/04/2026 ou 20/05/2026 funciona sem erro
  2. Repetir diariamente respeita o teto de 30 dias
  3. Eventos dentro do período 01/05–10/05 continuam funcionando exatamente como antes

