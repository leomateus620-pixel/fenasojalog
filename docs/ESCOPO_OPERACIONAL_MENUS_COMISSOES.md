# Escopo Operacional dos Menus das Comissões

## 1. Objetivo desta etapa

Esta etapa transforma os módulos em estruturação em telas de escopo operacional. Os menus deixam de apresentar descrições genéricas e passam a indicar objetivo, atividades, tarefas, dados futuros, indicadores, relatórios, responsáveis prováveis, fluxos e observações.

O foco ainda não é criar cadastros reais, tabelas no banco ou formulários funcionais. O objetivo é deixar claro para cada comissão o que será registrado em cada área e como essas informações poderão apoiar a Comissão Central e a presidência.

## 2. Preservação da Logística

A Comissão de Logística foi preservada como módulo operacional validado. Não foram alteradas rotas, páginas, hooks, dashboards, métricas, gráficos, regras de autenticação ou lógica de funcionamento da Logística.

As alterações desta etapa são concentradas nos módulos que ainda usam o placeholder modular:

- Gastronomia;
- Infraestrutura;
- Serviços;
- Arte e Cultura;
- Novas Gerações;
- Segurança;
- Limpeza;
- Financeiro Gerencial.

## 3. Enriquecimento do registry

A fonte central continua sendo:

- `src/modules/commissions/commissionRegistry.ts`

O tipo `CommissionMenuItem` agora aceita campos opcionais de escopo. Esses campos permitem que cada menu descreva sua função operacional sem quebrar módulos já existentes.

Campos adicionados:

- `objective`: objetivo do menu;
- `activities`: principais atividades;
- `tasks`: tarefas previstas;
- `dataInputs`: dados que serão cadastrados futuramente;
- `outputs`: saídas esperadas;
- `indicators`: indicadores futuros;
- `reports`: relatórios esperados;
- `responsibleProfiles`: responsáveis prováveis;
- `statusFlow`: fluxo de status sugerido;
- `priorityRules`: regras de prioridade;
- `notes`: observações de uso;
- `futureEnhancements`: melhorias futuras.

Todos os campos são opcionais. Se uma seção não existir para determinado menu, a interface não renderiza bloco vazio.

## 4. Exibição na interface

O componente `CommissionDashboardPlaceholder` agora funciona como uma tela de escopo do menu ativo.

Quando o usuário acessa uma rota como `/comissoes/gastronomia/fichas`, a página exibe o escopo de `Fichas`. Quando acessa o painel da comissão, a página exibe a visão geral daquele módulo.

A tela mostra:

- nome do módulo;
- área atual;
- descrição;
- objetivo;
- atividades principais;
- tarefas previstas;
- dados que serão registrados;
- saídas esperadas;
- indicadores futuros;
- relatórios esperados;
- responsáveis prováveis;
- fluxo de status;
- regras de prioridade;
- observações.

O layout usa os cards existentes de liquid glass e mantém a estrutura dos menus do módulo ao lado do escopo operacional.

## 5. Escopo por comissão

### Gastronomia

Estrutura voltada ao controle de fichas, refeições, consumo por comissão, estoque, devoluções e relatórios. O módulo prepara a base para fechamento diário e final da operação gastronômica.

Menus estruturados:

- Painel da Comissão;
- Fichas;
- Refeições;
- Consumo por Comissão;
- Estoque;
- Devoluções;
- Relatórios.

Principais decisões futuras:

- validar responsáveis pelo controle de fichas;
- definir a origem oficial dos números de refeições;
- separar consumo previsto, utilizado e devolvido;
- conectar relatórios somente depois de dados reais confiáveis.

### Infraestrutura

Estrutura voltada ao acompanhamento de obras, materiais, demandas, equipes, fornecedores, avanço físico, anexos e relatórios. O foco é execução, status, responsáveis, prazos e evidências.

Menus estruturados:

- Painel da Comissão;
- Obras;
- Materiais;
- Demandas;
- Equipes;
- Fornecedores;
- Avanço Físico;
- Anexos;
- Relatórios.

Principais decisões futuras:

- validar status oficiais para obras e demandas;
- definir armazenamento seguro para anexos;
- separar materiais previstos, recebidos e aplicados;
- vincular indicadores a evidências e responsáveis reais.

### Serviços

Estrutura voltada à abertura, acompanhamento e fechamento de chamados, demandas, equipes, status de execução, ocorrências e relatórios.

Menus estruturados:

- Painel da Comissão;
- Chamados;
- Demandas;
- Equipes;
- Status de Execução;
- Ocorrências;
- Relatórios.

Principais decisões futuras:

