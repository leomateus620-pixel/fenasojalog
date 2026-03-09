

# Auditoria Técnica Completa — Sistema Fenasoja Logística

---

## A. DIAGNÓSTICO TÉCNICO

### 1. PROBLEMAS CRÍTICOS (Correção Imediata)

#### 1.1 Timezone Inconsistency em `nowSP()`
- **Componente**: `src/lib/utils.ts` → `nowSP()`
- **Problema**: A função hardcoda `-03:00`, mas o Brasil alterna entre horário de verão (−02:00) e padrão (−03:00). Isso pode causar timestamps incorretos durante o DST.
- **Impacto**: Transportes agendados podem aparecer 1 hora antes/depois do correto.
- **Criticidade**: Alta
- **Solução**: Usar `Intl.DateTimeFormat` com `timeZone: 'America/Sao_Paulo'` que calcula automaticamente o offset correto.
- **Validação**: Testar em datas durante e fora do horário de verão.

#### 1.2 RLS Policy Bypass Risk em `transport_locations`
- **Componente**: Tabela `transport_locations`, policy `location_insert`
- **Problema**: A policy permite INSERT apenas verificando `is_org_member`, mas qualquer membro da org pode inserir localização para qualquer transporte, mesmo não sendo o motorista designado.
- **Impacto**: Potencial spoofing de localização de motoristas.
- **Criticidade**: Média-Alta
- **Solução**: Adicionar verificação `driver_user_id = auth.uid()` na policy INSERT.
- **Validação**: Tentar inserir localização com user diferente do motorista designado.

#### 1.3 Race Condition em `setGuestsForTransport`
- **Componente**: `src/hooks/useTransportGuests.ts`
- **Problema**: O padrão delete-then-insert não é atômico. Se a inserção falhar após o delete, os guests são perdidos sem rollback.
- **Impacto**: Perda de vínculos guest-transport em caso de erro de rede.
- **Criticidade**: Alta
- **Solução**: Usar transação ou RPC database function para operação atômica.
- **Validação**: Simular erro de rede entre delete e insert.

#### 1.4 Ausência de Validação de Input no Backend
- **Componente**: Todas as mutations (create/update) em hooks
- **Problema**: Validações são apenas client-side. Dados maliciosos podem ser enviados via DevTools.
- **Impacto**: Injeção de dados inválidos, XSS potencial em campos de texto.
- **Criticidade**: Alta
- **Solução**: Implementar triggers/functions PostgreSQL para validação ou usar schema validation em edge functions.

---

### 2. PROBLEMAS DE CONSISTÊNCIA DE DADOS

#### 2.1 Duplicidade de Referência `guest_id`
- **Componente**: Tabela `transports` (coluna `guest_id`) + Tabela `transport_guests`
- **Problema**: O sistema mantém dois mecanismos para vincular guests: campo legacy `guest_id` e junction table `transport_guests`. O código tenta reconciliar ambos em múltiplos lugares.
- **Impacto**: Inconsistência em queries e lógica espalhada.
- **Criticidade**: Média
- **Solução**: Migrar todos os dados de `guest_id` para `transport_guests`, depois remover a coluna legacy.

#### 2.2 Eventos "Órfãos" de Transportes
- **Componente**: `useTransports.ts` → `createEventAndShift()`
- **Problema**: Ao criar transporte, events são criados automaticamente, mas ao deletar/cancelar transporte, o evento não é removido.
- **Impacto**: Agenda mostra transportes que não existem mais.
- **Criticidade**: Média-Alta
- **Solução**: Implementar soft-sync: ao mudar status de transporte para cancelado/concluido, marcar evento correspondente.

#### 2.3 Timestamps sem Timezone em Inputs Nativos
- **Componente**: `TransportsPage.tsx` → inputs `datetime-local`
- **Problema**: Inputs HTML `datetime-local` não incluem timezone. A função `ensureSPTimestamptz()` adiciona `-03:00` fixo, que pode estar errado.
- **Impacto**: Horários incorretos durante DST.
- **Criticidade**: Média

---

### 3. PROBLEMAS DE UX/UI

#### 3.1 Formulário de Transporte Excesso de Campos
- **Componente**: `TransportsPage.tsx` → `renderFormFields()`
- **Problema**: Formulário com 1667 linhas, muitos campos condicionais, difícil de navegar em mobile.
- **Impacto**: Usuários abandonam cadastro ou erram campos.
- **Criticidade**: Média
- **Solução**: Wizard multi-step ou accordion com seções colapsáveis.

