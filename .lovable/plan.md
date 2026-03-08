

## Plano: DateTimePicker mais compacto no desktop e mobile

### Problema
A grid de 17 chips de hora (`06h` a `22h`) ocupa muito espaço horizontal e vertical, especialmente no desktop onde o popover fica largo demais. No mobile também adiciona altura desnecessária.

### Solução
Substituir a grid de chips de hora por uma **fila horizontal com scroll** (overflow-x-auto) — uma única linha de chips deslizáveis, similar a uma barra de tabs. Isso reduz drasticamente a altura e largura do componente.

### Mudanças em `src/components/ui/date-time-picker.tsx`

1. **Grid de chips de hora** (linhas 189-205): trocar `flex flex-wrap` por `flex overflow-x-auto gap-1 pb-1 scrollbar-hide` — uma linha horizontal com scroll, sem quebra. Chips menores com `px-1.5 py-0.5 text-[11px] whitespace-nowrap`.

2. **Container do time selector** (linhas 187-233): reduzir padding de `px-3 pb-3 pt-2` para `px-2 pb-2 pt-1.5` e `space-y-1.5`.

3. **Seletores de hora/minuto** (linhas 208-231): manter compactos como estão, já são `h-8 text-xs`.

4. **Mobile max-height**: reduzir de `max-h-[65vh]` para `max-h-[55vh]` para evitar ocupar tela demais.

5. **Calendar padding**: reduzir de `p-2` para `p-1` para compactar.

### Resultado
- Desktop: popover estreito e curto, chips de hora em uma linha scrollável
- Mobile: drawer mais compacto, mesma lógica de scroll horizontal
- Sem breaking changes na interface

