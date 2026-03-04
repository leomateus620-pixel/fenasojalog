

# Tornar seção de Auditoria visível para Operadores

## Mudança

Atualmente a seção "Auditoria de Segurança" só aparece quando `myRole === 'admin'`. O usuário quer que operadores também vejam essa seção.

## Implementação

No `src/pages/SettingsPage.tsx`:

1. Alterar a variável de controle de visibilidade de `isAdmin` para uma nova variável `canSeeAudit` que inclua ambos os papéis:
   ```typescript
   const canSeeAudit = myRole === 'admin' || myRole === 'operador';
   ```

2. Substituir a condição `{isAdmin && (` que envolve o bloco de auditoria por `{canSeeAudit && (`.

3. Manter `isAdmin` para outras funcionalidades que devem permanecer restritas a admins.

**Nota**: A Edge Function no backend já valida permissões separadamente. Se a política de execução da edge function também precisa aceitar operadores, será necessário ajustar a validação de role no `security-audit-selfcheck/index.ts` (verificar se aceita apenas admin ou também operador).

## Arquivos alterados
- `src/pages/SettingsPage.tsx` (1 linha nova + 1 condição alterada)
- Possivelmente `supabase/functions/security-audit-selfcheck/index.ts` (se a validação de role bloquear operadores)

