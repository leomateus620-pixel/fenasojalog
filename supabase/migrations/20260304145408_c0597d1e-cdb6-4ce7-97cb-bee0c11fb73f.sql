ALTER TABLE public.transports
  ADD COLUMN IF NOT EXISTS voo_cidade text,
  ADD COLUMN IF NOT EXISTS voo_numero text,
  ADD COLUMN IF NOT EXISTS voo_checkin text,
  ADD COLUMN IF NOT EXISTS voo_chegada text,
  ADD COLUMN IF NOT EXISTS horario_saida text;