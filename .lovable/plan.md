

# Plano: Filtro de motoristas por comissão + Redesign premium dos dialogs

## Tarefa 1: Motoristas apenas da comissão de Logística para Aeroporto

### Problema atual
O `TransportForm` exibe TODOS os membros na lista de motoristas, independente do tipo de transporte. Para transportes ao Aeroporto, apenas membros da comissão "LOGÍSTICA, HOTELARIA E TURISMO" devem aparecer.

### Mudanças
**Arquivo:** `src/components/transport/TransportForm.tsx`

- Na seção "Motorista e Veículo" (linha 358-363), adicionar filtro condicional:
  - Se `data.titulo === 'Aeroporto'`: filtrar `members` para exibir apenas os que possuem `commission_nome` contendo "LOGÍSTICA" (case-insensitive)
  - Caso contrário: exibir todos os membros normalmente
- Adicionar nota visual quando o filtro está ativo: "Motoristas da comissão de Logística" em texto pequeno

---

## Tarefa 2: Redesign premium Liquid Glass dos dialogs

### Objetivo
Atualizar o componente base `DialogContent` e as instâncias dos dialogs para visual premium com textura, profundidade e bom contraste. Mobile-first.

### Mudanças no componente base
**Arquivo:** `src/components/ui/dialog.tsx`

- Atualizar `DialogContent` classes:
  - Trocar `bg-background` por `bg-card/95 backdrop-blur-2xl border-border/40`
  - Adicionar `rounded-2xl` e `shadow-2xl`
  - Mobile: `max-h-[95dvh]` para melhor uso de tela
  - Adicionar sombra interna sutil via `shadow-[...]`
- Atualizar `DialogOverlay`:
  - Trocar `bg-black/80` por `bg-black/60 backdrop-blur-sm` para efeito glass
- Atualizar `DialogHeader`:
  - Padding inferior e separador visual
- Botão de fechar: estilizar com `rounded-full bg-muted/50 hover:bg-muted` para visual premium

### Dialogs específicos a atualizar (ajustes de className inline)

1. **Novo Transporte** (`TransportsPage.tsx` linha 720)
   - Adicionar classe `sm:max-w-md` e descrição mais clara

2. **Editar/Finalizar Transporte** (`TransportsPage.tsx` linha 809)
   - Manter `max-h-[90vh]`, adicionar glass styling

3. **Cadastrar Hóspede** (`GuestsPage.tsx` linha 109)
   - Adicionar `sm:max-w-md`, descrição contextual "Preencha os dados do convidado"

4. **Editar Hóspede** (`GuestsPage.tsx` linha 118)
   - Mesma atualização

5. **Adicionar Veículo** (`VehiclesPage.tsx` linha 349)
   - Já tem `liquid-glass-card`, manter consistente

6. **Editar Veículo** (`VehiclesPage.tsx` linha 373)
   - Mesma atualização

7. **Criar/Editar Evento** (`AgendaPage.tsx` linha 453)
   - Já tem `bg-card/95 backdrop-blur-xl`, alinhar com novo padrão base

8. **WhatsApp Dialog** (`TransportsPage.tsx` linha 849)
   - Adicionar glass styling

### Botões de ação nos dialogs
- Todos os botões primários de submit: `h-11 rounded-xl font-semibold shadow-sm bg-primary hover:bg-primary/90 active:scale-[0.97] transition-all`
- Consistência visual em todos os dialogs

### Inputs nos dialogs
- Todos inputs dentro de dialogs: `bg-background/60 border-border/50 focus:border-primary/50` para efeito glass com bom contraste
- Height padronizado: `h-11` para touch targets adequados

---

## Resumo de arquivos a editar

1. `src/components/ui/dialog.tsx` — redesign base do componente
2. `src/components/transport/TransportForm.tsx` — filtro de motoristas para Aeroporto
3. `src/pages/TransportsPage.tsx` — classes dos dialogs
4. `src/pages/GuestsPage.tsx` — classes dos dialogs + descrições
5. `src/pages/VehiclesPage.tsx` — alinhamento visual
6. `src/pages/AgendaPage.tsx` — alinhamento visual

## Segurança
- Nenhuma lógica de negócio é alterada
- Filtro de motoristas é apenas visual (a validação de permissão já existe no backend)
- Todos os fluxos existentes preservados

