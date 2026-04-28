## Objetivo

Criar uma terceira aba **Reservas** no menu Carrinhos Elétricos (ao lado de Frota e Autorizados), permitindo agendar antecipadamente a retirada de um carrinho com período definido (início → devolução prevista) e três tipos de retirada: **Membro Fenasoja**, **Empresa Parceira** ou **Outros** (nome livre). Adicionar também a opção "Outros" no fluxo de Retirada imediata existente, mantendo consistência. Usar fuso de SP (America/Sao_Paulo).

---

## 1. Banco de dados

### Nova tabela `cart_reservations`
Migration nova com:
- `id uuid PK default gen_random_uuid()`
- `org_id uuid NOT NULL`
- `cart_id uuid NOT NULL` (referencia `electric_carts.id`)
- `tipo_responsavel text NOT NULL` ('interno' | 'empresa' | 'outros')
- `responsavel_user_id uuid` (quando interno)
- `comissao text` (snapshot, quando interno)
- `empresa_slug text` (quando empresa)
- `nome_externo text` (quando outros — nome livre)
- `telefone_externo text` (opcional, quando outros)
- `inicio_em timestamptz NOT NULL` (retirada agendada)
- `fim_em timestamptz NOT NULL` (devolução prevista)
- `status text NOT NULL default 'agendada'` ('agendada' | 'em_andamento' | 'concluida' | 'cancelada')
- `observacoes text`
- `created_by_user_id uuid NOT NULL`
- `created_at`, `updated_at` timestamptz

**Trigger** `set_updated_at` em UPDATE.

**Trigger de validação** (antes INSERT/UPDATE):
- garante `fim_em > inicio_em`
- garante coerência: se `tipo='interno'` exige `responsavel_user_id`; se `'empresa'` exige `empresa_slug`; se `'outros'` exige `nome_externo` (trim não vazio).
- detecta conflito: rejeita se existir outra reserva para o mesmo `cart_id` com status em ('agendada','em_andamento') cujo intervalo `[inicio_em, fim_em)` sobreponha.

**RLS PERMISSIVE** (mesmo padrão de `electric_carts`):
- SELECT: `is_org_member(auth.uid(), org_id)`
- INSERT/UPDATE: `get_user_org_role IN (admin, gestor, operador)`
- DELETE: `get_user_org_role IN (admin, gestor)`

### Atualizar `electric_carts`
- Adicionar coluna `nome_externo text` (para suportar "Outros" no fluxo de retirada imediata).
- `tipo_responsavel` já aceita texto livre — passar a aceitar `'outros'` (nenhuma alteração de constraint necessária; ajustar comentário/uso).

---

## 2. Hooks

### Novo `src/hooks/useCartReservations.ts`
Padrão idêntico a `useElectricCarts`:
- `list` (query por `org_id`, ordenado por `inicio_em` asc) com filtros opcionais.
- `create` (insert + audit).
- `update` (update + audit + history opcional).
- `cancel` (set status `cancelada`).
- `convertToPickup` (chama `useElectricCarts.pickup` com os dados da reserva e marca status `em_andamento`).

### Atualizar `useElectricCarts.ts`
- `pickup` aceita `tipo: 'interno' | 'empresa' | 'outros'` e `nome_externo?: string`.
- Quando `tipo='outros'`: zera `responsavel_user_id`, `comissao`, `empresa_slug` e grava `nome_externo`.

---

## 3. Tipos / Partners
- `src/lib/partners.ts`: nenhuma alteração.
- Em UI tratar `'outros'` como ramo separado (ícone `User`, label "Convidado / Externo").

---

## 4. UI — Página `ElectricCartsPage.tsx`

### Tabs
`Frota | Autorizados | Reservas` (nova aba).