#### 3.2 Feedback de Loading Inconsistente
- **Componente**: Várias páginas
- **Problema**: Algumas actions usam `toast.success` após conclusão, outras não. Mutations lentas não mostram spinner.
- **Impacto**: Usuário clica múltiplas vezes ou não sabe se ação funcionou.
- **Solução**: Padronizar: botão com `isPending` → spinner; conclusão → toast; erro → toast.error com mensagem clara.

#### 3.3 Estados Vazios sem Call-to-Action Claro
- **Componente**: `GuestsPage.tsx`, `VehiclesPage.tsx`
- **Problema**: Lista vazia mostra apenas "Nenhum cadastrado", sem botão de ação proeminente.
- **Impacto**: First-time users não sabem o que fazer.
- **Solução**: Empty state com ilustração + botão "Criar primeiro".

#### 3.4 Delete sem Confirmação
- **Componente**: `GuestsPage.tsx` linha 142
- **Problema**: `remove.mutateAsync(g.id)` é chamado diretamente no onClick sem confirmação.
- **Impacto**: Exclusões acidentais, perda de dados.
- **Criticidade**: Alta
- **Solução**: Usar `AlertDialog` para confirmar todas as exclusões.

---

### 4. PROBLEMAS DE PERFORMANCE

#### 4.1 N+1 Queries em Dashboard
- **Componente**: `Dashboard.tsx` → seção "Equipe Logística"
- **Problema**: Para cada membro, verifica `assignments.some()` e `shifts.find()` em loop, O(n*m) complexity.
- **Impacto**: Dashboard lento com muitos membros/turnos.
- **Solução**: Pre-computar Sets de `member_user_id → shifts` fora do render.

#### 4.2 Re-renders Excessivos em TransportsPage
- **Componente**: `TransportsPage.tsx`
- **Problema**: Múltiplos `useState` para form fields causam re-render a cada keystroke. Arquivo com 1667 linhas = bundle pesado.
- **Impacto**: Input lag em mobile, especialmente em formulários grandes.
- **Solução**: Usar `react-hook-form` para forms; code-split componentes internos.

#### 4.3 Sem Debounce em Filtros de Busca
- **Componente**: `TransportsPage.tsx` → `filterSearch`, `TeamPage.tsx` → `searchQuery`
- **Problema**: Filtro aplica a cada keystroke sem debounce.
- **Impacto**: Lags visuais durante digitação rápida.
- **Solução**: Implementar `useDeferredValue` ou `debounce` de 300ms.

---

### 5. PROBLEMAS DE ARQUITETURA

#### 5.1 Type Casting Excessivo com `(supabase as any)`
- **Componente**: Todos os hooks
- **Problema**: O código usa `(supabase as any)` em todas as queries, perdendo type-safety e autocomplete.
- **Causa**: Types gerados não correspondem ao schema atual.
- **Impacto**: Erros de runtime não detectados em compile-time.
- **Solução**: Regenerar types após cada migration; usar tipagem explícita.

#### 5.2 LocalStorage para Org Selection
- **Componente**: `useCurrentOrg.ts`
- **Problema**: `ORG_KEY` em localStorage pode ficar stale se usuário for removido de org.
- **Impacto**: Usuário vê tela de "criar org" mesmo pertencendo a outra.
- **Solução**: Validar localStorage contra memberships a cada carregamento.

#### 5.3 Lógica de Negócio no Frontend
- **Componente**: `TransportsPage.tsx` → `calcSuggestedDeparture()`, buffers de aeroporto
- **Problema**: Regras de negócio complexas (buffers por cidade) estão hardcoded no frontend.
- **Impacto**: Difícil manutenção; inconsistência se houver outro cliente.
- **Solução**: Mover para edge function ou tabela de configuração no banco.

---

### 6. PROBLEMAS DE SEGURANÇA

#### 6.1 Email Placeholder Expõe Padrão
- **Componente**: `TeamPage.tsx` linha 87
- **Problema**: Membros sem acesso recebem email `placeholder-{timestamp}@noaccess.local`, padrão previsível.
- **Impacto**: Possível enumeração de usuários.
- **Solução**: Usar UUID aleatório completo: `no-access-{uuid}@internal.fenasoja.local`

