

# Plano: Edição de informações de voo + Correção do bug de triplicação

## Tarefa 1: Permitir edição das informações de voo

### Problema
No `TransportDetailView`, as informações de voo (cidade, número, check-in, chegada, horário saída) são exibidas apenas como leitura. No `editForm`/`openEditDlg` os campos de voo já são carregados (linhas 492-494), e o `handleEditSave` já salva os dados de voo (linhas 517-521). O formulário de edição (`TransportForm` com `isEdit=true`) já renderiza a seção de voo quando `titulo === 'Aeroporto'`.

### Diagnóstico
A edição de voo JÁ FUNCIONA no dialog de edição (ícone de lápis). Porém, no `TransportDetailView` (dialog de visualização - ícone de olho), não há opção de editar. A solução é garantir que o botão "Editar" no `TransportDetailView` leve ao dialog de edição, ou adicionar edição inline dos campos de voo diretamente na visualização.

### Solução
Adicionar um botão "Editar Voo" no `TransportDetailView` na seção de informações de voo, que ao clicar, abre o dialog de edição com a aba de voo já expandida. Isso mantém a consistência do fluxo existente.

**Arquivo:** `src/components/transport/TransportDetailView.tsx`
- Adicionar prop `onEdit` (callback para abrir dialog de edição)
- Na seção "Informações do Voo", adicionar botão "Editar" ao lado do título
- O botão chama `onEdit` que abre `openEditDlg(t)` no `TransportsPage`

**Arquivo:** `src/pages/TransportsPage.tsx`
- Passar `onEdit={() => { setDetailOpen(false); openEditDlg(t); }}` ao `TransportDetailView`

---

## Tarefa 2: Correção do bug de triplicação de transportes

### Diagnóstico
O bug de transportes duplicados/triplicados tem duas causas raiz:

1. **Sem proteção contra double-submit**: O botão "Agendar Transporte" usa `disabled={create.isPending}`, mas `create.isPending` volta a `false` após o primeiro `mutateAsync` resolver. Se o usuário clicar rápido, ou se houver um re-render entre a resolução e o fechamento do dialog, a função pode ser chamada novamente.

2. **`invalidateAll` no `onSuccess` causa re-render durante `handleAdd`**: A mutation `create` tem `onSuccess: invalidateAll`, que invalida TODAS as queries. Quando o primeiro `create.mutateAsync` resolve, `invalidateAll` dispara, causando re-render de toda a página. Se o dialog ainda estiver aberto e o form não foi resetado, o botão fica habilitado novamente.

### Solução

**Arquivo:** `src/pages/TransportsPage.tsx`
- Adicionar flag `useRef` (`isSubmitting`) para prevenir chamadas duplicadas de `handleAdd`
- No início de `handleAdd`: verificar `if (isSubmitting.current) return; isSubmitting.current = true;`
- No final (success e error): `isSubmitting.current = false;`
- Usar `isSubmitting` no `disabled` do botão também
- Fechar o dialog (`setOpen(false)`) ANTES da criação do retorno, mas DEPOIS da criação da ida
- Resetar o form imediatamente após a primeira criação bem-sucedida

**Arquivo:** `src/hooks/useTransports.ts`
- Nenhuma alteração necessária — o problema é no frontend

### Verificação no GuestsPage
O `GuestsPage` não contribui para o bug de triplicação de transportes. A criação de hóspedes no formulário de transporte (`onCreateGuest`) adiciona o hóspede ao array `selectedGuests`, mas não cria transporte. O vínculo hóspede-transporte acontece apenas no `handleAdd` via `guestIds`.

---

## Resumo de arquivos

1. `src/components/transport/TransportDetailView.tsx` — adicionar botão "Editar Voo" e prop `onEdit`
2. `src/pages/TransportsPage.tsx` — passar `onEdit` ao detail view + adicionar guard `isSubmitting` no `handleAdd`

## Preservação
- Nenhuma lógica de negócio alterada
- Fluxo de edição existente reutilizado
- Nenhuma mudança no backend

