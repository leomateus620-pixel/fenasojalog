

# Módulo de Despesas & Ressarcimentos — Plano de Implementação

## Escopo e Faseamento

Este é um módulo completo que envolve ~10 tabelas novas, 1 edge function, 1 storage bucket, 5+ páginas/componentes e integrações com módulos existentes. Para manter qualidade e evitar regressões, a implementação será dividida em **3 fases incrementais**.

---

## FASE 1 — Fundação (esta entrega)

Banco de dados, página principal, CRUD de despesas, dashboard cards, navegação.

### 1.1 Banco de Dados (Migration)

Criar as seguintes tabelas com RLS org-scoped:

**`expense_categories`** — Categorias configuráveis
- id, org_id, name, icon, requires_vehicle, requires_transport, requires_document, active, created_at

**`expenses`** — Lançamentos de despesas
- id, org_id, category_id, transport_id, event_id, vehicle_id, member_user_id
- title, description, amount, expense_date, payment_method
- paid_by_user_id, paid_by_name, pix_key, pix_key_type
- status (rascunho/pendente_comprovante/pendente_validacao/aprovado/ressarcimento_solicitado/ressarcido/recusado/cancelado)
- created_by_user_id, created_at, updated_at

**`expense_documents`** — Comprovantes/notas anexadas
- id, expense_id, org_id, file_url, file_type, document_type
- qr_raw, qr_url, issuer_name, issuer_document, invoice_number, access_key
- issue_datetime, extracted_total, extracted_payload_json
- extraction_status, validation_status, created_at

**`reimbursements`** — Controle de ressarcimentos
- id, expense_id, org_id, beneficiary_user_id, beneficiary_name
- pix_key, pix_key_type, requested_amount, approved_amount, paid_amount
- status (pendente/aprovado/pago/recusado)
- approved_by, paid_by, requested_at, approved_at, paid_at
- payment_receipt_url, notes

**`expense_approvals`** — Log de aprovações
- id, expense_id, org_id, action, previous_status, new_status, reason, acted_by, acted_at

Storage bucket: `expense-documents` (privado, RLS por org_id no path)

Seed de categorias padrão (Combustível, Pedágio, Refeição, Hotel, Estacionamento, Manutenção, Compras operacionais, Outros).

RLS: mesmas regras do projeto — operador+ pode inserir/atualizar, admin/gestor pode deletar, membros da org podem ler.

### 1.2 Hook `useExpenses`

CRUD completo com React Query, seguindo padrão de `useFuelRecords`/`useTransports`:
- listagem com filtros (status, categoria, período, transporte, evento, membro)
- create, update, delete mutations
- upload de comprovante para storage
- mutation de aprovação/mudança de status

### 1.3 Página `ExpensesPage`

Nova rota `/expenses` — "Despesas & Ressarcimentos"

Estrutura:
- **Tabs**: Lançamentos | Ressarcimentos | Relatórios
- **Lançamentos**: Lista filtrada com chips (status, categoria, período), card por despesa com valor, categoria, status badge, comprovante indicator
- **Dialog de criação**: Formulário completo com seleção de categoria, valor, data, contexto (transporte/evento/veículo), quem pagou, upload de comprovante
- **Dialog de detalhes**: Visualização completa + ações (aprovar, recusar, solicitar ressarcimento)
- **Ressarcimentos tab**: Lista de pendências de ressarcimento com ações (aprovar, marcar como pago)

### 1.4 Navegação

- Sidebar: adicionar "Despesas" no grupo "Operação" com ícone `Receipt`
- BottomTabs: adicionar nos `moreLinks`
- App.tsx: nova rota `/expenses`

### 1.5 Dashboard

Adicionar card "Despesas" na seção de ações rápidas:
- Contador de despesas pendentes
- Valor total do período
- Alertas (sem comprovante, ressarcimento pendente)
- Botão "Registrar Despesa" que navega para `/expenses?action=create`

---

## FASE 2 — QR Code e Integrações (entrega futura)

- **Scanner QR**: Componente com `html5-qrcode` para ler QR de NFC-e/NF-e
- **Edge function `parse-fiscal-qr`**: Recebe URL/payload do QR, tenta extrair dados fiscais (CNPJ, valor, data, itens) via scraping do portal da SEFAZ ou parsing do payload
- **Integração com Transportes**: Aba "Despesas" dentro do card de transporte
- **Integração com Veículos**: Despesas de combustível/manutenção na ficha do veículo
- **Integração com Equipe**: Despesas pagas pelo colaborador + ressarcimentos na ficha

## FASE 3 — Relatórios e Automações (entrega futura)

- Relatório consolidado por evento/período (PDF/CSV)
- Detecção de duplicidade (mesmo QR, mesmo valor+data+emissor)
- Automações: sugerir veículo ao selecionar combustível, criar pendência de ressarcimento automática
- Offline: salvar rascunho local e sincronizar

---

## Arquivos da Fase 1

| Arquivo | Ação |
|---|---|
| `supabase/migrations/` | Nova migration com 5 tabelas + RLS + seed categorias + bucket |
| `src/hooks/useExpenses.ts` | Novo — hook CRUD completo |
| `src/hooks/useExpenseCategories.ts` | Novo — categorias |
| `src/pages/ExpensesPage.tsx` | Novo — página principal do módulo |
| `src/components/expenses/ExpenseForm.tsx` | Novo — formulário de criação/edição |
| `src/components/expenses/ExpenseCard.tsx` | Novo — card de despesa na listagem |
| `src/components/expenses/ReimbursementList.tsx` | Novo — tab de ressarcimentos |
| `src/pages/Dashboard.tsx` | Adicionar card de despesas |
| `src/components/Sidebar.tsx` | Adicionar link "Despesas" |
| `src/components/BottomTabs.tsx` | Adicionar nos moreLinks |
| `src/App.tsx` | Adicionar rota `/expenses` |

