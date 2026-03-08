
ALTER TABLE public.transports
  ADD COLUMN IF NOT EXISTS distancia_estimada_km numeric,
  ADD COLUMN IF NOT EXISTS duracao_estimada_min integer,
  ADD COLUMN IF NOT EXISTS inicio_real_em timestamptz,
  ADD COLUMN IF NOT EXISTS fim_real_em timestamptz,
  ADD COLUMN IF NOT EXISTS rota_polyline text;
