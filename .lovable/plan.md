

## Diagnóstico

Nos cards de transporte (e na visualização de detalhes/dynamic island), são exibidos dois horários lado a lado:
- **Chegada** (~14:39) — ETA real calculada pela Google Routes API.
- **Retorno** (~13:49) — atualmente está mostrando um valor inconsistente (próximo do horário atual), pois não representa um retorno real do destino, e sim um cálculo derivado que confunde o operador.

O horário de retorno do destino quase nunca é conhecido (depende do tempo que o convidado fica no local), então exibi-lo gera ruído visual e induz erro.

## Correção

Remover **toda exibição** do "Retorno ~HH:MM" da UI, mantendo apenas "Chegada ~HH:MM". A lógica de cálculo de retorno (usada para outros fins, como agenda de retorno do aeroporto) **não será removida** — apenas a exibição visual nos pontos abaixo.

### Pontos de exibição a ajustar

| Arquivo | Mudança |
|---|---|
| `src/components/transport/TransportCard.tsx` | Remover badge/pill "Retorno ~HH:MM" ao lado de "Chegada" |
| `src/components/transport/TransportDetailView.tsx` | Remover linha/badge "Retorno ~HH:MM" da área de telemetria |
| `src/components/TransportDynamicIsland.tsx` | Remover "Retorno" do bloco de telemetria split (manter apenas Chegada, KM e duração) |
| `src/pages/TransportsPage.tsx` (se exibir inline) | Verificar e remover qualquer referência ao retorno estimado na lista |

### O que será preservado

- Cálculo interno de ETA de retorno (`return_eta`, hooks de estimativa) — continua funcionando para a automação de viagem de retorno do aeroporto.
- Coluna "SAÍDA / RETORNO" no header dos cards (datas/horas agendadas, não estimativas) — não confundir com o pill "Retorno ~HH:MM".
- Lógica de `useTransportReturnEstimate` — fica disponível mas não é mais consumida visualmente.

### Verificação

1. Buscar `Retorno` e `~` em `src/components/transport/**` e `src/components/TransportDynamicIsland.tsx` para localizar todas as ocorrências do pill.
2. Garantir que apenas o pill estimado (com ícone azul/relógio) seja removido, não a coluna agendada do header.
3. Conferir no card de transporte ativo (em andamento) e no Dynamic Island (mobile e desktop) que apenas "Chegada ~HH:MM" permanece visível.

## Resultado

- Card e detalhes mostram somente "Chegada ~HH:MM" (ETA real).
- Sem mais informação confusa sobre retorno estimado.
- Automação de retorno do aeroporto e demais cálculos internos preservados.

