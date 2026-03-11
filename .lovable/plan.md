

# Redesign da Tela de Login — Liquid Glass com Background Fenasoja 2026

## Visão Geral
Redesign completo da `LoginPage.tsx` usando a imagem do cartaz Fenasoja 2026 como fundo fullscreen, com o formulário de login dentro de um card "liquid glass" texturizado centralizado. A logo será exibida horizontalmente com o texto "Fenasoja Logística" em destaque abaixo, estilo glass.

## Mudanças

### 1. Copiar imagem de fundo para o projeto
- Copiar `user-uploads://ChatGPT_Image_11_de_mar._de_2026_16_31_16.png` → `src/assets/fenasoja-bg-2026.png`

### 2. Redesign `src/pages/LoginPage.tsx`
- **Background**: Imagem fullscreen com `object-cover`, overlay escuro sutil para contraste
- **Card central**: Liquid glass card com `backdrop-blur-xl`, bordas translúcidas, sombra suave
- **Logo**: Exibida maior, horizontal, sem fundo colorido
- **Título**: "Fenasoja Logística" grande e bold, com efeito glass (texto semi-transparente branco com text-shadow)
- **Subtítulo**: "Comissão de Logística" em texto glass menor
- **Inputs**: Estilo glass com fundo semi-transparente, bordas sutis, placeholder legível
- **Botão**: Verde primário com efeito hover, `active:scale-[0.97]`
- **Rodapé**: Texto "Acesso restrito" em branco/glass

### Layout
```text
┌─────────────────────────────────┐
│     BG IMAGE (fullscreen)       │
│  ┌───────────────────────────┐  │
│  │    LIQUID GLASS CARD      │  │
│  │                           │  │
│  │      [LOGO horizontal]   │  │
│  │   Fenasoja Logística      │  │
│  │   Comissão de Logística   │  │
│  │                           │  │
│  │   [  Email input       ]  │  │
│  │   [  Senha input       ]  │  │
│  │   [     Entrar         ]  │  │
│  │                           │  │
│  │   Acesso restrito...      │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

Nenhuma mudança funcional — apenas visual. O `useAuth`, `signIn`, e lógica de erro permanecem idênticos.

