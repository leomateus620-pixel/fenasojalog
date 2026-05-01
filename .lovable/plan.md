## Objetivo

Transformar o módulo **Patinetes** numa réplica funcional/visual do módulo **Carrinhos Elétricos**, mantendo as regras de mobilidade da Fenasoja:

- Cards Liquid Glass 3D premium com mesmo nível de detalhe (status, halo, shimmer, avatar/parceiro, tempo decorrido, próxima reserva).
- Retirada **somente** para pessoas com cadastro de autorização para `patinete` (vindas de `mobility_authorizations` `authorization_type='patinete'`), com fallback para "Empresa parceira" e "Outros (nome + telefone)".
- Histórico completo por patinete, com nome e telefone de quem usou salvos no banco.
- Aba **Reservas** (período inicio→fim) idêntica à dos carrinhos.

## Arquitetura de banco (migrations)

1. `scooters` — adicionar colunas para paridade com `electric_carts`:
   - `tipo_responsavel text not null default 'interno'` (`interno|empresa|outros`)
   - `empresa_slug text null`
   - `nome_externo text null`
   - `telefone_externo text null`
   - `comissao text null`
   - `devolucao_prevista_em timestamptz null` (já existe)
2. `scooter_history` — adicionar `notes text null` (já guarda `before_data/after_data` jsonb com nome/telefone/comissão da retirada).
3. Nova tabela `scooter_reservations` espelhando `cart_reservations`:
   - colunas: `id, org_id, scooter_id, tipo_responsavel, responsavel_user_id, comissao, empresa_slug, nome_externo, telefone_externo, inicio_em, fim_em, status ('agendada'|'em_andamento'|'concluida'|'cancelada'), observacoes, created_by_user_id, created_at, updated_at`
   - RLS PERMISSIVE igual `cart_reservations` (select=member; insert/update=admin/gestor/operador; delete=admin/gestor)
   - Trigger `validate_scooter_reservation` análogo a `validate_cart_reservation` (fim>inicio, validação por `tipo_responsavel`, conflito de período por `scooter_id`).
   - Trigger `set_updated_at`.

## Frontend

### Novos arquivos (em `src/components/scooters/`)
- `ScooterCard.tsx` — clone de `ElectricCartCard.tsx` adaptado: ícone `Bike`, leitura de autorização (badge "Autorizado") quando `tipo_responsavel='outros'` vindo de `mobility_authorizations`.
- `ScootersFilters.tsx` — clone de `ElectricCartsFilters.tsx`.
- `ScooterPickupDialog.tsx` — equivalente ao fluxo de retirada do carrinho mas **sem** período (só retirada imediata): tabs `Autorizado | Empresa | Outros`. A aba **Autorizado** lista somente `mobility_authorizations` com `authorization_type='patinete'` ordenados por `liberado` primeiro. Em `Outros` exige nome + telefone.
- `ScooterReservationDialog.tsx` — clone de `ReservationDialog.tsx` filtrando autorizações por `patinete`.
- `ScooterReservationCard.tsx` + `ScooterReservationsTab.tsx` — clones dos equivalentes de carrinho.
- `ScooterHistorySheet.tsx` — extrai e melhora o `ScooterHistoryContent` atual: linhas com nome/telefone/comissão/origem (autorizado/parceiro/outros), duração, observações, ícones e badges Liquid Glass.

### Hooks
- `useScooterReservations.ts` (novo) — espelha `useCartReservations.ts` (CRUD + setStatus + invalidações).
- `useScooters.ts` — atualizar:
  - `pickup` aceita `{ id, tipo_responsavel, responsavel_user_id?, empresa_slug?, nome_externo?, telefone_externo?, comissao?, retirada_em? }` e grava todos os campos.
  - `returnScooter` continua igual mas registra em `scooter_history` o snapshot completo (já faz).
  - `nextReservation` helper: calcula próxima reserva ativa por `scooter_id`.

### Página `src/pages/ScootersPage.tsx`
Reescrever para espelhar `ElectricCartsPage.tsx`:
- Header com botões `Reservar`, `Retirada`, `Adicionar`.
- Tabs: `Frota` | `Reservas` | `Autorizados`.
- Grid de `ScooterCard` 3D Liquid Glass com filtros (status + busca).
- `ScooterPickupDialog`, `ScooterReservationDialog`, `ScooterHistorySheet` controlados aqui.

## Regra de autorização (bloqueio)

No `ScooterPickupDialog` aba **Autorizado**:
- Fonte de dados: `useMobilityAuthorizations('patinete')`.
- Se `authorizations.length === 0` → exibir alerta Liquid Glass "Nenhuma pessoa autorizada para patinete. Cadastre em Mobilidade por Comissão." e desabilitar a aba.
- Selecionar autorizado preenche `nome_externo` (do `member_name`), `telefone_externo` (vazio, exigido como obrigatório no momento da retirada) e `comissao` (`committee_name_snapshot`). Persiste como `tipo_responsavel='outros'` referenciando o `member_id` em `observacoes` (compatível com `cart_reservations`).
- Apenas `tipo_responsavel='empresa'` e `outros` podem ser usados sem autorização — mas mantém aviso.

## Visual Liquid Glass 3D

- Reaproveitar exatamente as classes/halos/shimmer de `ElectricCartCard` (gradient `from-card/85 via-card/65 to-card/45`, `backdrop-blur-2xl`, halo radial top-right, `motion-safe:animate-halo-breath`, ring `accent` em uso).
- Trocar ícone `Zap` por `Bike` mantendo paleta (verde Fenasoja para disponível, accent/gold para em uso, destructive para manutenção).
- Badge de próxima reserva com mesmas variantes (`now`/`soon`/`future`).

## Detalhes técnicos

- Mobile-first 393px: grid `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`.
- z-index dos halos = 0; dialogs em z-50, `max-h-[90dvh]`.
- Inputs sempre uppercase via `className="uppercase"` para nome.
- Telefone formatado `(00) 00000-0000` (sem máscara automática agora — texto livre como nos carrinhos).
- Audit: cada `pickup`/`return`/`reservation` invoca `logAudit` + `scooter_history`.
- Realtime opcional (não obrigatório nesta iteração).

## Entregáveis

1. Migration SQL (colunas em `scooters`, nova tabela `scooter_reservations` + trigger + RLS).
2. Hook `useScooterReservations.ts`; atualização de `useScooters.ts`.
3. 7 componentes em `src/components/scooters/`.
4. `ScootersPage.tsx` reescrita com Tabs.
5. Memória `mem://features/scooters-liquid-glass` documentando paridade com carrinhos.

## Fora de escopo

- Notificações WhatsApp na retirada/devolução (não existe nos carrinhos hoje).
- Conflito por comissão (apenas aviso, igual carrinhos).
