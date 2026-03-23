
Plano de correção definitiva (menu de veículos mobile + desktop)

Diagnóstico confirmado
- O modal está “ancorado” em `top: 50%` e, em cenários com animação/transform, perde o deslocamento correto de centralização, ficando baixo e cortado.
- No mobile, o clique no card pode abrir e fechar no mesmo gesto (interação fora do conteúdo), dando impressão de que “não abre”.
- Há warning de `ref` no `Badge` que indica componente base fora do padrão Radix (não é a causa principal do corte, mas precisa corrigir para robustez).

Do I know what the issue is?
- Sim: contrato de modal não está resiliente (centralização + scroll + interação touch).

Arquivos e implementação

1) `src/components/ui/dialog.tsx` (correção estrutural global)
- Remover centralização dependente de `translate(-50%, -50%)`.
- Adotar container de viewport seguro (`fixed inset-0 grid place-items-center p-3 sm:p-6`) e conteúdo com:
  - `w-[min(96vw,42rem)]`
  - `max-h-[min(88dvh,52rem)]`
  - `overflow-hidden flex flex-col`
- Manter visual liquid glass premium.
- Ajustar z-index do overlay/content para ficar sempre acima de sidebar e elementos fixos.

2) `src/pages/VehiclesPage.tsx` (correção funcional do menu)
- Criar `openVehicleDetail(vehicle)` com abertura desacoplada do gesto (RAF/micro-delay) para evitar fechamento imediato no mobile.
- No `VehicleDetailModal`, travar contrato:
  - header fixo (`shrink-0`)
  - corpo com `flex-1 min-h-0 overflow-y-auto overscroll-contain`.
- Impedir fechamento acidental no primeiro toque externo (`onPointerDownOutside`/`onInteractOutside` controlado).
- Garantir limpeza de estado ao fechar (`detailVehicle`).

3) `src/components/ui/badge.tsx` (hardening)
- Migrar `Badge` para `React.forwardRef` para eliminar warning e evitar problemas de integração com primitives.

4) Prevenção de erro semelhante (“aprendizado” aplicado)
- Padronizar “modal seguro” como regra do projeto (dialog base resiliente + body scroll interno).
- Aplicar o mesmo padrão aos modais longos já existentes (ex.: históricos de recursos) para evitar regressão futura.

Validação (obrigatória após implementar)
- Testar em 390x844, 768x1024 e 1366x768:
  - abrir detalhe do 1º, do meio e do último veículo;
  - confirmar centralização real (vertical e horizontal);
  - confirmar ausência de corte;
  - confirmar rolagem interna completa;
  - confirmar que abre no mobile em toque único sem sumir.
