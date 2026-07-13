# Sede Fenasoja / Comissão Central — reconstrução arquitetônica 3D

## Entidade e implantação preservadas

- identificador público: `B12`;
- ID da referência local: `reference:2026:b12` (o runtime continua aceitando o
  UUID persistido do banco porque o asset é resolvido pelo identificador
  público);
- classificação: `ADMINISTRATION`;
- camada: `reference:structures`;
- vínculo: Quadra B;
- centro da fonte oficial: `[4105, 3681]` na planta PDF;
- footprint preservado: `135 × 104` pontos PDF, equivalente a aproximadamente
  `2,9455 × 2,2691` unidades locais;
- altura persistida preservada: `0,62`; a altura arquitetônica de apresentação é
  derivada separadamente e não altera geometria, edição ou sincronização.

Na planta oficial 2026, a B12 ocupa a borda sul da Quadra B. O acesso imediato
é a Rua Argentina; B13 fica ao norte, B25 a leste e a Quadra A ao sul da via.
Por isso a fachada pública e a entrada foram orientadas para o sul (`+Z` local,
rotação visual `0`). Essa escolha não altera o polígono, as coordenadas ou a
rotação persistida.

## Referências fotográficas obrigatórias

As três fotografias fornecidas em 12/07/2026 foram usadas em conjunto:

- exterior frontal: proporção da empena, grafite, faixa branca curva, hierarquia
  de portas e aberturas, marca e paisagismo;
- exterior aproximado: profundidade do beiral, espessura da cobertura,
  estrutura aparente, recessos de entrada, esquadrias e identificação
  “Comissão Central”;
- recepção: madeira e tons quentes, assentos claros, mesa baixa, painéis de
  memória, vitrines e iluminação acolhedora atrás do vidro.

## Lacunas do bloco anterior

| Critério | Representação anterior | Referência real |
| --- | --- | --- |
| Silhueta | Prisma retangular baixo de `0,62` unidade | Empena alta e cobertura de duas águas muito inclinada |
| Cobertura | Face superior plana do extrude genérico | Beirais profundos, espessura e ritmo estrutural exposto |
| Fachada | Uma cor de classificação | Corpo grafite, estrutura clara, vidro e faixa branca curva |
| Entrada | Sem porta, recuo ou acesso | Conjunto envidraçado recuado, marquise convexa e piso frontal |
| Identidade | Apenas rótulo HTML | Marca FENASOJA e texto “Comissão Central” incorporados à fachada |
| Profundidade | Sem camadas arquitetônicas | Base, corpo, aberturas, esquadrias, marquise, beiral e paisagismo |
| Interior | Inexistente | Recepção sugerida por assentos, mesa, exposição e luz quente |
| Seleção | Elevação/emissivo sobre o mesmo bloco | Enquadramento frontal em três quartos, detalhe focado e rótulo exclusivo |

## Estratégia de reconstrução

O asset é procedural e específico para a B12. A leitura geral usa corpo em
empena, duas placas espessas de cobertura, faixa frontal curva, esquadrias e
vidro. Em distância média entram marca, treliças, apoios, pavimentação e
floreiras. No foco entram somente os sinais de recepção que são legíveis através
do acesso: fundo quente, assentos, mesa baixa, painéis, vitrine e luminárias
emissivas sem sombras adicionais.

A faixa curva é uma malha de 24 segmentos, e não uma textura sobre um bloco. A
identificação possui superfície e UVs conformados à mesma parábola, evitando
placa flutuante nas vistas oblíquas. A cobertura mantém faces espessas e
materiais foscos. Somente os planos frontais da entrada são translúcidos, com
`FrontSide` e `depthWrite` desativado; janelas superiores/laterais e todas as
demais superfícies continuam opacas e escrevendo profundidade. Todos os
detalhes ficam fora do raycast.

## Integração, seleção e desempenho

- um único volume invisível derivado do footprint oficial continua atendendo
  hover, clique, duplo clique e troca rápida;
- busca e seleção por `B12`, nome oficial e aliases continuam apontando para a
  mesma entidade;
- edição permanece ligada ao GeoJSON persistido, não às malhas decorativas;
- o foco usa a fachada sul em três quartos e a altura visual real para calcular
  o enquadramento;
- o modo focado mantém somente o rótulo da entidade selecionada;
- o contorno selecionado permanece acima da plataforma, sem geometria flutuante;
- detalhes repetidos são instanciados e geometrias unitárias são compartilhadas;
- a recepção só é montada no foco e com gráficos completos;
- não há animação contínua, luz com sombra extra ou interior explorável;
- o mapa permanece em `frameloop="demand"`.

## Critérios de validação

- visão geral, média, frontal, lateral e elevada;
- seleção direta, pelo explorador e pelos aliases de busca;
- centralização, desseleção e troca rápida de entidade;
- disponibilidade do editor sem alterar o footprint durante o teste;
- rótulo exclusivo no foco e retorno da navegação contextual;
- ausência de clipping, z-fighting, componentes flutuantes e sombras
  desconectadas;
- console sem erros/WebGL warnings, testes, lint focado e build de produção.
