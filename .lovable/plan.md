

# Splash Screen 3D — "Nosso Ouro Vem do Campo"

## Visão Geral

Criar um componente `SplashScreen` que exibe a imagem oficial da Fenasoja 2026 com animação 3D cinematográfica por exatamente 3 segundos após o login. A animação usa CSS 3D transforms com perspective, rotação, escala e iluminação para criar um efeito "wow".

## Fluxo

1. Usuário faz login no `LoginPage`
2. `AuthGuard` detecta `user` autenticado
3. Antes de renderizar os `children`, exibe o `SplashScreen` por 3s
4. Após 3s, fade-out elegante e mostra o app normalmente
5. Splash só aparece no login (não em refresh — controlado via `sessionStorage`)

## Arquivos

### 1. Copiar imagem uploaded → `src/assets/fenasoja-splash-2026.png`

### 2. Novo: `src/components/SplashScreen.tsx`

Componente fullscreen com fundo escuro (#0a1a0a) e a imagem centralizada com animação 3D:

**Sequência de animação (3s total, CSS keyframes):**
- **0-0.8s**: Card entra com perspectiva 3D — começa rotacionado (rotateY -25deg, rotateX 15deg, scale 0.3, opacity 0) e revela com spring-like easing
- **0.8-2.2s**: Card "flutua" com micro-rotações suaves (rotateY oscila ±5deg, rotateX ±3deg) + reflexo de luz que desliza pela superfície (pseudo-element com gradiente branco translúcido animado)
- **2.2-3.0s**: Card faz zoom-in suave (scale 1 → 1.15) com fade-out elegante

**Efeitos visuais:**
- `perspective: 1200px` no container
- `transform-style: preserve-3d` no card
- Sombra dinâmica que acompanha a rotação (box-shadow muda com a animação)
- Reflexo/brilho deslizante (pseudo-element `::after` com gradiente linear branco translúcido, animado com translateX)
- Partículas douradas sutis flutuando ao fundo (4-6 círculos com animação de drift)
- Borda glass sutil no card (border com rgba branco)

**Responsividade:**
- Desktop: imagem max-width 420px
- Mobile: imagem max-width 85vw, max-height 75vh
- `object-fit: contain` para manter proporções

### 3. Editar: `src/components/AuthGuard.tsx`

Adicionar estado `showSplash` que:
- Ativa quando `user` existe E `sessionStorage` não tem flag `fenasoja-splash-shown`
- Renderiza `<SplashScreen onComplete={...} />` em vez dos children
- No `onComplete` (após 3s), seta flag no sessionStorage e mostra o app
- No refresh da página, splash não aparece (flag já existe)

### 4. Editar: `src/index.css`

Adicionar keyframes CSS para as animações 3D:
- `@keyframes splash-card-enter` — entrada 3D com rotação
- `@keyframes splash-card-float` — flutuação suave
- `@keyframes splash-card-exit` — zoom + fade out
- `@keyframes splash-shine` — reflexo de luz deslizante
- `@keyframes splash-particle` — partículas douradas flutuantes

## Resultado

Após o login, o usuário verá um card 3D cinematográfico da Fenasoja 2026 com a imagem oficial, flutuando com reflexos de luz e partículas douradas por 3 segundos, antes de entrar no dashboard.

