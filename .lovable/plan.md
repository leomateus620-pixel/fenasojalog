

# Relatório do Sistema — Novo Menu + PDF Completo

## Visao Geral

Criar uma nova pagina `/system-report` acessivel pelo menu lateral (secao Sistema, abaixo de Configuracoes), que permite ao usuario selecionar um periodo e gerar um PDF completo com todos os dados do sistema naquele intervalo, servindo como backup operacional.

## Arquitetura

**Client-side** — todos os dados ja existem nos hooks. A pagina reutiliza os hooks existentes (`useTransports`, `useVehicles`, `useGuests`, `useEvents`, `useTasks`, `useElectricCarts`, `useScooters`, `useSchedules`, `useFuelRecords`, `useVehicleUsage`, `useTransportGuests`, `useOrgMembers`) e filtra por periodo. O PDF e gerado client-side com `jspdf` + `jspdf-autotable` (ja instalados).

Nao e necessario edge function, migracao de banco ou hooks novos.

## Modulos cobertos no relatorio

| Modulo | Tabela/Hook | Campos de data para filtro |
|---|---|---|
| Transportes | `transports` | `inicio_em`, `created_at`, `updated_at` |
| Veiculos | `vehicles` | `created_at`, `updated_at` |
| Uso de Veiculos | `vehicle_usage` | `retirada_em`, `created_at` |
| Abastecimentos | `fuel_records` | `created_at` |
| Hospedes | `guests` | `checkin_em`, `checkout_em`, `created_at` |
| Transport-Hospedes | `transport_guests` | `created_at` |
| Agenda/Eventos | `events` | `inicio_em`, `created_at` |
| Tarefas | `tasks` | `due_em`, `created_at`, `updated_at` |
| Carrinhos Eletricos | `electric_carts` | `created_at`, `updated_at` |
| Patinetes | `scooters` | `created_at`, `updated_at` |
| Escalas | `schedules` + `schedule_shifts` + `shift_assignments` | `data_inicio`, `created_at` |
| Equipe | `org_members` | `created_at` |

## Regra de filtro por periodo (Modo Completo)

Um registro entra no relatorio se **qualquer** campo de data relevante cai dentro do intervalo selecionado (created_at, updated_at, data operacional). Isso garante cobertura maxima para contingencia.

## Implementacao — Arquivos

### 1. `src/lib/generateSystemReportPdf.ts` (novo)

Funcao `generateSystemReportPdf(payload)` que recebe todos os dados filtrados e gera o PDF com:
- Capa (titulo, periodo, data geracao, usuario)
- Resumo executivo (totais por modulo, criados/alterados)
- Metadados do relatorio (filtros, ID unico, timezone)
- Secoes por modulo (resumo + tabela detalhada com todos os campos)
- Secao de inconsistencias/alertas
- Nota metodologica
- Rodape com paginacao

### 2. `src/lib/systemReportCollector.ts` (novo)

Modulo puro que recebe os arrays de dados dos hooks + periodo e retorna:
- Dados filtrados por modulo
- Contagens (criados, alterados, ativos)
- Inconsistencias detectadas (campos nulos criticos, vinculos quebrados)
- Resumo executivo

### 3. `src/pages/SystemReportPage.tsx` (novo)

Pagina com:
- Cabecalho explicativo
- Seletores de data inicial/final (DatePicker)
- Tipo de relatorio (Completo / Por modulos)
- Checkboxes de modulos (quando "por modulos")
- Pre-visualizacao (contagens por modulo antes de gerar)
- Botao "Gerar PDF"
- Feedback de progresso

### 4. `src/App.tsx` — adicionar rota `/system-report`

### 5. `src/components/Sidebar.tsx` — adicionar item na secao Sistema:
```
{ to: '/system-report', icon: FileText, label: 'Relatório do Sistema' }
```

## Arquivos criados/alterados

| Arquivo | Acao |
|---|---|
| `src/lib/systemReportCollector.ts` | Criar — logica de coleta e filtro |
| `src/lib/generateSystemReportPdf.ts` | Criar — geracao PDF |
| `src/pages/SystemReportPage.tsx` | Criar — pagina principal |
| `src/App.tsx` | Editar — adicionar rota |
| `src/components/Sidebar.tsx` | Editar — adicionar menu |

## O que NAO muda

- Nenhuma alteracao em paginas existentes
- Nenhuma migracao de banco
- Nenhuma edge function nova
- Nenhuma alteracao em hooks existentes
- Nenhuma dependencia nova (jspdf ja instalado)

