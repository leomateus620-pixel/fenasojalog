

# Fix: Logo correta + novo fundo na tela de login

## Problema
A logo `fenasoja-logo-horizontal.png` foi substituída por uma imagem incorreta na última edição. O fundo também precisa ser atualizado com a nova imagem fornecida (cartaz Fenasoja 2026 com grãos de soja).

## Ações

### 1. Usar a logo correta do projeto
- Trocar o import de `fenasoja-logo-horizontal.png` para `logofeira26.webp` que já existe em `src/assets/` e é a logo original do projeto.

### 2. Atualizar imagem de fundo
- Copiar `user-uploads://ChatGPT_Image_11_de_mar._de_2026_16_43_08.png` para `src/assets/fenasoja-bg-2026.png` (sobrescreve a atual).

### 3. Ajustes em `src/pages/LoginPage.tsx`
- Linha 5: trocar import para `logofeira26.webp`
- Nenhuma outra mudança — lógica e layout permanecem intactos

