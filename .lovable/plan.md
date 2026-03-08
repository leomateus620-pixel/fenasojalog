

## Plano: Corrigir erro de timestamp na devolução e melhorar o card de detalhe

### Bug identificado

A função `nowSP()` em `src/lib/utils.ts` faz:
```ts
return new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T') + ':00';
```

O `toLocaleString('sv-SE')` já retorna segundos (ex: `2026-03-08 06:43:40`), e o `+ ':00'` adiciona um segmento extra, gerando `2026-03-08T06:43:40:00` — **timestamp inválido** para PostgreSQL. Esse é o erro exibido na tela: `"invalid input syntax for type timestamp with time zone"`.

### Correções

**A. `src/lib/utils.ts` — Corrigir `nowSP()`**

Remover o `+ ':00'` e em vez disso anexar o offset de timezone `-03:00` para que o PostgreSQL interprete corretamente:

```ts
export function nowSP(): string {
  const raw = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  return raw.replace(' ', 'T') + '-03:00';
}
```

Isso gera `2026-03-08T06:43:40-03:00` — formato ISO 8601 válido com timezone.

**B. `src/pages/VehiclesPage.tsx` — Melhorar o card de detalhe do veículo**

Refinamentos visuais no `VehicleDetailContent`:

1. **Métricas superiores**: melhorar com ícones, cores mais distintas e layout mais premium
2. **Seção de devolução**: visual mais claro com ícone de status, cores de alerta mais refinadas, botão verde para devolução
3. **Seção de retirada**: layout mais organizado com ícones nos inputs
4. **Cards de histórico de uso**: melhor hierarquia visual, badges mais elegantes, melhor separação de informações
5. **Tabs**: visual mais premium com contador em badge
6. **Título do dialog**: incluir badge de status do veículo no cabeçalho

### Arquivos alterados
- `src/lib/utils.ts` (1 linha)
- `src/pages/VehiclesPage.tsx` (seção VehicleDetailContent + DialogHeader)

