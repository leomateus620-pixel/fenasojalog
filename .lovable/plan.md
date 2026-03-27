

# Quilometragem & Emissões — Novo Menu

## Visão Geral

Criar uma nova página `/km-emissoes` com consolidação de quilometragem operacional por período, análise por veículo/hóspede, detecção de inconsistências, e exportação PDF completa.

## Arquitetura

Todo o processamento será **client-side** — os dados já existem nas queries de `transports`, `vehicles`, `guests` e `transport_guests`. Não há necessidade de edge function ou tabela nova; a consolidação é uma derivação de dados existentes.

O PDF será gerado via `reportlab` em script Python executado no servidor (artifact em `/mnt/documents/`), recebendo o payload JSON consolidado.

## Períodos

```typescript
const PERIODS = [
  { id: 'p1', label: 'Período 1', start: '2026-04-29', end: '2026-05-02' },
  { id: 'p2', label: 'Período 2', start: '2026-05-02', end: '2026-05-10' },
];
```

Estrutura extensível — basta adicionar objetos ao array.

## Regra de KM (fonte)

Para cada transporte, determinar a fonte do km nesta prioridade:

1. **`distancia_estimada_km`** salvo no banco → fonte: "KM salvo no transporte"
2. **`getRoundTripKm(titulo, voo_cidade)`** do mapa estático → fonte: "Rota conhecida"
3. **Nenhum** → marcar como "Base insuficiente", km = null, não entra no total

Transportes cancelados são **excluídos** do total oficial. Pendentes aparecem separados como "previstos".

## Regra de não-duplicidade

Cada transporte tem um `id` único. O km é contado **uma vez por transporte**, independente de quantos hóspedes estejam vinculados. Hóspedes aparecem apenas na seção analítica.

## Implementação — Arquivos

### 1. `src/lib/kmConsolidation.ts` (novo)

Módulo puro com a lógica de consolidação:

- `consolidateTransports(transports, transportGuests, guests, vehicles, members, periods)` → retorna estrutura normalizada com:
  - Lista de registros normalizados por transporte (id, data, período, origem, destino, veículo, motorista, hóspedes, km, fonte_km, consistência)
  - Totais por período, por dia, por veículo
  - Lista de inconsistências (sem veículo, sem km, sem origem/destino válido)
  - Separação: km confirmados vs previstos vs pendentes vs cancelados

### 2. `src/pages/KmEmissoesPage.tsx` (novo)

Página principal com os 7 blocos:

- **Cabeçalho**: título, subtítulo, aviso metodológico
- **Bloco 1**: Cards dos 2 períodos (km total, transportes, veículos, hóspedes, pendências)
- **Bloco 2**: Resumo comparativo entre períodos + total geral
- **Bloco 3**: Tabela diária com expand para listar transportes do dia
- **Bloco 4**: Lista detalhada por transporte com fonte do km e indicador de consistência
- **Bloco 5**: Consolidação por veículo
- **Bloco 6**: Consolidação analítica por hóspede (não soma km)
- **Bloco 7**: Inconsistências e dados pendentes
- **Botão**: Gerar PDF

Usa os hooks existentes (`useTransports`, `useVehicles`, `useGuests`, `useTransportGuests`, `useOrgMembers`).

### 3. `src/App.tsx`

Adicionar rota `/km-emissoes` → `KmEmissoesPage`.

### 4. `src/components/Sidebar.tsx`

Adicionar item no grupo "Operação":
```
{ to: '/km-emissoes', icon: Ruler, label: 'KM & Emissões' }
```

### 5. `src/components/BottomTabs.tsx`

Verificar se precisa adicionar tab mobile (se houver espaço).

### 6. Geração de PDF

Botão na página chama uma edge function `generate-km-report` que recebe o payload consolidado e retorna um PDF via `jsPDF` ou gera client-side com uma lib JS. Alternativa: gerar client-side com `jspdf` + `jspdf-autotable` (sem necessidade de edge function).

**Decisão**: usar **client-side** com `jspdf` + `jspdf-autotable` para evitar complexidade de edge function. Instalar as dependências npm.

Estrutura do PDF:
1. Capa (título, períodos, data geração)
2. Resumo executivo
3. Comparativo entre períodos
4. Consolidação diária (tabela)
5. Consolidação por transporte (tabela detalhada)
6. Consolidação por veículo
7. Consolidação por hóspede (analítica)
8. Inconsistências
9. Nota metodológica

### 7. `src/lib/generateKmPdf.ts` (novo)

Função que recebe os dados consolidados e gera o PDF usando jsPDF.

## Dependências novas

- `jspdf` + `jspdf-autotable` (para geração PDF client-side)

## Arquivos alterados/criados

| Arquivo | Ação |
|---|---|
| `src/lib/kmConsolidation.ts` | Criar — lógica de consolidação |
| `src/lib/generateKmPdf.ts` | Criar — geração PDF |
| `src/pages/KmEmissoesPage.tsx` | Criar — página principal |
| `src/App.tsx` | Editar — adicionar rota |
| `src/components/Sidebar.tsx` | Editar — adicionar menu |
| `src/components/BottomTabs.tsx` | Editar — adicionar tab se aplicável |

## O que NÃO muda

- Nenhuma alteração em TransportsPage, VehiclesPage, GuestsPage
- Nenhuma migração de banco
- Nenhuma edge function nova
- Nenhuma alteração em hooks existentes

