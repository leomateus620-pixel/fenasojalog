

## Plano: Corrigir status de veículos com dados inconsistentes

### Problema
Existem 4 veículos no banco com registros de uso abertos (`vehicle_usage` sem `km_chegada`) mas com `status = 'disponivel'` na tabela `vehicles`. Isso ocorreu porque os registros foram criados antes da correção anterior que sincroniza o status.

### Solução: Duas abordagens combinadas

**A. Migração SQL — Sincronizar dados existentes**

Atualizar os veículos que têm `vehicle_usage` abertos (sem `km_chegada`) para `status = 'em_uso'`:

```sql
UPDATE vehicles v
SET status = 'em_uso'
WHERE EXISTS (
  SELECT 1 FROM vehicle_usage vu
  WHERE vu.vehicle_id = v.id AND vu.km_chegada IS NULL
)
AND v.status = 'disponivel';
```

**B. `src/pages/VehiclesPage.tsx` — Computar status real no frontend**

Para evitar futuras inconsistências, derivar o status exibido no card a partir dos dados reais: se o veículo tem um `vehicle_usage` aberto (sem `km_chegada`), o status exibido deve ser `'em_uso'` independentemente do valor no banco.

No componente principal, após carregar `usages` e `vehicles`, computar um `effectiveStatus` para cada veículo:

```ts
const effectiveStatus = useMemo(() => {
  const map: Record<string, string> = {};
  vehicles.forEach((v: any) => {
    const hasOpenUsage = usages.some((u: any) => u.vehicle_id === v.id && !u.km_chegada);
    map[v.id] = hasOpenUsage ? 'em_uso' : v.status;
  });
  return map;
}, [vehicles, usages]);
```

Usar `effectiveStatus[v.id]` ao invés de `v.status` nos cards e nos filtros.

### Resultado
- Dados existentes corrigidos pela migração
- Frontend resiliente: mesmo se o banco estiver desatualizado, o status exibido será correto

