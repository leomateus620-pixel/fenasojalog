

## Plano: Reformulação Completa do Módulo Veículos Botolli

---

### Auditoria do Estado Atual

O módulo já possui arquitetura funcional sólida:

| Componente | Estado | Observação |
|---|---|---|
| Tabela `vehicles` | Funcional | Campos corretos, RLS OK |
| Tabela `vehicle_usage` | Funcional | km_saida, km_chegada, km_rodados (gerado), devolucao_em |
| Tabela `fuel_records` | Funcional | litros, valor, km, posto, cupom fiscal |
| Hook `useVehicles` | Correto | CRUD real com audit log |
| Hook `useVehicleUsage` | Correto | KM derivado de transports reais |
| Hook `useFuelRecords` | Correto | CRUD + upload de cupom |
| Fluxo retirada/devolução | Funcional | Atualiza odômetro ao devolver |
| Custo estimado | Funcional | R$0,65/km × totalKm de transports |

**Não há dados mockados.** Tudo já persiste no banco. A estrutura de dados está completa.

**O que falta:**
1. Visual Liquid Glass (a página usa estilo genérico/básico)
2. Cards de resumo mais completos (faltam contadores de status)
3. Custo real de combustível (fuel_records existe mas não aparece nos cards de resumo)
4. Exportação PDF
5. Loading/empty states premium

---

### Plano de Implementação

#### 1. Reestilização Liquid Glass (`src/pages/VehiclesPage.tsx`)

Reescrever a página inteira com:
- Header premium com saudação e botão translúcido
- 5 cards de resumo em grid responsivo (2 colunas mobile, 5 desktop):
  - Total KM rodados (de transports)
  - Custo estimado (KM × R$0,65)
  - Custo real (soma fuel_records.valor)
  - Veículos disponíveis (count status=disponivel)
  - Veículos em uso (count status=em_uso)
- Cards de veículos com estilo `liquid-glass-card`: `bg-white/10 backdrop-blur-xl border-white/15`
- Badges de status com cores translúcidas
- Modais com estilo glass
- Loading skeletons premium
- Empty states elegantes

#### 2. Cards de veículos aprimorados

Cada card exibirá:
- Marca/modelo/cor + placa
- Badge de status (glass style)
- Odômetro atual
- KM acumulado (de transports)
- Custo estimado acumulado (KM × 0.65)
- Custo real acumulado (soma fuel_records daquele veículo)
- Botões: Editar, Histórico, PDF
- Responsável atual (se houver)

#### 3. Custos reais nos resumos

Buscar `fuel_records` globalmente (sem filtro de veículo) para somar o `valor` total como "Custo Real". Já existe `useFuelRecords` — usar sem `vehicleId` para obter todos.

#### 4. Exportação PDF

Implementar geração de PDF client-side usando uma abordagem simples sem dependência extra: criar um iframe oculto com HTML formatado e chamar `window.print()`. Alternativa: gerar HTML bem formatado e abrir em nova aba para impressão.

Dois tipos:
- **PDF por veículo**: resumo + lista de usos + abastecimentos
- **PDF geral da frota**: todos os veículos + totais

O PDF terá layout com identidade visual Fenasoja (cores, logo).

#### 5. Modal de detalhes aprimorado

Melhorar o `VehicleDetailContent` com:
- Tabs ou seções visuais (Utilização | Abastecimentos)
- Visual glass nos cards de histórico
- Botão de gerar PDF dentro do detalhe

#### 6. Loading & Empty States

- Skeleton glass para cards de resumo e lista
- Empty state com ícone + mensagem sutil
- Estados de loading nos botões

---

### Arquivos a Modificar

1. **`src/pages/VehiclesPage.tsx`** — Reescrita completa: visual Liquid Glass, cards de resumo expandidos, custo real, PDF, loading states
2. **`src/index.css`** — Adicionar classe `.liquid-glass-vehicle-card` se necessário (ou reutilizar `.liquid-glass-card` existente)

### Sem alterações no banco
Todas as tabelas e hooks já existem e funcionam corretamente. Não há necessidade de migrações.

### Sem novos hooks necessários
`useFuelRecords` sem `vehicleId` já retorna todos os registros da org para calcular custo real global.

