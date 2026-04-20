

## Diagnóstico

Quando o usuário clica em **"Finalizar"** no card do transporte, a função `cycleStatus` (em `src/pages/TransportsPage.tsx`, linha 679) preenche o formulário de edição lendo `t.inicio_em` direto do banco e fazendo apenas `slice(0, 16)`:

```ts
inicio_em: t.inicio_em?.slice(0, 16) || '',
```

Mas `t.inicio_em` é uma timestamp **UTC** (ex.: `"2026-04-20T16:44:00+00:00"` que equivale a `13:44` em SP). O `slice(0,16)` corta `"2026-04-20T16:44"` e o input `datetime-local` exibe **16:44** como se fosse horário SP — primeira regressão visual.

Pior: ao salvar (linha 608), o código aplica `ensureSPOffset(editForm.inicio_em)`, gerando `"2026-04-20T16:44:00-03:00"` → grava **19:44 UTC** no banco. Em todas as próximas leituras, exibe **16:44 SP** (saída deslocada em **+3h** permanentemente — exatamente o que aparece no PDF).

A função `openEditDlg` (botão Editar, linha 580) já está correta usando `utcToSPLocal(t.inicio_em)`. O bug só ocorre no fluxo "Finalizar Viagem".

## Correção

### Arquivo: `src/pages/TransportsPage.tsx`

**Linha 679** — trocar a conversão crua por `utcToSPLocal`, idêntica ao `openEditDlg`:

```diff
- inicio_em: t.inicio_em?.slice(0, 16) || '', motorista_user_id: t.motorista_user_id || '',
+ inicio_em: t.inicio_em ? utcToSPLocal(t.inicio_em) : '', motorista_user_id: t.motorista_user_id || '',
```

Isso garante que o `datetime-local` receba o horário **já convertido para o fuso de São Paulo**, e o `ensureSPOffset` na linha 608 passe a anexar o offset correto (`-03:00`) sem deslocar o valor.

### Validação adicional

- Conferir que não há outros pontos onde `inicio_em` ou `fim_em` são lidos crus do banco para `datetime-local`. Já verifiquei: `openEditDlg` e o `editForm.fim_em` em `cycleStatus` (linha 684) usam `nowSPLocal()` — corretos.
- `ensureSPOffset` e `utcToSPLocal` em `src/lib/utils.ts` permanecem inalterados — funcionam corretamente.
- PDF (linha 765) e `TransportDetailView` (linha 62) já usam `toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })` — corretos.

## Resultado

- Ao clicar em **Finalizar**, o campo "Data/Hora saída" no formulário aparece com o horário SP real (13:44, não 16:44).
- Ao salvar, o `inicio_em` permanece igual ao original — sem deslocamento de +3h.
- PDF, card e detalhe passam a mostrar o horário consistente (13:44) no fuso de Brasília.
- Transportes futuros não acumulam mais o erro a cada finalização.

