
# Plano: Fase 3 (UX) + Fase 4 (Performance)

## Fase 3: UX

### 3.1 Refatorar formulário de transporte em Accordion
**Arquivo**: `src/pages/TransportsPage.tsx` → `renderFormFields()` (linha 665-900+)

**Problema**: Formulário monolítico com 200+ linhas, difícil de navegar em mobile

**Solução**: Dividir em seções colapsáveis usando `Accordion`:
- **Seção 1**: Dados básicos (título, origem, destino, data/hora)
- **Seção 2**: Informações do voo (condicional - só aparece se título = Aeroporto)
- **Seção 3**: Escolta policial (condicional)
- **Seção 4**: Hóspedes
- **Seção 5**: Motorista e Veículo
- **Seção 6**: Observações

### 3.2 Padronizar feedback de loading/success/error
**Arquivos afetados**: `TransportsPage.tsx`, `GuestsPage.tsx`, `VehiclesPage.tsx`, `TeamPage.tsx`

**Padrão a implementar**:
- Botões de ação: mostrar `<Loader2 className="animate-spin" />` quando `isPending`
- Sucesso: `toast.success()` com mensagem clara
- Erro: `toast.error(err.message || 'Erro ao processar')`

**Mudanças específicas**:
- `GuestsPage.tsx`: Adicionar loading state nos botões Salvar/Excluir
- `VehiclesPage.tsx`: Adicionar loading state nos botões de devolução
- `TeamPage.tsx`: Adicionar loading state no botão "Adicionar Membro"

### 3.3 Implementar debounce nos campos de busca
**Arquivos**: `TransportsPage.tsx`, `TeamPage.tsx`

**Problema atual**: TransportsPage já usa modelo "Enter para buscar" (correto per memory). TeamPage filtra em tempo real sem debounce.

**Solução**:
- `TeamPage.tsx`: Alterar para modelo consistente com TransportsPage (input + botão "Buscar" ou Enter)
- Manter padrão do sistema: busca só dispara com clique ou Enter

### 3.4 Melhorar empty states com CTAs
**Arquivos**: `GuestsPage.tsx`, `VehiclesPage.tsx`, `ElectricCartsPage.tsx`, `ScootersPage.tsx`

**Adicionar**:
- Ilustração/ícone grande
- Texto descritivo
- Botão CTA proeminente "Cadastrar primeiro"

---

## Fase 4: Performance

### 4.1 Code-split TransportsPage
**Criar novos componentes**:
- `src/components/transport/TransportForm.tsx` - Formulário de criação/edição (extração de ~250 linhas)
- `src/components/transport/TransportCard.tsx` - Card individual de transporte
- `src/components/transport/TransportFilters.tsx` - Barra de filtros
- `src/components/transport/TransportDetailDialog.tsx` - Modal de detalhes

**Benefícios**: Redução de re-renders, melhor manutenibilidade, lazy loading potencial

### 4.2 Otimizar queries do Dashboard
**Arquivo**: `src/pages/Dashboard.tsx` (linhas 296-311)

**Problema**: Loop O(n*m) para verificar shifts de cada membro

**Solução**: Pre-computar mapas com `useMemo`:
```typescript
const memberShiftMap = useMemo(() => {
  const map = new Map<string, { hasShiftToday: boolean; isInShiftNow: boolean }>();
  // Pre-compute once
  return map;
}, [assignments, shifts, todayStr]);
```

### 4.3 Migrar forms para react-hook-form
**Arquivos prioritários**:
- `TransportsPage.tsx` - 20+ campos com useState
- `TeamPage.tsx` - 5 forms diferentes
- `GuestsPage.tsx` - 2 forms

**Benefícios**:
- Elimina re-renders a cada keystroke
- Validação declarativa com zod
- Formulários controlados sem useState massivo

### 4.4 Remover `(supabase as any)` casting
**Problema**: Types desatualizados forçam casting, perdendo type-safety

**Ação**: Os types são gerados automaticamente pelo sistema. Já que não podemos editar `types.ts` diretamente, vamos:
1. Usar interfaces locais onde necessário
2. Criar tipos auxiliares em arquivo separado `src/types/entities.ts`

---

## Resumo de Arquivos

| Arquivo | Mudanças |
|---------|----------|
| `TransportsPage.tsx` | Accordion form, code-split em componentes |
| `src/components/transport/TransportForm.tsx` | **NOVO** - Form extraído |
| `src/components/transport/TransportCard.tsx` | **NOVO** - Card extraído |
| `src/components/transport/TransportFilters.tsx` | **NOVO** - Filtros extraídos |
| `Dashboard.tsx` | Pre-computar memberShiftMap |
| `TeamPage.tsx` | Mudar busca para modelo Enter/botão, loading states |
| `GuestsPage.tsx` | Loading states, empty state CTA |
| `VehiclesPage.tsx` | Loading states, empty state CTA |
| `ElectricCartsPage.tsx` | Empty state CTA |
| `ScootersPage.tsx` | Empty state CTA |
| `src/types/entities.ts` | **NOVO** - Types auxiliares |

---

## Ordem de Execução

1. **Fase 3.4** - Empty states (baixo risco, alto impacto visual)
2. **Fase 3.2** - Loading states (padronização rápida)
3. **Fase 3.3** - Debounce/busca consistente
4. **Fase 4.2** - Otimização Dashboard (quick win)
5. **Fase 4.1** - Code-split TransportsPage (maior esforço)
6. **Fase 3.1** - Accordion form (junto com code-split)
7. **Fase 4.3** - react-hook-form (refatoração gradual)
8. **Fase 4.4** - Types auxiliares (manutenção)
