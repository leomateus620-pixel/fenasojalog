

# Correção do Fuso Horário na Exibição de Transportes

## Problema

Duas funções usam abordagens diferentes para interpretar `inicio_em`:

1. `rawTime()` — extrai HH:MM diretamente da string ISO sem conversão → mostra horário UTC
2. `estimateReturnTime()` — usa `new Date()` que converte para fuso local → mostra horário BRT

Resultado: Saída mostra 20:30 (UTC) e Retorno mostra 18:30 (BRT+1h), quando deveria ser Saída 17:30 e Retorno 18:30.

## Causa Raiz

O `inicio_em` está sendo salvo como `2026-03-31T20:30:00+00:00` (UTC) quando deveria ser `2026-03-31T20:30:00-03:00` (ou `2026-03-31T23:30:00+00:00`). Isso significa que `ensureSPOffset` não está sendo aplicado corretamente ao salvar, OU o usuário digitou 20:30 querendo dizer 20:30 BRT mas foi salvo como 20:30 UTC.

## Correção

### 1. `src/lib/utils.ts` — Trocar `rawTime()` para converter para SP

Ao invés de extrair o horário bruto da string ISO, usar `toLocaleTimeString` com `timeZone: 'America/Sao_Paulo'`:

```typescript
export function rawTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}
```

### 2. `src/lib/utils.ts` — Trocar `rawDateShort()` para converter para SP

Mesma lógica, usar `Intl.DateTimeFormat` com timezone SP para extrair dia/mês corretos:

```typescript
export function rawDateShort(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
}
```

### 3. Verificar `ensureSPOffset` no save de transportes

Confirmar que `ensureSPOffset` está sendo aplicado em `inicio_em` e `fim_em` no `handleCreate` e `handleEdit` do `TransportsPage.tsx`. Se não estiver, adicionar.

### 4. Corrigir dados existentes no banco

Migração SQL para ajustar transportes cujo `inicio_em` foi salvo sem offset correto (se aplicável — verificar se o transporte recém-criado precisa de correção).

## Arquivos Alterados

| Arquivo | Ação |
|---|---|
| `src/lib/utils.ts` | Editar — `rawTime` e `rawDateShort` com conversão SP |
| `src/pages/TransportsPage.tsx` | Verificar/corrigir `ensureSPOffset` no save |
| SQL migration (se necessário) | Corrigir dados existentes |

