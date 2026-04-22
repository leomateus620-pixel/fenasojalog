

## Habilitar edição das solicitações no menu Mobilidade

### Diagnóstico
Na tabela do **Painel de Mobilidade** (print enviado) cada linha já permite **liberar / bloquear / excluir**, mas **não há botão de editar** os dados do integrante (nome, cargo, comissão, modais, QR, observações). O hook `useMobilityMembers` já expõe `updateMember`, mas o componente só usa para mudar `access_status`.

Além disso, hoje a RLS de `UPDATE` em `committee_mobility_members` é restrita (admin/operador). O pedido é: **qualquer login da organização** pode editar.

### Solução

**1. UI — botão Editar + Dialog (`MobilityAdminPanel.tsx`)**
- Adicionar ícone `Pencil` (lucide) na coluna **Ações**, antes dos botões de status
- Ao clicar, abrir um `Dialog` Liquid Glass com formulário pré-preenchido contendo:
  - Nome completo *
  - Cargo / Função
  - CPF / Identificador
  - Comissão (Select com `useOfficialCommittees`)
  - Checkboxes: Carro Elétrico · Patinete · QR Gratuito
  - Status (Select: Pendente / Liberado / Bloqueado)
  - Observações (Textarea)
- Validação mínima: `member_name` obrigatório; ao menos um modal marcado
- Submit chama `updateMember.mutateAsync({ id, ...campos })` → toast "Solicitação atualizada"
- Cache `mobility-members-all` + `mobility-authorizations` invalidado automaticamente
- Layout responsivo: dialog `max-h-[90dvh]` com scroll interno; grid 1col mobile / 2col desktop

**2. Permissões — RLS aberta para qualquer membro da org**
Atualizar política PERMISSIVE de `UPDATE` em `committee_mobility_members` para permitir a todos os membros ativos da organização (não só admin/operador):

```sql
DROP POLICY IF EXISTS "members_update" ON public.committee_mobility_members;
CREATE POLICY "members_update_any_org_member"
ON public.committee_mobility_members
FOR UPDATE
USING (public.is_org_member(auth.uid(), org_id))
WITH CHECK (public.is_org_member(auth.uid(), org_id));
```

Isso atende ao pedido literal: **todos os logins/usuários** da organização poderão editar as solicitações cadastradas.

> Observação de segurança: mantemos `INSERT` e `DELETE` com regras existentes (apenas admin/operador podem criar/excluir), apenas a **edição** fica liberada para todos. Se o usuário quiser também liberar exclusão para todos, basta confirmar — não está no escopo desta solicitação.

**3. Trigger de sincronização**
A tabela `mobility_authorizations` é gerada via `sync_internal_mobility_form` a partir dos membros. Após editar, chamar a função RPC `sync_internal_mobility_form(form_id)` no `onSuccess` da mutation para que as autorizações reflitam imediatamente o nome/cargo/modal atualizado nas abas "Carros Elétricos" e "Patinetes".

### Resultado esperado
- Cada linha da tabela do Painel ganha um botão **lápis** ao lado de liberar/bloquear/excluir
- Qualquer usuário logado consegue abrir o dialog, alterar dados e salvar
- Mudanças se propagam automaticamente para as abas de autorizações (Carro Elétrico / Patinete)
- Toast de sucesso/erro padrão Liquid Glass

### Arquivos

| Arquivo | Tipo | Mudança |
|---|---|---|
| `src/components/mobility/MobilityAdminPanel.tsx` | Edit | Adiciona botão Editar + Dialog de edição completo |
| `src/components/mobility/EditMemberDialog.tsx` | Novo | Componente dedicado do formulário de edição |
| `src/hooks/useMobilityMembers.ts` | Edit | `updateMember.onSuccess` chama RPC `sync_internal_mobility_form` |
| `supabase/migrations/*.sql` | Migração | Substitui RLS de UPDATE para `is_org_member` |

### Critério de aceite
1. Login como qualquer perfil (admin, operador, gestor, leitura) → botão **Editar** visível em cada linha
2. Editar nome de "andressa kunzler" → ao salvar, aparece atualizado tanto no Painel quanto nas abas Carro/Patinete
3. Marcar/desmarcar modais reflete imediatamente nas autorizações sincronizadas
4. Sem regressão nos botões existentes (Liberar/Bloquear/Excluir)

