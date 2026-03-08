

## Plano: Visual Liquid Glass Premium na Dynamic Island

### Problema
A Dynamic Island usa fundo escuro (`bg-foreground/90 text-background`) que destoa do padrão Liquid Glass do projeto. Precisa de fundo translúcido texturizado com bordas em vidro.

### Mudanças em `src/components/TransportDynamicIsland.tsx`

**1. Container principal** (linhas 157-165): Trocar o fundo escuro por Liquid Glass claro:
- De: `bg-foreground/90 text-background backdrop-blur-xl border-white/[0.08]`
- Para: `bg-card/60 text-foreground backdrop-blur-xl border border-white/20` + `box-shadow` com inset glow para efeito vidro
- Adicionar estilo inline: `boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 24px rgba(0,0,0,0.08)'`

**2. Textos internos** — Substituir todas as referências `text-white/*` por cores do tema:
- `text-white/95` → `text-foreground`
- `text-white/50` → `text-muted-foreground`
- `text-white/70` → `text-foreground/70`
- `text-white/40` → `text-muted-foreground/60`
- `text-white/60` → `text-muted-foreground`

**3. Ícone container** (linhas 183-190): Trocar `bg-white/10` por `bg-primary/10`

**4. Status dot**: Manter cores de accent/emerald como estão (já são adequadas)

**5. Separador** (linha 203): `bg-white/[0.08]` → `bg-border/40`

**6. Chips de métricas** (linhas 244-260): `bg-white/[0.08] text-white/70` → `bg-muted/50 text-foreground/70`

**7. People chips** (linhas 263-273): `bg-white/[0.06] text-white/60` → `bg-muted/40 text-muted-foreground`

**8. Botões de ação** (linhas 285-303):
- Iniciar: `bg-white/15 hover:bg-white/20 text-white` → `bg-primary/15 hover:bg-primary/25 text-primary`
- Finalizar: `bg-accent/20 hover:bg-accent/30 text-accent` — manter
- Detalhes: `bg-white/[0.08] hover:bg-white/[0.12] text-white/70` → `bg-muted/40 hover:bg-muted/60 text-foreground/70`

**9. Badge "Ao vivo"** (linhas 222-225): `bg-black/60` → `bg-card/80 backdrop-blur-sm border-border/40`

**10. Cancelled state** (linha 147): `bg-muted/40` — já adequado

**11. Dark mode** — `bg-card/60` já funciona corretamente com as variáveis CSS dark definidas no projeto

### Resultado
- Fundo translúcido texturizado com blur, não mais escuro
- Bordas com efeito vidro (inset glow + border translúcida)
- Textos legíveis usando cores do tema
- Consistente com o padrão Liquid Glass do resto do app

