
# Mover e Melhorar Cards de Acesso Rápido no Dashboard

## O que muda

1. **Reposicionar**: Mover o bloco "Acessos Rápidos" (linhas 393-442) para logo após os 4 StatCards (após linha 213), antes de "Próximos Transportes".

2. **Melhorar contraste e visual**: 
   - Títulos: `text-foreground font-bold text-sm` → `text-foreground font-extrabold text-base`
   - Subtítulos: de `text-muted-foreground` → `text-foreground/80 font-semibold`
   - Descrição: de `text-muted-foreground/70 text-[10px]` → `text-muted-foreground text-[11px]`
   - Ícones maiores: `w-12 h-12` no container, `w-6 h-6` no ícone
   - Badge com melhor contraste: Card 1 badge verde (`bg-primary/15 text-primary`), Card 2 badge dourado (`bg-gold/15 text-gold`)
   - Padding aumentado: `p-5` → `p-5 sm:p-6`
   - Borda lateral colorida sutil: Card 1 com `border-l-2 border-primary/40`, Card 2 com `border-l-2 border-gold/40`

## Arquivo
- `src/pages/Dashboard.tsx` — recortar bloco das linhas 393-442, colar após linha 213, aplicar melhorias visuais
