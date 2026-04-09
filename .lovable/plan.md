

# Corrigir fuso horário na edição de transportes

## Problema

Dois bugs no fluxo de **edição**:

1. **Ao abrir o dialog de edição** (linha 531): `t.inicio_em?.slice(0, 16)` fatia a string UTC bruta. Se o banco armazena `2026-04-09T19:00:00+00:00` (que é 16:00 SP), o input mostra `19:00` — e o usuário pensa que está certo. Mas se o banco armazena `2026-04-09T19:00:00-03:00`, o slice pega `2026-04-09T19:00` corretamente. O problema real é que o valor é armazenado em UTC e o slice ignora o offset.

2. **Ao salvar a edição** (linha 559): `inicio_em: editForm.inicio_em` é enviado **sem** `ensureSPOffset()`, então o Postgres interpreta como UTC. O fluxo de criação já usa `ensureSPTimestamptz()` corretamente, mas a edição não.

O mesmo problema afeta `fim_em` (linha 566).

## Solução

### `src/pages/TransportsPage.tsx`

1. **Ao carregar para edição** — converter timestamp UTC do banco para datetime-local em SP:
   - Substituir `t.inicio_em?.slice(0, 16)` por uma conversão usando `toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' })` (que retorna `YYYY-MM-DD HH:MM:SS`) e formatar para `YYYY-MM-DDTHH:MM`
   - Fazer o mesmo para `t.fim_em`

2. **Ao salvar edição** — aplicar offset SP antes de enviar:
   - Linha 559: `inicio_em: ensureSPOffset(editForm.inicio_em)`
   - Linha 566: `fim_em: ... ? ensureSPOffset(editForm.fim_em) : null`

### Helper (já existe em `src/lib/utils.ts`)

Criar uma função `utcToSPLocal(iso: string): string` que converte um timestamp ISO/UTC para o formato `YYYY-MM-DDTHH:MM` em horário de SP — reutilizável para qualquer campo datetime-local.

| Arquivo | Alteração |
|---|---|
| `src/lib/utils.ts` | Adicionar helper `utcToSPLocal()` |
| `src/pages/TransportsPage.tsx` | Usar `utcToSPLocal()` ao carregar edit form; usar `ensureSPOffset()` ao salvar |

