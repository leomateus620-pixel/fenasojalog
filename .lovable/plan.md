
Problema confirmado (reproduzido):
- Ao abrir modais de “Novo/Adicionar/Nova Tarefa/Novo Hóspede”, o overlay aparece e o conteúdo do modal fica invisível inicialmente.
- Em “Veículos”, ao clicar no card, o detalhe abre de forma inconsistente (às vezes não aparece, às vezes aparece com comportamento instável).

Do I know what the issue is?
- Sim.

Causa raiz:
1) `src/components/ui/dialog.tsx` está com contrato global frágil para todos os modais (posicionamento/stacking/animação), o que gera overlay visível com conteúdo não renderizado corretamente em alguns cenários.
2) `src/pages/VehiclesPage.tsx` tem fluxo de abertura do detalhe suscetível a corrida de evento (click + open/close), causando não abertura intermitente.

Plano de correção (implementação):
1. Padronizar um “Dialog seguro” global em `src/components/ui/dialog.tsx`
- Ajustar centralização para padrão estável (viewport-centered robusto).
- Garantir hierarquia de camadas explícita (overlay abaixo, conteúdo acima).
- Remover dependências de classes que podem deixar o conteúdo visualmente invisível na abertura.
- Manter limite de viewport e estrutura `flex-col` com scroll interno previsível.

2. Corrigir abertura do detalhe de veículo em `src/pages/VehiclesPage.tsx`
- Criar handler determinístico `openVehicleDetail(vehicle)` sem fluxo ambíguo.
- Simplificar `onOpenChange` e limpar estado no fechamento (`detailVehicle`).
- Remover interceptações excessivas de outside interaction que podem conflitar com a abertura.
- Preservar header fixo + body com `overflow-y-auto` para não cortar conteúdo.

3. Blindar modais de formulários longos (responsividade real)
- Revisar `DialogContent` em:
  - `src/pages/TransportsPage.tsx`
  - `src/pages/GuestsPage.tsx`
  - `src/pages/ChecklistPage.tsx`
- Aplicar padrão: altura máxima de viewport + área interna rolável (sem estourar desktop/mobile).

4. “Aprendizado” para evitar regressão
- Consolidar no projeto um padrão único de modal: camada, tamanho, scroll e fechamento.
- Reaplicar o mesmo padrão em todos os pontos “Novo/Adicionar/Editar”.
- Documentar no código (comentário curto no `dialog.tsx`) o contrato obrigatório do modal.

Testes (obrigatórios após implementar):
1) Desktop (1366x768) e viewport atual:
- Abrir: Novo Transporte, Adicionar Veículo, Nova Tarefa, Novo Hóspede, detalhe de veículo.
- Verificar: modal visível imediatamente, centralizado, sem corte, com scroll interno funcional.

2) Mobile (390x844 e 375x812):
- Repetir todos os fluxos acima com toque único.
- Verificar: abre sempre na primeira interação, sem tela “vazia”/overlay sem conteúdo.

3) Regressão:
- Fechar/reabrir modais em sequência.
- Alternar entre páginas e abrir modais novamente.
- Confirmar consistência visual e fluidez sem travas.

Arquivos foco:
- `src/components/ui/dialog.tsx` (correção global principal)
- `src/pages/VehiclesPage.tsx` (detalhe do veículo e fluxo de abertura)
- `src/pages/TransportsPage.tsx` (modal “Novo/Editar”)
- `src/pages/GuestsPage.tsx` (modal “Novo/Editar hóspede”)
- `src/pages/ChecklistPage.tsx` (modal “Nova tarefa”)