#### 6.2 Console.error Expõe Stack Traces
- **Componente**: `useLocationTracking.ts` linha 60
- **Problema**: `console.error('Failed to update location:', err)` pode expor info sensível.
- **Solução**: Usar logging estruturado sem expor objeto de erro completo em produção.

---

### 7. CENÁRIOS DE TESTE E COMPORTAMENTOS

| Cenário | Esperado | Atual | Risco | Correção |
|---------|----------|-------|-------|----------|
| Criar transporte sem destino | Erro claro | Toast "Preencha: Destino" | ✅ OK | - |
| Criar transporte, app fecha mid-save | Rollback ou draft | Dados parciais perdidos | Médio | Implementar optimistic update com retry |
| Deletar guest com transporte vinculado | Aviso ou bloqueio | Deleta silenciosamente | Alto | Trigger ou FK constraint |
| Refresh durante viagem em andamento | Manter tracking | Tracking para | Alto | Persistir `trackingTransportId` em localStorage |
| Dois usuários editam mesmo transporte | Conflito detectado | Último salva sobrescreve | Médio | Implementar optimistic locking com `updated_at` |
| Mobile offline | Banner + queue local | Apenas banner | Médio | Implementar service worker com sync queue |

---

## B. PLANO DE CORREÇÃO PRIORIZADO

### Fase 1: Crítico Imediato (1-2 dias)
1. Adicionar confirmação de delete em todas as exclusões
2. Corrigir RLS de `transport_locations` para verificar `driver_user_id`
3. Tornar `setGuestsForTransport` atômico via RPC
4. Adicionar validação server-side básica (não-nulo, tamanhos)

### Fase 2: Estabilidade (3-5 dias)
5. Migrar dados de `guest_id` para `transport_guests` e deprecar coluna
6. Sincronizar exclusão/cancelamento de transporte com agenda
7. Corrigir cálculo de timezone para respeitar DST
8. Persistir `trackingTransportId` para manter tracking após refresh

### Fase 3: UX (1 semana)
9. Refatorar formulário de transporte em wizard ou accordion
10. Padronizar feedback de loading/success/error
11. Implementar debounce em todos os campos de busca
12. Melhorar empty states com CTAs claros

### Fase 4: Performance (1 semana)
13. Code-split TransportsPage (extrair forms em componentes)
14. Otimizar queries do Dashboard com pre-computação
15. Migrar forms para react-hook-form
16. Regenerar types do Supabase e remover `as any`

### Fase 5: Arquitetura (2 semanas)
17. Mover regras de negócio para edge functions/DB
18. Implementar optimistic locking para edições concorrentes
19. Adicionar service worker para offline-first básico
20. Criar triggers de validação no PostgreSQL

---

## C. CHECKLIST DE VALIDAÇÃO PÓS-CORREÇÃO

```text
[ ] 1. Deletar guest/transporte requer confirmação visual
[ ] 2. Tentar inserir localização com outro user → bloqueado
[ ] 3. Simular erro de rede em guest-transport → não perde dados
[ ] 4. Enviar payload inválido via DevTools → rejeitado pelo servidor
[ ] 5. Deletar transporte → evento some da agenda
[ ] 6. Agendar transporte em data DST → horário correto
[ ] 7. Refresh durante viagem → tracking continua
[ ] 8. Dois usuários editam → conflito detectado
[ ] 9. Mobile offline → banner + tentativas de sync visíveis
[ ] 10. Dashboard com 50+ membros → carrega em <2s
[ ] 11. Digitar rápido no filtro → sem travamento
[ ] 12. Criar transporte em mobile → wizard navegável
[ ] 13. Campo obrigatório vazio → indicação visual clara
[ ] 14. Autocomplete de tipos funciona no TS IDE
```

---

## Resumo Executivo

O sistema possui **arquitetura sólida** baseada em multi-tenancy com RLS e separação clara de responsabilidades via hooks. Os principais riscos estão em:

1. **Consistência de dados**: race conditions e campos duplicados
2. **UX em formulários complexos**: especialmente TransportsPage
3. **Performance em listas grandes**: sem otimização de queries
4. **Timezone hardcoded**: problemas durante horário de verão

A priorização proposta visa primeiro **proteger dados** (Fase 1), depois **estabilizar fluxos** (Fase 2), e só então **melhorar experiência** (Fases 3-5).

