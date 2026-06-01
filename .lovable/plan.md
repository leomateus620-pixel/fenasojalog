## Diagnóstico

O travamento e a "renderização estranha" vêm de duas causas no `CommissionCard.tsx`:

1. **`setState` em cada `mousemove`** — cada movimento do cursor dispara re-render do React, recalculando estilos inline em ~3 camadas (article, halo, header). Em telas com 11 cards isso enfileira centenas de updates por segundo.
2. **Rotação 3D + paralaxe inline** — mesmo com 4° de tilt, o `rotateX/rotateY` combinado com `translateZ` em filhos provoca repaint do subtree inteiro e flicker na borda arredondada (visível como "linha" passando no card).

## Solução

Eliminar tilt e estado React no hover. Manter sensação premium com:
- **Glow dourado seguindo o cursor** via CSS variables (`--mx`, `--my`) atualizadas direto no DOM dentro de `requestAnimationFrame` — zero re-render do React.
- **Lift sutil** (`translateY(-2px)`) puro CSS no `:hover`, sem rotação.
- **Borda dourada + sombra mais profunda** no `:hover`, transição 240ms.
- Mantém a base de cor da comissão, badge de status, ícone, conector dourado e linha inferior — exatamente como na imagem que o usuário aprovou visualmente.

## Mudanças em `src/components/commissions/CommissionCard.tsx`

- Remover `useState<TiltState>`, `handleDown`, `handleUp`, `handleLeave`.
- `handleMove` passa a usar `requestAnimationFrame` + `el.style.setProperty('--mx', ...)` / `--my`. Nada de setState.
- Remover do `<article>` o `transform` inline, o `willChange` dinâmico e o `transition` com dois ramos — tudo vai para CSS estático.
- Remover camadas: reflexo especular (já tinha saído), halo radial inline, sombra de chão inline.
- Adicionar **uma única camada de halo** `pointer-events-none absolute inset-0` que lê `--mx`/`--my` via `background: radial-gradient(160px at var(--mx) var(--my), hsl(var(--gold)/0.18), transparent 70%)`, com `opacity: 0` em repouso e `opacity: 1` no `:hover` do grupo (transição 220ms).
- Ícone, título, descrição, CTA: sem `translateZ`, sem transform inline. Ficam estáveis.

## Mudanças em `src/index.css`

Em `.commission-card-3d`:
- `transition: transform 240ms ease, box-shadow 240ms ease, border-color 240ms ease;`
- `transform: translateZ(0);` (apenas para compositing layer, sem rotação).
- `:hover`: `transform: translateY(-2px);` + box-shadow mais profunda + borda dourada reforçada.
- Remover qualquer rotação CSS no `:hover` que tenha sobrado.
- `prefers-reduced-motion`: desliga `translateY`.

Sem mexer em registry, portal, sidebar, ou qualquer outro componente.

## Resultado esperado

- Zero re-render no hover → sem travamento mesmo com 11 cards.
- Sem deformação 3D → forma estável, descrição legível.
- Glow dourado discreto seguindo o cursor + leve elevação → profissional, não "estético demais".
