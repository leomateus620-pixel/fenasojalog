# Corrigir "mexida nas laterais" ao expandir uma comissão

## Diagnóstico

Ao clicar em uma ilha no `/portal`, ela expande e o conteúdo da página cresce em altura. Nesse momento o navegador adiciona a barra de rolagem vertical na janela, o que reduz a largura útil em ~15px e empurra todo o conteúdo centralizado (`max-w-7xl mx-auto`) e os fundos `fixed inset-0` para a esquerda. Ao recolher, a barra some e tudo volta — é exatamente o "movimento nas laterais" percebido.

Fatores que contribuem:
1. `CommissionPortalPage` usa `min-h-screen overflow-hidden` no root, mas o `<html>` continua sendo o elemento rolável; nada reserva o espaço da barra.
2. O grid `items-start` faz a linha inteira crescer quando uma ilha expande, frequentemente ultrapassando a altura da viewport em telas médias.
3. A ilha em si não causa shift horizontal — o shift vem da scrollbar da página.

## Correção

Aplicar uma única correção no CSS global para reservar permanentemente o gutter da scrollbar, sem alterar nenhuma outra página:

- Em `src/index.css`, no bloco `html, body` (ou criar um seletor `html` se necessário):
  - `scrollbar-gutter: stable;`
  - fallback: `overflow-y: scroll;` apenas se navegadores antigos forem alvo (Safari < 16). Como o projeto já usa recursos modernos (`backdrop-filter`, `dvh`), `scrollbar-gutter: stable` é suficiente.

Isso garante que a barra ocupa espaço o tempo todo, então expandir/recolher a ilha não muda a largura da viewport e nada se mexe nas laterais.

## Verificação visual após implementação

- Abrir `/portal`, expandir e recolher várias ilhas em sequência: o fundo, o logo, o card "Administrador" e o grid devem permanecer perfeitamente fixos horizontalmente.
- Conferir outras páginas (`/dashboard`, `/transportes`, etc.) para garantir que reservar o gutter não introduz faixa visível em telas que já rolavam — não deve, pois a barra apenas passa a estar sempre presente.

## Fora do escopo

- Não alterar `CommissionCard.tsx` nem `CommissionPortalPage.tsx`.
- Não mexer em animação, sombras, glass ou comportamento de expansão.
