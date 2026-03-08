

## Problema

Todas as RLS policies da tabela `vehicles` estão como `RESTRICTIVE` (não permissivas). No PostgreSQL, policies restrictivas sozinhas **sempre negam acesso** — é necessário pelo menos uma policy PERMISSIVE para conceder acesso, e então as restrictivas podem limitá-lo.

Esse mesmo problema provavelmente afeta **todas as tabelas** do sistema, já que o padrão parece ser consistente.

## Solução

Recriar as policies de `vehicles` (e verificar/corrigir as demais tabelas) como **PERMISSIVE** em vez de RESTRICTIVE.

### Tabelas afetadas (todas com policies RESTRICTIVE):
- `vehicles`
- `fuel_records`
- `vehicle_usage`
- `transports`
- `electric_carts`
- `scooters`
- `tasks`
- `events`
- `guests`
- `schedules`
- `schedule_shifts`
- `shift_assignments`
- `organizations`
- `org_members`
- `commissions`
- `cart_history`
- `scooter_history`
- `audit_log`
- `profiles`
- `security_audit_reports`
- `transport_locations`
- `user_roles`

### Implementação

Uma migração SQL que:
1. Dropa todas as policies existentes (RESTRICTIVE) de cada tabela
2. Recria as mesmas policies como PERMISSIVE (que é o padrão do `CREATE POLICY`)

As regras de acesso permanecem idênticas — apenas o tipo muda de RESTRICTIVE para PERMISSIVE.

### Arquivos modificados
- Apenas uma migração SQL (sem mudanças no frontend — o código está correto)

