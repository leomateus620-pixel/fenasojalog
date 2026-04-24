

## Agenda em 3D Liquid Glass + Detalhe dedicado por card

### Diagnóstico
A `AgendaPage` mistura eventos comuns e transportes em uma lista única. Hoje:
1. Os cards usam um Liquid Glass básico (`bg-white/10 backdrop-blur-xl`) sem profundidade real, sem 3D, sem micro-animações distintivas.
2. **Clicar em um card de transporte não faz nada** — o handler `onClick={() => e._source !== 'transport' && openEdit(e)}` ignora explicitamente transportes; somente eventos abrem o modal de edição. O usuário fica sem feedback nem informações.
3. Cards de eventos abrem direto em modo edição, sem uma visualização rica de leitura.

### O que vai ser construído

#### 1. Novo componente `AgendaItemCard3D` (`src/components/agenda/AgendaItemCard3D.tsx`)
Card premium exclusivo da Agenda — visual diferenciado, **não** copia o EventCard da Fenasoja:

- **Estrutura 3D real** com `perspective: 1400px` no container e `transform-style: preserve-3d` no card
- **Tilt dinâmico no mouse**: handler `onMouseMove` calcula posição relativa e aplica `rotateX/rotateY` sutis (máx ±6deg), com `transition` suave no `mouseleave` para voltar à posição neutra. Em mobile usa apenas press-scale (`active:scale-[0.985]`).
- **Camadas empilhadas em Z**:
  - Camada base: superfície em vidro com gradiente direcional verde profundo → dourado translúcido (`from-primary/15 via-card/65 to-gold/8`)
  - Camada média: borda interna iluminada (`inset_0_1px_0`) + sombra externa em duas etapas (proximidade + distância)
  - Camada de luz: barra lateral vertical de **6px** em gradiente verde→dourado com `box-shadow` brilhante (identidade visual única por turno: manhã = dourado puro, tarde = verde-âmbar, noite = índigo profundo)
  - Camada superior: **shimmer diagonal** que cruza o card a cada hover (animação `shimmer-diagonal` já existe no projeto)
  - Camada flutuante (`translateZ(20px)`): bloco de horário em vidro fosco que "salta" sutilmente do card
- **Coluna de tempo redesenhada**: relógio digital em fonte mono com `text-shadow` dourado sutil + chip do turno (Manhã/Tarde/Noite) com ícone animado (`Sun` rotaciona devagar, `Sunset` desliza, `Moon` pulsa)
- **Indicador "EM ANDAMENTO"** quando o evento está acontecendo agora: anel pulsante verde + ponto LED animado + texto deslizante
- **Status de transporte como badge 3D** (Pendente azul / Em andamento dourado pulsante / Concluído verde com check)
- **Animação de entrada** escalonada (`animationDelay: index * 60ms`) usando keyframe `card-enter-3d` (já existe no projeto)
- **Respeita `motion-reduce`**: fallback para `fade-in` simples, sem tilt, sem shimmer

#### 2. Novo componente `AgendaItemDetailDialog` (`src/components/agenda/AgendaItemDetailDialog.tsx`)
Diálogo dedicado de **leitura rica** que abre ao clicar em **qualquer** card (evento OU transporte) — corrige o bug do clique sem resposta:

- Header com gradiente verde→dourado, título grande, badge de status e turno
- Faixa de horário destacada: início → fim, duração calculada, indicador "está acontecendo agora" se aplicável
- Para **eventos comuns**: local, responsável (com cargo), comissão, observações em bloco com fundo glass, botões "Editar" e "Excluir" (respeitando `myRole`)
- Para **transportes**: reaproveita o `TransportWeatherCard` já existente + bloco com origem→destino→retorno (padrão de nomenclatura do projeto), motorista, comissão, hóspedes vinculados (chips), botão "Abrir em Transportes" que navega para `/transportes` e dispara o detalhe completo via query param
- Layout flex com header fixo e área de scroll central (`max-h-[80dvh]`), seguindo o padrão `guest-dialog-layout` da memória do projeto
- Animação de entrada `scale-in` + `fade-in` (já existem)

#### 3. Refatorar `src/pages/AgendaPage.tsx`
- Substituir o JSX inline dos cards (linhas 372–451) pelo `<AgendaItemCard3D>`
- Trocar o `onClick` atual por um único handler `setDetailItem(e)` que **funciona para evento E transporte**
- Adicionar estado `detailItem` e renderizar `<AgendaItemDetailDialog item={detailItem} ... />` quando aberto
- O modal de edição existente continua sendo acionado a partir do botão "Editar" dentro do detail dialog (não mais pelo clique direto no card)
- Atualizar o cabeçalho de cada turno (Manhã/Tarde/Noite) com um pequeno marcador 3D (linha em gradiente + ícone)

#### 4. Cores e tokens (sem mudar `index.css`)
Usar exclusivamente as cores já existentes do projeto:
- `hsl(var(--primary))` — verde profundo institucional
- `hsl(var(--gold))` — dourado da identidade Fenasoja
- `hsl(var(--card))`, `hsl(var(--border))`, `hsl(var(--muted-foreground))`
- Gradientes derivados via Tailwind arbitrary values, sem cores hardcoded

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/agenda/AgendaItemCard3D.tsx` | **Criar** — card 3D Liquid Glass com tilt, shimmer, camadas e variantes evento/transporte |
| `src/components/agenda/AgendaItemDetailDialog.tsx` | **Criar** — diálogo de detalhe rico para qualquer item da agenda |
| `src/pages/AgendaPage.tsx` | **Editar** — usar os dois novos componentes, adicionar estado `detailItem`, corrigir o clique em transportes |

### Critério de aceite
1. Todos os cards da `/agenda` exibem o novo visual 3D Liquid Glass com tilt suave no hover (desktop) e press-scale (mobile)
2. Clicar em **qualquer card** (evento OU transporte) abre o `AgendaItemDetailDialog` com todas as informações daquele item
3. O bug atual — clique em transporte não faz nada — fica resolvido
4. Visual usa apenas as cores do projeto (verde primário + dourado), sem genérico de IA
5. Animações respeitam `prefers-reduced-motion`
6. Nenhum hook, RLS, banco ou outro módulo é afetado

