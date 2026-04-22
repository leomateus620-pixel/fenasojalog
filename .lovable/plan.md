

## Exportar autorizações de Patinetes e Carrinhos Elétricos (CSV + PDF)

### Diagnóstico
Hoje a aba **Autorizados** dentro de `Patinetes` e `Carrinhos Elétricos` (componente compartilhado `AuthorizationsTab`) já lê de `mobility_authorizations` e tem um botão **CSV** simples. Porém:

1. O CSV exporta TODAS as autorizações (incluindo pendentes/bloqueadas) — não é "apenas aprovadas"
2. **Não existe geração de PDF**
3. O CSV atual não tem cabeçalho institucional, totalizadores nem agrupamento por comissão

A solicitação é: **gerar CSV + PDF organizados, considerando apenas as solicitações aprovadas (`access_status = 'liberado'`)**, com botões disponíveis em ambos os menus para rodar quando todos enviarem suas solicitações.

### Solução

**1. Novo helper compartilhado: `src/lib/generateMobilityAuthorizationsExport.ts`**

Centraliza a lógica para os dois tipos (patinete e carro elétrico), evitando duplicação:

- `exportMobilityAuthorizationsCSV(authorizations, type)` 
  - Filtra `access_status === 'liberado'`
  - Ordena por **comissão → nome do integrante**
  - BOM UTF-8 (`\uFEFF`) para Excel reconhecer acentos
  - Colunas: `Nº | Comissão | Presidente | Resp. Operacional | Telefone Op. | Nome | Cargo | CPF/Identificador | QR Gratuito | Modal | Data Aprovação`
  - Nome de arquivo: `autorizacoes_aprovadas_<patinetes|carrinhos>_<YYYY-MM-DD>.csv`

- `exportMobilityAuthorizationsPDF(authorizations, type)` usando `jsPDF` + `jspdf-autotable` (já presentes no projeto):
  - **Capa institucional** com fundo verde Fenasoja (`#194019`) + dourado (`#DCBE50`), título dinâmico:
    - "Autorizações Aprovadas — Patinetes" / "Autorizações Aprovadas — Carrinhos Elétricos"
    - Subtítulo "Fenasoja 2026 — Logística"
    - Data de geração + total de autorizações aprovadas
  - **Página de resumo** com:
    - Total de aprovados
    - Quantidade de comissões representadas
    - Quantidade com QR gratuito
    - Card destaque por comissão (mini tabela: comissão | nº integrantes | nº QR grátis)
  - **Tabelas agrupadas por comissão** (uma seção por comissão):
    - Cabeçalho da seção: nome da comissão + presidente + responsável operacional + telefone
    - Tabela: `# | Nome | Cargo | CPF/Identificador | QR | Aprovado em`
    - Tema `striped`, header verde `#194019` com texto dourado
  - **Rodapé** em todas as páginas: "Fenasoja Logística — Documento oficial de autorização" + paginação `Página X de Y`
  - Nome do arquivo: `autorizacoes_aprovadas_<patinetes|carrinhos>_<YYYY-MM-DD>.pdf`

**2. Atualizar `src/components/mobility/AuthorizationsTab.tsx`**

Substituir o botão **CSV** atual por um agrupamento de exportação:

- Botão dropdown / ou dois botões lado a lado:
  - **Exportar CSV** (ícone `FileSpreadsheet`)
  - **Exportar PDF** (ícone `FileText`)
- Ambos exportam **somente os registros com `access_status === 'liberado'`** — independente dos filtros de tela aplicados (busca, comissão, status), garantindo que sempre saia "todos aprovados"
- Antes de exportar, validar: se nenhuma autorização aprovada → `toast.warning('Nenhuma solicitação aprovada para exportar.')`
- Toast de sucesso ao concluir: `Exportadas N autorizações aprovadas`

**3. Estilo visual dos botões (Liquid Glass coerente)**

Manter padrão `h-10 gap-1.5 rounded-xl` já usado na página, com ícones lucide:
- `FileSpreadsheet` (verde sutil) para CSV
- `FileDown` (dourado) para PDF

### Arquivos

| Arquivo | Tipo | Mudança |
|---|---|---|
| `src/lib/generateMobilityAuthorizationsExport.ts` | Novo | Funções `exportMobilityAuthorizationsCSV` e `exportMobilityAuthorizationsPDF` parametrizadas por tipo |
| `src/components/mobility/AuthorizationsTab.tsx` | Edit | Substitui botão único CSV por dois botões (CSV + PDF) chamando o novo helper, filtrando apenas `liberado` |

Sem migração de banco. Sem alteração no fluxo de aprovação. As páginas `ScootersPage` e `ElectricCartsPage` herdam automaticamente os novos botões pois já consomem `<AuthorizationsTab type="..." />`.

### Critério de aceite

1. Aba **Autorizados** em Patinetes e em Carrinhos Elétricos passa a ter dois botões: **CSV** e **PDF**
2. Clicar em CSV gera um arquivo `.csv` aberto corretamente em Excel (acentos OK), contendo apenas autorizações com status **Liberado**, ordenadas por comissão e nome
3. Clicar em PDF gera um documento institucional com capa verde+dourado, página de resumo, tabelas agrupadas por comissão e paginação
4. Quando não houver nenhum aprovado, exibe toast de aviso sem gerar arquivo vazio
5. Filtros de tela (busca/status/comissão) **não interferem** na exportação — sempre exporta o conjunto completo de aprovados

