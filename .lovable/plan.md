

# Suporte a múltiplos hóspedes no diálogo de WhatsApp ao iniciar viagem

## Problema

Quando um transporte tem múltiplos hóspedes (ex: MARIANGELA e VERÔNICA), o backend (`transport-lifecycle` edge function) seleciona apenas o primeiro hóspede com telefone válido e retorna um único objeto `whatsapp`. O diálogo só mostra opção de envio para esse hóspede.

## Solução

Retornar um array `whatsappGuests` com mensagem e link individualizados para cada hóspede. O diálogo exibirá uma seção por hóspede com nome, mensagem personalizada e botões Copiar/Enviar.

## Alterações

### 1. `supabase/functions/transport-lifecycle/index.ts`

- Em vez de buscar apenas o primeiro hóspede com telefone, iterar sobre **todos** os hóspedes vinculados
- Para cada hóspede, gerar mensagem personalizada com o nome dele e montar o link WhatsApp
- Retornar `whatsappGuests: Array<{ phone, message, url, guestName, phoneValid }>` junto com `driverName` e `startedAt`
- Manter o campo `whatsapp` legado apontando para o primeiro hóspede (compatibilidade)

### 2. `src/components/transport/StartTripDialog.tsx`

- Aceitar nova prop `whatsappGuests` (array) além do `whatsappData` existente
- Se `whatsappGuests` tiver mais de 1 item, renderizar uma lista com seção para cada hóspede:
  - Nome do hóspede como subtítulo
  - Preview da mensagem
  - Botões Copiar + Enviar WhatsApp individuais
  - Aviso de telefone inválido individual
- Se houver apenas 1 hóspede, manter o layout atual sem alteração visual

### 3. `src/pages/TransportsPage.tsx`

- Extrair `whatsappGuests` do resultado do `start.mutateAsync` e passar ao `StartTripDialog`

| Arquivo | Ação |
|---|---|
| `supabase/functions/transport-lifecycle/index.ts` | Gerar array de mensagens para todos os hóspedes |
| `src/components/transport/StartTripDialog.tsx` | Renderizar lista de hóspedes com botões individuais |
| `src/pages/TransportsPage.tsx` | Passar array de hóspedes ao diálogo |

