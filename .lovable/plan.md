

# Plano: Redesign Visual Premium Fenasoja

## Visão Geral
Transformação visual completa do app com identidade Fenasoja premium — verde escuro (#006400 → HSL 120 100% 20%), dourado soja (#F2C94C → HSL 45 87% 63%) como accent nobre, estética liquid glass profunda, tipografia refinada e microinterações elegantes.

## Arquivos a editar (em ordem)

### 1. `src/index.css` — Fundação visual global
**Paleta de cores completa redesenhada:**
- `:root` — background com tom verde-terra sutil (warm off-white com toque green), primary baseado em #006400, accent em #F2C94C
- `.dark` — estética "campo noturno" com verdes profundos escuros
- Sidebar colors: verde escuro premium com dourado como highlight
- Novas utility classes: `.premium-card`, `.premium-surface`, grain texture sutil via pseudo-element
- Liquid glass cards com sombra multicamadas (outer shadow + inset highlight + border glow sutil)
- Inputs premium: fundo translúcido, borda sutil, focus com glow dourado discreto
- Botões: transições suaves, hover com elevação, active scale
- Body: gradient background sutil (não flat)

### 2. `tailwind.config.ts` — Novas keyframes e tokens
- Keyframes: `shimmer` (reflexo dourado sutil), `float` (hover profundidade)
- Nova cor `gold` com variantes para uso controlado como accent nobre
- Font family: adicionar `"Satoshi"` ou manter Inter com pesos otimizados

### 3. `src/components/ui/button.tsx` — Botões premium
- Variante default: gradient verde sutil, sombra, hover com lift
- Variante destructive: mais sofisticada
- Todas: `rounded-xl`, transição `all 200ms`, `active:scale-[0.97]`
- Novo tamanho: padding mais generoso

### 4. `src/components/ui/card.tsx` — Card premium base
- Aplicar liquid glass premium por padrão: `bg-card/60 backdrop-blur-xl`, border multicamada, sombra profunda suave
- Hover: leve lift (`hover:-translate-y-0.5 hover:shadow-lg`)
- Transição elegante

### 5. `src/components/ui/input.tsx` — Inputs refinados
- `h-11 rounded-xl bg-background/60 border-border/50`
- Focus: `focus:border-primary/60 focus:ring-primary/20`
- Transição suave no focus

### 6. `src/components/ui/dialog.tsx` — Modais premium (já parcialmente feito)
- Reforçar overlay com gradient escuro
- Content com sombra mais profunda e borda dourada ultra-sutil no topo

### 7. `src/components/StatCard.tsx` — KPI cards premium
- Sombra multicamadas, hover com elevação
- Valor numérico com mais peso visual (text-3xl font-extrabold)
- Borda left accent sutil por variant (verde, dourado, etc.)
- Icon container com gradient sutil ao invés de flat bg

### 8. `src/components/Sidebar.tsx` — Menu lateral premium
- Background com gradient verde escuro mais profundo
- Active item: accent bar dourada ao invés de verde, glow sutil
- Hover: transição mais suave, bg glass refinado
- Logo area: borda inferior dourada sutil
- Group titles: com toque dourado discreto

### 9. `src/components/Layout.tsx` — Estrutura global
- Background com textura grain ultra-sutil via CSS
- Mobile hamburger button mais premium

### 10. `src/pages/Dashboard.tsx` — Dashboard premium
- Header greeting com tipografia mais nobre
- Shortcuts grid: cards menores com hover premium
- Section wrapper: bordas e sombras mais profundas
- Lista items: hover mais refinado, tipografia melhor hierarquizada

### 11. Páginas operacionais (ajustes de className inline)
- `TransportsPage.tsx`, `VehiclesPage.tsx`, `GuestsPage.tsx`, `AgendaPage.tsx`, `ChecklistPage.tsx`, `TeamPage.tsx`, `ScootersPage.tsx`, `ElectricCartsPage.tsx`
- Page headers: tipografia mais forte, badge status premium
- Botões "Novo/Adicionar": visíveis, sólidos, com ícone
- Cards de listagem: liquid glass premium consistente
- Empty states: mais elegantes

## Princípios de execução
- Zero alteração em lógica de negócio
- Todos os fluxos preservados
- Performance: backdrop-blur limitado a elementos visíveis, will-change controlado
- Acessibilidade: contraste AA+ em todas as superfícies
- Mobile-first: touch targets 44px+, respiros adequados

## Ordem de implementação
1. CSS global + Tailwind config (fundação)
2. Componentes UI base (button, card, input, dialog)
3. StatCard + Sidebar + Layout (estrutura)
4. Dashboard (vitrine principal)
5. Páginas operacionais (consistência)