- definir prioridades de chamados;
- validar quem pode abrir solicitações;
- medir tempo de atendimento somente com dados reais;
- conectar equipes e responsáveis quando a operação estiver confirmada.

### Arte e Cultura

Estrutura voltada ao controle de atrações, artistas, palcos, agenda, demandas técnicas, contratos e relatórios da programação cultural.

Menus estruturados:

- Painel da Comissão;
- Atrações;
- Artistas;
- Palcos;
- Agenda;
- Demandas Técnicas;
- Contratos;
- Relatórios.

Principais decisões futuras:

- validar origem oficial da agenda cultural;
- separar demandas técnicas de pendências contratuais;
- proteger documentos sensíveis;
- evitar conflitos de horário entre palco, artista e estrutura.

### Novas Gerações

Estrutura voltada à organização de escolas, participantes, atividades, lanches, agenda e relatórios. O foco é controle de grupos, horários, quantidades e atendimento.

Menus estruturados:

- Painel da Comissão;
- Escolas;
- Participantes;
- Atividades;
- Lanches;
- Agenda;
- Relatórios.

Principais decisões futuras:

- validar responsáveis por escolas e grupos;
- confirmar fonte das quantidades de participantes;
- controlar lanches previstos e entregues;
- mapear necessidades especiais antes de qualquer fluxo real.

### Segurança

Estrutura voltada a escalas, ocorrências, pontos críticos, equipes e relatórios, com foco em prevenção, monitoramento e rastreabilidade.

Menus estruturados:

- Painel da Comissão;
- Escalas;
- Ocorrências;
- Pontos Críticos;
- Equipes;
- Relatórios.

Principais decisões futuras:

- validar níveis de gravidade;
- definir quem pode registrar ocorrências;
- proteger detalhes sensíveis;
- vincular escalas a postos e turnos reais.

### Limpeza

Estrutura voltada a rotinas, demandas, equipes, áreas, ocorrências e relatórios, com foco em execução recorrente e resposta rápida.

Menus estruturados:

- Painel da Comissão;
- Rotinas;
- Demandas;
- Equipes;
- Áreas;
- Ocorrências;
- Relatórios.

Principais decisões futuras:

- definir áreas oficiais do parque;
- classificar criticidade e frequência de limpeza;
- vincular equipes por turno;
- medir execução recorrente somente quando houver registros reais.

### Financeiro Gerencial

Estrutura futura, sensível e restrita, para projeções, receitas, despesas, orçamento por comissão, patrocínios, simulações e relatórios gerenciais.

Regras mantidas:

- `sensitive: true`;
- capability `financial_access`;
- acesso restrito;
- nenhum dado financeiro real;
- nenhum mock financeiro enganoso;
- linguagem clara de estrutura futura.

Menus estruturados:

- Painel Financeiro;
- Receitas Projetadas;
- Receitas Confirmadas;
- Despesas Previstas;
- Despesas Realizadas;
- Orçamento por Comissão;
- Patrocínios;
- Simulações;
- Relatórios.

Principais decisões futuras:

- definir fonte oficial dos dados financeiros;
- validar trilha de auditoria;
- separar projeções de registros confirmados;
- restringir relatórios por perfil autorizado.

## 6. Como usar esses dados para CRUDs reais

O escopo do registry deve orientar a próxima fase de implementação:

1. Escolher uma comissão e um menu específico.
2. Validar com os responsáveis se objetivo, dados e status estão corretos.
3. Definir regras de acesso por capability, perfil e organização.
4. Criar tabelas somente quando o fluxo estiver aprovado.
5. Implementar formulários, listas, filtros e relatórios com dados reais.
6. Conectar indicadores ao painel administrativo apenas após validação.

O registry não substitui o banco de dados. Ele documenta e renderiza o desenho operacional enquanto os fluxos reais não existem.

## 7. Observações de segurança e governança

Cada módulo deve manter isolamento por comissão e organização. Fluxos futuros precisam evitar mistura de dados entre áreas, especialmente quando houver anexos, documentos, ocorrências sensíveis ou informações financeiras.

O Financeiro Gerencial exige cuidado adicional. Qualquer implementação real deve validar fonte oficial, auditoria, permissões, visibilidade por perfil e logs de alteração antes de exibir valores.

## 8. Próximos passos

- Validar o escopo com as lideranças de cada comissão.
- Escolher uma comissão piloto, como Gastronomia ou Infraestrutura.
- Transformar um único menu em CRUD real antes de expandir para os demais.
- Definir padrões de anexos, status, auditoria e relatórios.
- Conectar dados reais ao painel administrativo somente depois da validação operacional.
