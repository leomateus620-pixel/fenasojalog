

# Plano: Acessibilidade e Responsividade Mobile

## Alterações

### 1. CSS Global — Alto contraste e textos dimensionáveis (`src/index.css`)
- Aumentar contraste das cores `--muted-foreground` (de 46% para 40% lightness) e `--border` (de 88% para 82%) no tema claro
- No tema escuro, ajustar `--muted-foreground` de 55% para 62%
- Usar `rem` como base para todos os tamanhos (já está via Tailwind)
- Adicionar classe utilitária `.focus-ring` para estados de foco visíveis
- Adicionar `@media (prefers-contrast: high)` para usuários que pedem alto contraste no SO — reforçar bordas e cores

### 2. Navegação por teclado — BottomTabs e Sidebar (`src/components/BottomTabs.tsx`, `src/components/Sidebar.tsx`)
- Adicionar `role="navigation"` e `aria-label` nas navs
- Adicionar `aria-current="page"` nos links ativos
- Garantir `focus-visible` ring em todos os botões e links (outline visível)
- No botão "Mais", adicionar `aria-expanded` e `aria-haspopup="dialog"`
- No botão de colapsar sidebar, adicionar `aria-label` descritivo

### 3. StatCard — Acessibilidade (`src/components/StatCard.tsx`)
- Adicionar `role="link"` e `tabIndex={0}` quando tem `to`
- Suportar navegação via Enter/Space
- Adicionar `aria-label` com label + value

### 4. Layout — Skip navigation (`src/components/Layout.tsx`)
- Adicionar link "Pular para conteúdo" (skip-to-content) visível apenas com foco de teclado
- Adicionar `id="main-content"` no `<main>`

### 5. Páginas — Touch targets e contraste em mobile
- **Botões de ação** (editar/excluir) nos cards: garantir `min-w-[44px] min-h-[44px]` (44px é o mínimo recomendado WCAG)
- Aplicar `focus-visible:ring-2 focus-visible:ring-ring` em todos os botões interativos sem estilo de foco
- Arquivos: `TransportsPage.tsx`, `GuestsPage.tsx`, `VehiclesPage.tsx`, `ElectricCartsPage.tsx`, `ChecklistPage.tsx`

### 6. Formulários — Labels e ARIA
- Garantir que todos os inputs dos Dialogs tenham `aria-label` quando não têm `<Label>` associado (já usam placeholder, mas screen readers precisam de label)
- Aplicar nos formulários de `GuestsPage.tsx` e `TransportsPage.tsx`

## Resumo de arquivos
- `src/index.css` — contraste, focus styles, prefers-contrast
- `src/components/Layout.tsx` — skip-to-content
- `src/components/BottomTabs.tsx` — ARIA navigation
- `src/components/Sidebar.tsx` — ARIA navigation
- `src/components/StatCard.tsx` — keyboard nav
- `src/pages/GuestsPage.tsx` — touch targets, aria-labels
- `src/pages/TransportsPage.tsx` — touch targets, aria-labels
- `src/pages/VehiclesPage.tsx` — touch targets
- `src/pages/ElectricCartsPage.tsx` — touch targets
- `src/pages/ChecklistPage.tsx` — touch targets

