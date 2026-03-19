

# Plano: Fluxo "Iniciar Viagem" com WhatsApp para Hóspede

## Resumo

Ao clicar em "Iniciar Viagem", o sistema valida dados obrigatórios (motorista, hóspede, telefone), altera o status para `em_andamento` via edge function, e exibe um dialog com mensagem dinâmica pronta para envio via WhatsApp ao hóspede.

---

## Mudanças

### 1. Edge Function `transport-lifecycle` — nova action `start`
**Arquivo:** `supabase/functions/transport-lifecycle/index.ts`

- Adicionar action `start` ao `ACTION_MIN_ROLES` (mesmas permissões de `update`)
- Handler `handleStart(admin, userId, payload)`:
  - Buscar transporte pelo `id`
  - Validar: status deve ser `pendente` (bloquear `em_andamento`, `concluido`, `cancelado`)
  - Validar: `motorista_user_id` deve existir
  - Buscar hóspedes via `transport_guests` → buscar dados do guest (nome, telefone)
  - Validar: pelo menos 1 hóspede com telefone válido
  - Atualizar transporte: `status = 'em_andamento'`, `inicio_real_em = now()`
  - Audit log com action `status_change`, `before_data` e `after_data`
  - Buscar nome do motorista via `org_members`
  - Montar mensagem WhatsApp dinâmica baseada no destino
  - Normalizar telefone (remover caracteres, adicionar DDI 55 se necessário)
  - Retornar: `{ data: transport, whatsapp: { phone, message, url } }`

### 2. Hook `useTransports` — novo método `start`
**Arquivo:** `src/hooks/useTransports.ts`

- Adicionar mutation `start` que chama `invokeLifecycle('start', { id, orgId })`
- `onSuccess`: invalidar queries
- `onError`: tratar 409 (concorrência) e validações

### 3. Helpers de WhatsApp — novo arquivo
**Arquivo:** `src/lib/whatsapp.ts`

- `normalizePhone(phone: string): string` — remove caracteres, adiciona DDI 55
- `isValidPhone(phone: string): boolean` — valida comprimento
- `buildWhatsAppUrl(phone: string, message: string): string` — monta URL `wa.me`

### 4. Dialog de confirmação "Viagem Iniciada"
**Arquivo:** `src/components/transport/StartTripDialog.tsx`

- Recebe: `open`, `onOpenChange`, `whatsappData` (phone, message, url, guestName, driverName)
- Exibe:
  - Badge "Viagem Iniciada" com horário
  - Mensagem formatada em card
  - Botão "Copiar Mensagem"
  - Botão "Enviar no WhatsApp" (verde, ícone WhatsApp) → `window.open(url, '_blank')`
  - Se telefone inválido: botão desabilitado + tooltip de aviso

### 5. `TransportsPage` — integrar novo fluxo no `cycleStatus`
**Arquivo:** `src/pages/TransportsPage.tsx`

- Quando `pendente → em_andamento`:
  - Chamar `start.mutateAsync({ id, orgId })` em vez de `update.mutateAsync`
  - Receber `whatsappData` da resposta
  - Se sucesso: abrir `StartTripDialog` com dados do WhatsApp
  - Toast "Viagem iniciada com sucesso"
  - Ativar tracking de localização (comportamento existente mantido)
- Adicionar estados: `startTripDialogOpen`, `startTripWhatsappData`

### 6. `TransportCard` e `TransportDynamicIsland` — botão WhatsApp pós-início
**Arquivos:** `src/components/transport/TransportCard.tsx`, `src/components/TransportDynamicIsland.tsx`

- Quando status é `em_andamento` e há hóspede com telefone:
  - Mostrar botão secundário com ícone WhatsApp "Falar com hóspede"
  - Ao clicar, montar URL via helpers e abrir em nova aba

---

## Validações e segurança

- Transições de status validadas no backend: só `pendente → em_andamento` é permitida na action `start`
- Botão desabilitado durante request (prevenção de duplo-clique)
- Optimistic locking mantido (usa `expectedUpdatedAt`)
- Audit log registra: ação, status anterior/novo, userId, timestamp

## Sem alterações em

- Tabelas do banco (telefone do hóspede já existe em `guests.telefone`)
- Fluxo de finalização (permanece via edit dialog)
- Visual desktop/mobile existente (apenas adições)

