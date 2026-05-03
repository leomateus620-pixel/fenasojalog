## Correção do transporte 03/05 (Parque → Santa Rosa → Parque)

Aplicar via migration de dados (UPDATE direto requer permissão elevada — psql comum bloqueou).

### Operações SQL

```sql
BEGIN;

-- 1) Reescrever os 2 vehicle_usage do transporte para a AMAROK
UPDATE vehicle_usage SET
  vehicle_id = '2241a476-b89e-48b4-9caa-4b083bb14d46',
  km_saida = 5953, km_chegada = 5975,
  observacoes = 'Ida automática — transporte f94d0f44-20f1-403a-8494-57a3605f79e7 (corrigido: T-CROSS → AMAROK)'
WHERE id = 'dc51a25e-1107-4c18-a760-3805b725c2bd';

UPDATE vehicle_usage SET
  vehicle_id = '2241a476-b89e-48b4-9caa-4b083bb14d46',
  km_saida = 5975, km_chegada = 5997,
  observacoes = 'Volta automática — transporte f94d0f44-20f1-403a-8494-57a3605f79e7 (corrigido: T-CROSS → AMAROK)'
WHERE id = 'af8ac518-ba3b-4ed3-a0b8-e77a3df151c1';

-- 2) Trocar veículo no transporte
UPDATE transports SET vehicle_id = '2241a476-b89e-48b4-9caa-4b083bb14d46', updated_at = now()
WHERE id = 'f94d0f44-20f1-403a-8494-57a3605f79e7';

-- 3) Ajustar km_atual dos veículos
UPDATE vehicles SET km_atual = 87704, updated_at = now()
WHERE id = 'f8a51a52-1204-4f8e-ac10-97c572c79448'; -- T-CROSS volta ao km original

UPDATE vehicles SET km_atual = 5997, updated_at = now()
WHERE id = '2241a476-b89e-48b4-9caa-4b083bb14d46'; -- AMAROK +44 km

COMMIT;
```

### Resultado esperado
- Transporte `f94d0f44...` passa a ser executado com **AMAROK (JDF6D47)**
- AMAROK: 5953 → **5997 km** (+44 km da viagem ida e volta)
- T-CROSS: 87748 → **87704 km** (reverte os 44 km lançados indevidamente)
- `km_rodados` recalculado automaticamente pela coluna GENERATED