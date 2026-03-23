

# Plano: Validação de dados de transportes no Dashboard + Animações nos cards de Veículos

## Tarefa 1: Transportes no Dashboard — Validação e correções

### Análise
Revisei o fluxo completo de dados:

1. **`useTransports`** busca `transports` com `org_id` e ordena por `inicio_em` DESC, limitado a 1000 registros — correto.
2. **Dashboard** filtra `upcomingTransports` como `status === 'pendente'`, ordenados por `inicio_em` ASC, limitados a 5 — correto.
3. **StatCard "Transportes"** mostra `activeTransports` (status `em_andamento`) — correto.
4. **Retorno estimado** no card do Dashboard usa `t.fim_em` diretamente convertido para hora SP — correto, mas pode falhar se `fim_em` for null (mostra "—").

### Bugs identificados

1. **Console warning: `Function components cannot be given refs`** — `MembersList` é envolvido com `memo()` mas o Dashboard tenta passar `ref` a ele. A `Section` component não passa ref, então isso vem do React internamente ao usar `memo` sem `forwardRef`. O warning do `Badge` também indica que `Badge` não usa `forwardRef`.

2. **`logisticsMembers` filtragem frágil** — filtra por `commission_nome.toUpperCase().includes('LOG')`. Se a comissão não tiver "LOG" no nome, membros logísticos não aparecem. Isso não é um bug per se, mas é frágil.

3. **KM "totalKm" no `useVehicleUsage`** calcula km a partir de `transports` com `km_retirada` e `km_devolucao` preenchidos. Isso também alimenta os KPI cards do VehiclesPage. O cálculo inclui km de `vehicle_usage` (não, apenas de transports com km). O hook `useVehicleUsage` calcula `totalKm` e `kmByVehicle` apenas de transports, **não de `vehicle_usage`**. Se alguém registra uso direto (retirada/devolução) sem transporte, esses km não contam nos KPIs. Isso é uma inconsistência a corrigir.

### Correções a implementar

**Arquivo: `src/hooks/useVehicleUsage.ts`**
- Incluir km rodados de `vehicle_usage` (registros com `km_rodados`) no cálculo de `totalKm` e `kmByVehicle`, somando com os km de transports. Evitar duplicação verificando se o registro de usage já está coberto por um transporte.

**Arquivo: `src/pages/Dashboard.tsx`**
- Corrigir o warning de ref no `MembersList` — não é funcional mas polui console. O `memo` wrapper não precisa de `forwardRef` se não recebe ref. O warning vem de outro local. Na verdade, o log diz "Check the render method of Dashboard" para MembersList — possivelmente o Section component tenta clonar/ref children. Vou investigar e corrigir.

---

## Tarefa 2: Veículos Botolli — Cards responsivos + animações

### Análise
Os cards de veículos já são responsivos (grid `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`). Funcionam com hover e active states. Falta:

1. **Animação de entrada** — cards aparecem sem animação (sem fade-in/stagger)
2. **Animação de hover** — apenas `hover:shadow-md`, sem lift ou transição premium
3. **KPI cards** — sem animação de entrada

### Implementação

**Arquivo: `src/pages/VehiclesPage.tsx`**
- Adicionar animação `animate-fade-in` com delay staggered nos vehicle cards via `style={{ animationDelay: '${i * 50}ms' }}`
- Melhorar hover dos cards: `hover:-translate-y-1 hover:shadow-lg transition-all duration-300`
- Adicionar animação nos KPI cards com stagger
- Garantir que o `active:scale-[0.98]` continue funcional

**Arquivo: `src/index.css`** (se necessário)
- Verificar se `animate-fade-in` já tem `fill-mode: backwards` para o stagger funcionar

## Arquivos a editar
1. `src/hooks/useVehicleUsage.ts` — incluir km de vehicle_usage no totalKm
2. `src/pages/Dashboard.tsx` — corrigir warning de ref
3. `src/pages/VehiclesPage.tsx` — animações nos cards

