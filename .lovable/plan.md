
## Diagnóstico confirmado (causa real)
- A exclusão está falhando por **permissão**, não por FK.
- No request ao backend, a ação `delete` retorna **403** com: `{"error":"Sem permissão para esta operação"}`.
- O usuário logado está com papel **`operador`** na organização (`org_members.role = operador`), e hoje o backend aceita `delete` só para `admin` e `gestor`.

## Correção proposta

### 1) Ajustar RBAC de exclusão no backend
**Arquivo:** `supabase/functions/transport-lifecycle/index.ts`
- Em `ACTION_MIN_ROLES`, alterar:
  - `delete: ["admin", "gestor"]`
  - para `delete: ["admin", "gestor", "operador"]`
- Manter `leitura` bloqueado.

### 2) Melhorar mensagem de erro no frontend
**Arquivo:** `src/hooks/useTransports.ts`
- No `invokeLifecycle`, tratar erro HTTP de função e extrair o JSON de resposta (`error.context.json()`), para mostrar a mensagem real do backend em vez de “Edge Function returned a non-2xx status code”.
- No `remove.onError`, manter toast, mas com mensagem já parseada.
- No `remove.onSuccess`, adicionar toast de sucesso (“Transporte excluído com sucesso”).

## Teste ao vivo (obrigatório)
1. No menu Transportes, excluir exatamente o transporte do print (`id: 537ee82b-096c-4e9d-98dd-221ffb1bb023`).
2. Validar no Network:
   - `POST /functions/v1/transport-lifecycle` com `action=delete` deve retornar **200**.
3. Validar na UI:
   - card removido da lista sem erro genérico.
   - toast de sucesso exibido.
4. Validar dados:
   - sem registro em `transports` para esse `id`.
   - sem resíduos em `transport_guests` e `transport_locations` para esse `transport_id`.

## Arquivos a alterar
1. `supabase/functions/transport-lifecycle/index.ts`
2. `src/hooks/useTransports.ts`
