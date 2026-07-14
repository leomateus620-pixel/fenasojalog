# B11, Sede Fenasoja e Sala de Reuniões — mapa técnico 3D

## Escopo e fonte de verdade

Este upgrade altera somente a apresentação procedural 3D de `B11` e `B12`.
IDs persistidos, GeoJSON, coordenadas, elevação, altura cartográfica, camadas,
relações comerciais, busca, permissões, seleção, edição e integrações com o
Supabase permanecem inalterados.

As fotografias recebidas em 13/07/2026 foram identificadas pelo conteúdo
arquitetônico, pois a ordem visual dos anexos diverge da numeração descrita no
pedido:

- `22.00.33 (1)` e `22.00.33`: Centro Administrativo / Auditório (`B11`), com
  fachada verde longitudinal de dois pavimentos e mural na empena;
- `22.00.34`: fachada principal da Sede Fenasoja / Comissão Central (`B12`);
- `22.00.34 (1)`: volume lateral da Sala de Reuniões ligado à Sede, com mural
  amarelo/laranja, cobertura baixa e escada frontal.

## Implantação preservada

| Estrutura | ID local de referência | Centro local | Footprint local | Rotação persistida | Relação cartográfica |
| --- | --- | --- | --- | --- | --- |
| Centro Administrativo / Auditório | `reference:2026:b11` | `9,7636; 22,3636` | `2,7273 × 6,5455` | `0` | a oeste da Rua Brasília, com a extremidade sul junto à Av. Benvenuto de Conti |
| Sede Fenasoja / Comissão Central | `reference:2026:b12` | `16,4727; 15,4036` | `2,9455 × 2,2691` | `0` | canto sudoeste da Quadra B, junto à Rua Argentina e voltado também à curva da Rua Brasília |
| Sala de Reuniões oficial independente | `reference:2026:b41` | `-23,6509; 16,6909` | `1,6145 × 1,4400` | `0` | entidade distante da Sede; não será movida nem reutilizada como anexo |

A Sala de Reuniões fotografada será modelada como subvolume arquitetônico de
`B12`. Assim, o conjunto real passa a existir visualmente sem criar um ID
duplicado, alterar `B41` ou deslocar entidades oficiais.

## Diagnóstico anterior

### B11

- usava o mesmo `ExtrudeGeometry` genérico das demais estruturas;
- não possuía segundo pavimento, ritmo de janelas, faixas brancas, aparelhos de
  ar-condicionado, cobertura, empena, mural ou acesso;
- a leitura institucional e a relação longitudinal com a Rua Brasília não eram
  reconhecíveis em nenhuma distância;
- o foco apenas ampliava o prisma e o rótulo.

### Sala de Reuniões anexa

- inexistia dentro do asset de `B12`;
- faltavam cobertura baixa, clerestório, esquadrias, parede gráfica, escada e a
  transição física com o corpo principal;
- a ausência fazia a Sede parecer um volume isolado e simétrico.

### Sede Fenasoja / Comissão Central

- a empena, a cobertura inclinada, a marquise curva e a identidade eram uma boa
  base e devem ser preservadas;
- todo o asset enfrentava apenas o sul local (`+Z`), como se respondesse somente
  à Quadra A/Rua Argentina;
- a plataforma ocupava quase todo o envelope sem considerar a rotação para o
  canto sudoeste e a curva próxima da Rua Brasília;
- faltavam a composição assimétrica real, o anexo lateral, seu mural e uma
  leitura mais clara de acesso/paisagismo no canto.

## Mapa de implementação

| Componente | Preservar | Corrigir/substituir | Adicionar | Validar |
| --- | --- | --- | --- | --- |
| `B11` | ID, footprint, altura persistida, camada, metadata e picking | substituir o prisma por corpo longitudinal de dois pavimentos orientado para leste | bandas, janelas instanciadas, ACs, cobertura baixa espessa, empena/mural sul, acesso, escada e recuo verde | overview, fachada leste, empena sul, vista elevada, foco, busca `B11` e edição |
| Sala anexa | vínculo visual com `B12`; `B41` intacta | ocupar a lateral sem exceder o envelope orientado de `B12` | volume baixo, cobertura branca, clerestório, mural quente, entrada/escada e transição estrutural | leitura conjunta com a Sede, mural visível, ausência de z-fighting e picking único de `B12` |
| `B12` | empena, marquise curva, vidro, marca, monumento e detalhe de recepção úteis | orientar o conjunto para sudoeste, reduzir/recompor o corpo dentro do footprint e reforçar profundidade | anexo, paisagismo/palmeiras de baixo custo, acesso de esquina e fachada lateral | Rua Argentina + Rua Brasília, frontal, lateral, elevada, foco, troca rápida e editor |

## Contratos de renderização e interação

- `StrategicLandmarkModel` continua resolvendo assets por `publicIdentifier`,
  enquanto `entity.id` segue como chave de hover, clique, foco e painel;
- um único volume invisível derivado do GeoJSON permanece como alvo de raycast;
- todas as peças arquitetônicas usam `raycast={NO_RAYCAST}`;
- `frameloop="demand"`, sombras estáticas e invalidação explícita são mantidos;
- corpos e coberturas são opacos; transparência fica restrita ao vidro frontal;
- janelas, faixas, esquadrias, ACs, degraus e paisagismo repetidos usam
  `InstancedMesh` e geometrias unitárias compartilhadas;
- cada mural usa uma única textura canvas pequena, montada apenas no LOD
  próximo/focado, sem mapas adicionais ou animação;
- o foco continua calculado pelo footprint e passa a considerar a nova altura e
  direção arquitetônica; o rótulo selecionado permanece exclusivo;
- nenhuma mudança é necessária em rotas, autenticação, migrations, RLS,
  serviços, stores, filtros, contratos ou fluxos de edição.

## Critérios de aceite técnico

1. `B11` resolve um asset próprio e deixa de passar pelo extrude genérico.
2. `B12` preserva seu ID/GeoJSON, mas apresenta a fachada em três quartos para
   o canto Rua Argentina/Rua Brasília.
3. O anexo fica conectado ao corpo principal e não cria ou desloca entidade.
4. `B41` conserva ID, coordenadas, nome e comportamento anteriores.
5. Busca, clique, duplo clique, painel, editor e troca rápida continuam usando
   as entidades originais.
6. Visão geral, frontal, lateral, elevada e foco não apresentam clipping,
   z-fighting, peças flutuantes, normais invertidas ou sombras desconectadas.
7. Testes, lint focado, build, console/WebGL e navegação autenticada permanecem
   estáveis.