### Aba Reservas (nova)
Mesma linguagem visual Liquid Glass 3D dos cards atuais:
- Header com título, contador (Agendadas / Em andamento / Concluídas) e botão `+ Nova Reserva`.
- Filtros (segmented control reaproveitado do estilo `ElectricCartsFilters`): Período (Hoje / Próximos 7 dias / Todas) + busca por nome/código.
- Lista de cards `ReservationCard` (novo componente em `src/components/electric-carts/ReservationCard.tsx`):
  - Glassmorphism `backdrop-blur-2xl`, gradiente sutil, halo radial conforme status:
    - `agendada` → halo `primary` (verde profundo)
    - `em_andamento` → halo `accent` + shimmer leve (reaproveita `animate-cart-shimmer`)
    - `concluida` → tons mutados
    - `cancelada` → tons destrutivos com strike no título
  - Conteúdo: código + nome do carrinho, bloco do responsável (avatar/foto/logo/iniciais conforme tipo), faixa horária `dd/MM HH:mm → dd/MM HH:mm` (SP), duração calculada e badge de status.
  - Ações: `Iniciar Retirada` (quando hora atual >= inicio_em e cart disponível), `Editar`, `Cancelar`.
- Vazio state com ícone `CalendarClock`.

### Diálogo "Nova Reserva" / "Editar Reserva"
- Select do carrinho (mostra todos, indicando próximas reservas conflitantes).
- Tabs com 3 opções: **Membro Fenasoja | Empresa Parceira | Outros**.
  - "Outros": Input `Nome` (uppercase, obrigatório) + Input `Telefone` (opcional, máscara BR).
- Dois `DateTimePicker` (Início e Fim previsto), padrão SP, valor inicial = agora SP / agora+2h.
- Campo `Observações` (textarea curta).
- Validação client-side (zod) antes do submit; toast em erros do trigger (mensagem direta).

### Aba Frota — diálogo "Registrar Retirada" existente
- Adicionar terceira aba interna **Outros** (junto de Membro Fenasoja / Empresa Parceira) com input de nome (uppercase). Persiste em `electric_carts.nome_externo` + `tipo_responsavel='outros'`.
- `ElectricCartCard.tsx` no estado "em uso" passa a renderizar bloco `Outros` com ícone `User` + nome externo (quando `tipo_responsavel='outros'`).

---

## 5. Roteamento e navegação
- Sem nova rota; tudo dentro de `/electric-carts` via tabs.
- Reaproveita `ElectricCartsReportPage` (sem alteração nesta etapa).

---

## 6. Detalhes técnicos / regras

```text
Reservation lifecycle
agendada ──(iniciar retirada)──▶ em_andamento ──(devolução)──▶ concluida
   │                                  │
   └──(cancelar)──▶ cancelada         └──(cancelar)──▶ cancelada
```

- Conflito: trigger SQL bloqueia overlap entre reservas ativas no mesmo carrinho.
- "Iniciar Retirada" a partir de uma reserva: chama `pickup` com snapshot da reserva (tipo, responsável, comissão, empresa_slug ou nome_externo) e seta `cart_reservations.status='em_andamento'`. Devolução pelo fluxo padrão do card finaliza a reserva via update no `useCartReservations` (chamada extra após `returnCart` quando houver reserva ativa daquele carrinho).
- Todas as datas formatadas com `timeZone: 'America/Sao_Paulo'` via helpers já existentes (`nowSP`, `nowSPLocal`, `utcToSPLocal`).
- Auditoria: cada operação chama `logAudit` (entity `cart_reservations`).

---

## 7. Arquivos afetados

**Novos**
- `supabase/migrations/<timestamp>_cart_reservations.sql` (tabela, trigger validação + conflito, RLS, coluna `nome_externo` em `electric_carts`).
- `src/hooks/useCartReservations.ts`
- `src/components/electric-carts/ReservationCard.tsx`
- `src/components/electric-carts/ReservationDialog.tsx` (criar/editar)
- `src/components/electric-carts/ReservationsTab.tsx` (lista + filtros + dialog)

**Editados**
- `src/pages/ElectricCartsPage.tsx` — adicionar aba Reservas; adicionar tab "Outros" no diálogo Retirada; passar a finalizar reserva ao devolver.
- `src/components/electric-carts/ElectricCartCard.tsx` — render do tipo `outros` no estado em uso.
- `src/hooks/useElectricCarts.ts` — `pickup` suportando `tipo='outros'` e `nome_externo`.
- `src/lib/utils.ts` — (apenas se necessário) helper de formatação curta de intervalo SP.

Sem novas dependências. Mantém Liquid Glass, fuso SP, RLS isolado por `org_id`, sem efeitos AI.
