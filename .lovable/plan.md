## Objetivo

No menu **Carrinhos Elétricos**, ao registrar uma retirada:
1. O campo **"Quem retira"** deve listar as pessoas **autorizadas** (do menu **Autorizados**, tipo `carro_eletrico`), e não mais a lista de membros da org.
2. Exibir um **aviso (toast warning, sem bloqueio)** quando já houver outro carrinho **em uso** retirado por alguém da **mesma comissão** da pessoa selecionada — regra interna de "1 carrinho por comissão".

Aplicado em dois lugares:
- Dialog **Registrar Retirada** (`src/pages/ElectricCartsPage.tsx`)
- Dialog **Reservas** (`src/components/electric-carts/ReservationDialog.tsx`) — mesma lógica para consistência

---

## Mudanças

### 1. `src/pages/ElectricCartsPage.tsx` — Dialog "Registrar Retirada"

**Aba "Membro" (renomeada para "Autorizado"):**
- Substituir a Select que lista `members` por uma Select que lista `authorizations` filtradas por `authorization_type='carro_eletrico'` e, idealmente, `access_status='liberado'`.
- Cada item exibe: `member_name — committee_name_snapshot` (ex.: "Jorge João Lunardi — Agricultura, Soja e Derivados").
- Ordenação alfabética por nome; agrupamento opcional por comissão.
- Ao selecionar:
  - `pickupForm.nome_externo` recebe `member_name` (será gravado nesse campo, já que a pessoa não é necessariamente um `org_member` com `user_id`).
  - `pickupForm.comissao` recebe `committee_name_snapshot` (mostrado no Badge "Comissão" abaixo da seleção).
  - `pickupForm.userId` fica `null`.
- Manter abas **Empresa** e **Outros** inalteradas.

**Persistência:**
- A retirada será salva como `tipo_responsavel='outros'` (já existente), com `nome_externo = member_name` e adicionando `comissao` no payload do `pickup`.
- Atualizar `useElectricCarts.pickup` para aceitar e gravar `comissao` também quando `tipo='outros'` (hoje só grava em `interno`). Pequeno ajuste: aceitar `comissao` em qualquer tipo se vier informado.

**Aviso de duplicidade por comissão:**
- Adicionar `useMemo` que mapeia, para cada comissão, os carrinhos atualmente `em_uso` (lendo `carts` + cruzando `nome_externo`/`responsavel_user_id` com `mobility_authorizations` para descobrir a comissão de cada retirador atual).
- Ao escolher um autorizado, se a comissão dele já tem ≥1 carrinho em uso → exibir aviso visual abaixo do select:
  - Banner amarelo: "⚠ Esta comissão já está com o carrinho **CARRINHO-XX** retirado por **NOME**. O recomendado é 1 carrinho por comissão."
- Ao clicar em **Registrar Retirada**, se a duplicidade persistir, disparar `toast.warning(...)` mas **prosseguir normalmente** com a retirada.

### 2. `src/components/electric-carts/ReservationDialog.tsx`

- Aba **Membro** ganha a mesma troca: lista de autorizados em vez de `members`.
- Mesma checagem de aviso para reservas que se sobrepõem no tempo com outra reserva ativa de pessoa da mesma comissão.
- Salvar como `tipo_responsavel='outros'` com `nome_externo` + `comissao`.

### 3. `src/hooks/useElectricCarts.ts`

- Em `pickup.mutationFn`, permitir gravar `comissao` também quando `tipo === 'outros'` (hoje força `comissao=null` exceto em `interno`).

### 4. `src/hooks/useMobilityAuthorizations.ts`

- Sem alterações estruturais. O hook já filtra por `type='carro_eletrico'`. Será consumido nos dois dialogs.

---

## Detalhe técnico do "aviso por comissão"

```text
Para cada cart em status 'em_uso':
  if cart.comissao -> usar diretamente
  else if cart.responsavel_user_id -> resolver via members[].commission_id
  else if cart.nome_externo -> procurar em authorizations onde
        member_name == nome_externo && type=='carro_eletrico'
        -> usar committee_name_snapshot
=> map<comissao, { cartCodigo, retiradoPor }>
```

Ao selecionar autorizado X:
- `comissaoSelecionada = X.committee_name_snapshot`
- Se `map[comissaoSelecionada]` existe → mostra aviso (apenas visual + toast warning no submit).

---

## Resultado esperado

- "Quem retira" passa a refletir a lista oficial de autorizados (vinda do menu Autorizados).
- A comissão é preenchida automaticamente e exibida.
- Se já houver outra retirada ativa de alguém da mesma comissão, o operador vê um aviso claro mas pode prosseguir (regra é orientativa, não bloqueante).
- Sem mudanças de schema; sem migrations.

Arquivos a editar:
- `src/pages/ElectricCartsPage.tsx`
- `src/components/electric-carts/ReservationDialog.tsx`
- `src/hooks/useElectricCarts.ts`
