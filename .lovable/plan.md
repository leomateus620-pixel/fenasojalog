

# Fix: KM & Emissões — Timezone and Console Errors

## Issues Found

### 1. Timezone Bug in Date Extraction (Critical)
`getDateStr()` in `kmConsolidation.ts` uses `iso.slice(0, 10)` which extracts the **UTC** date. A transport scheduled for `2026-04-29 01:00:00+00` is actually `2026-04-28 22:00 BRT` and should appear on April 28, not April 29. This affects:
- Which period a transport falls into
- Daily grouping
- Whether a transport is included at all (edge case: transport on `2026-04-29 02:00 UTC` = `2026-04-28 23:00 BRT` → outside fair period but currently counted)

### 2. Console Warning: BigStat ref
The `BigStat` function component receives a ref from parent rendering, causing React warnings. Non-breaking but noisy.

## Plan

### 1. Fix `getDateStr` in `kmConsolidation.ts`
Convert ISO timestamp to São Paulo timezone before extracting the date string, consistent with how `rawDateShort` works in `utils.ts`.

```typescript
function getDateStr(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // returns YYYY-MM-DD
}
```

### 2. Fix BigStat ref warning in `KmEmissoesPage.tsx`
Wrap `BigStat` with `React.forwardRef` to suppress the warning.

## Files Changed

| File | Action |
|---|---|
| `src/lib/kmConsolidation.ts` | Fix `getDateStr` timezone |
| `src/pages/KmEmissoesPage.tsx` | Fix `BigStat` forwardRef |

