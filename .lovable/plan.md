
# Correção do splash pós-login para ficar realmente funcional

## Diagnóstico mais provável

Pelo código atual, o problema não parece ser da autenticação em si, e sim do splash:

1. O `SplashScreen` começa a contar os 3 segundos imediatamente, sem esperar a arte carregar.
2. O card depende do `<img>` para ter dimensão visual. Se a imagem demorar ou falhar naquele instante, o usuário vê só o fundo/partículas.
3. Isso explica o relato de “tela de animação travada e sem nada”: o backdrop aparece, mas o card principal não fica garantido.

## Correção proposta

### 1. Garantir pré-carregamento da arte antes da animação
Ajustar o fluxo para o splash só iniciar quando a imagem estiver pronta:
- pré-carregar a imagem ainda no `LoginPage`
- reforçar no `SplashScreen` com estado `isReady`
- iniciar o cronômetro de 3s apenas depois do asset estar carregado/decodificado

Resultado: os 3 segundos passam a ser “3 segundos com o card visível”, não “3 segundos tentando carregar”.

### 2. Dar tamanho fixo e presença visual ao card
Refatorar o `SplashScreen` para o card não depender do `<img>` para existir:
- usar um container com `width`, `max-width`, `aspect-ratio` e `min-height`
- aplicar a arte como camada interna estável
- manter fallback visual elegante mesmo se houver atraso de imagem

Resultado: mesmo em carga lenta, o usuário vê um card real, centralizado e responsivo.

### 3. Tornar a animação mais robusta e fluida
Ajustar a sequência do splash para evitar sensação de travamento:
- entrada curta e impactante
- fase central com flutuação 3D suave
- saída limpa e precisa
- manter aceleração por GPU (`transform`, `opacity`)
- reduzir efeitos que possam esconder o card no primeiro frame

Também vou revisar o `z-index`, `opacity` inicial e a ordem das camadas para o brilho e partículas não competirem com a arte principal.

### 4. Blindar o fluxo no `AuthGuard`
Ajustar o gatilho do splash para ficar previsível:
- mostrar splash apenas quando houver transição real para usuário autenticado
- impedir reexecução indevida em refresh
- só encerrar o splash quando a sequência completa terminar corretamente

## Arquivos a ajustar

- `src/components/SplashScreen.tsx`
  - adicionar preload/ready state
  - iniciar a animação só após a arte estar pronta
  - trocar a estrutura para card com dimensões fixas e fallback visual

- `src/components/AuthGuard.tsx`
  - reforçar a lógica de exibição pós-login
  - evitar corrida entre autenticação e splash

- `src/pages/LoginPage.tsx`
  - pré-carregar a arte do splash enquanto o usuário está na tela de login

- `src/index.css`
  - refinar keyframes e estilos do card
  - garantir responsividade e visibilidade imediata do conteúdo

## Resultado esperado

Depois da correção:
- ao fazer login, o card aparecerá de fato
- ele será exibido por 3 segundos visíveis e completos
- não haverá mais tela “vazia” com animação no fundo
- funcionará bem em desktop e mobile
- a experiência ficará premium, mas estável e confiável

## Validação que vou considerar na implementação

- login em sessão nova
- login em desktop
- login em mobile
- imagem carregando normalmente
- cenário de carregamento lento
- splash aparecendo uma vez por sessão sem travar a entrada no sistema
