

## Plano: Refinamento Premium da Sidebar

### Arquivo: `src/components/Sidebar.tsx`

### 1. Dados reais para badges inteligentes

Importar e consumir os hooks existentes:
- `useTransports()` → contar `transports.filter(t => t.status === 'em_andamento').length` para badge em Transportes
- `useEvents()` → contar eventos de hoje (`isToday(parseISO(e.inicio_em))`) para badge em Agenda
- `useTasks()` → contar `tasks.filter(t => t.status === 'pendente').length` para badge em Checklist
- `useOrgMembers()` → contar `members.filter(m => m.status === 'disponivel').length` para badge em Equipe

Associar badges ao array `links` via um `Map<string, number>` computado dentro do componente. Badge exibido apenas quando `count > 0` e sidebar não colapsada.

### 2. Agrupamento leve dos menus

Dividir os links em 3 grupos com microtítulos discretos:

- **Operação**: Dashboard, Transportes, Agenda, Escala, Checklist
- **Recursos**: Veículos Botolli, Carrinhos Elétricos, Patinetes, Hóspedes, Equipe
- **Sistema**: Configurações (+ Sair fica na área inferior, separado)

Microtítulos: `text-[9px] uppercase tracking-[0.15em] text-sidebar-foreground/40 font-semibold px-3 pt-4 pb-1`. Sem caixas, apenas espaçamento e label discreto. Ocultos quando `collapsed`.

### 3. Visual Liquid Glass refinado

**Container sidebar:**
- Background: gradiente sutil `linear-gradient(180deg, hsl(var(--sidebar-background) / 0.92), hsl(var(--sidebar-background) / 0.85))`
- Borda: `border-r border-white/[0.12]`
- Manter `backdrop-blur-2xl`

**Item ativo:**
- De: `bg-white/15 text-sidebar-primary border-l-2 border-sidebar-primary`
- Para: `bg-sidebar-primary/15 text-sidebar-primary font-semibold` + `border-l-[3px] border-sidebar-primary` + inline `boxShadow: 'inset 0 0 12px rgba(255,255,255,0.06)'`
- Ícone ativo: `text-sidebar-primary` (cor explícita, não herdar opacity)

**Itens inativos:**
- Melhor hover: `hover:bg-white/[0.07]` com `transition-all duration-200`
- Mobile: adicionar `active:scale-[0.97] active:bg-white/10` para feedback tátil
- Padding uniforme: `py-2.5` (desktop), `py-3` (mobile)

### 4. Cabeçalho premium

- Logo container: `bg-white/[0.08] rounded-xl p-1` com `shadow-sm`
- "Fenasoja": `text-[15px] font-bold tracking-tight`
- "Logística": `text-[9px] tracking-[0.2em] text-sidebar-primary/70 font-medium`
- Microcontexto abaixo do título (apenas quando não colapsado): linha única como `"3 ativos · 2 eventos · 5 tarefas"` em `text-[10px] text-sidebar-foreground/45` — dados reais dos hooks

### 5. Badges nos links

Badge: pill minúsculo `min-w-[18px] h-[18px] text-[10px] font-bold rounded-full bg-sidebar-primary/25 text-sidebar-primary flex items-center justify-center` posicionado à direita do label com `ml-auto`. Apenas para Transportes, Agenda, Checklist e Equipe.

### 6. Área inferior

- Separador: `border-t border-white/[0.08]` com `mx-2` (não full-width)
- Botão Sair: `text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-500/10` — visual secundário discreto com hint de perigo no hover
- Padding: `p-3`

### 7. Microinterações

- Sidebar mobile: `transition-transform duration-350 ease-[cubic-bezier(0.32,0.72,0,1)]` (iOS-style)
- Overlay mobile: `bg-black/50 backdrop-blur-md` (mais imersivo)
- Todos os links: `transition-all duration-200`
- Botões de toggle: `hover:bg-white/[0.12] active:scale-95 transition-all duration-150`

### 8. Mobile específico

- Largura expandida: manter `w-[280px]`
- Items com `py-3` e `gap-3.5` para melhor área de toque
- `onClick={onMobileClose}` já implementado — manter

### Resultado

Mesmo arquivo `Sidebar.tsx` reescrito com as melhorias acima. Nenhum arquivo novo. Importa 4 hooks adicionais e `date-fns/isToday` + `parseISO`.

