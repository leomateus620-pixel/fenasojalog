-- 1. Add columns to scooters for parity with electric_carts
ALTER TABLE public.scooters
  ADD COLUMN IF NOT EXISTS tipo_responsavel text NOT NULL DEFAULT 'interno',
  ADD COLUMN IF NOT EXISTS empresa_slug text NULL,
  ADD COLUMN IF NOT EXISTS nome_externo text NULL,
  ADD COLUMN IF NOT EXISTS telefone_externo text NULL,
  ADD COLUMN IF NOT EXISTS comissao text NULL;

-- 2. Create scooter_reservations table mirroring cart_reservations
CREATE TABLE IF NOT EXISTS public.scooter_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL,
  scooter_id uuid NOT NULL,
  tipo_responsavel text NOT NULL,
  responsavel_user_id uuid NULL,
  comissao text NULL,
  empresa_slug text NULL,
  nome_externo text NULL,
  telefone_externo text NULL,
  inicio_em timestamptz NOT NULL,
  fim_em timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'agendada',
  observacoes text NULL,
  created_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scooter_reservations_scooter ON public.scooter_reservations(scooter_id);
CREATE INDEX IF NOT EXISTS idx_scooter_reservations_org ON public.scooter_reservations(org_id);
CREATE INDEX IF NOT EXISTS idx_scooter_reservations_period ON public.scooter_reservations(inicio_em, fim_em);

ALTER TABLE public.scooter_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scooter_reservations_select ON public.scooter_reservations;
CREATE POLICY scooter_reservations_select ON public.scooter_reservations
  FOR SELECT USING (is_org_member(auth.uid(), org_id));

DROP POLICY IF EXISTS scooter_reservations_insert ON public.scooter_reservations;
CREATE POLICY scooter_reservations_insert ON public.scooter_reservations
  FOR INSERT WITH CHECK (
    get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role,'gestor'::org_role,'operador'::org_role])
  );

DROP POLICY IF EXISTS scooter_reservations_update ON public.scooter_reservations;
CREATE POLICY scooter_reservations_update ON public.scooter_reservations
  FOR UPDATE USING (
    get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role,'gestor'::org_role,'operador'::org_role])
  );

DROP POLICY IF EXISTS scooter_reservations_delete ON public.scooter_reservations;
CREATE POLICY scooter_reservations_delete ON public.scooter_reservations
  FOR DELETE USING (
    get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role,'gestor'::org_role])
  );

-- 3. Validation trigger
CREATE OR REPLACE FUNCTION public.validate_scooter_reservation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.fim_em <= NEW.inicio_em THEN
    RAISE EXCEPTION 'A devolução prevista deve ser posterior ao início';
  END IF;

  IF NEW.tipo_responsavel = 'interno' AND NEW.responsavel_user_id IS NULL THEN
    RAISE EXCEPTION 'Selecione o membro responsável';
  END IF;
  IF NEW.tipo_responsavel = 'empresa' AND (NEW.empresa_slug IS NULL OR btrim(NEW.empresa_slug) = '') THEN
    RAISE EXCEPTION 'Selecione a empresa parceira';
  END IF;
  IF NEW.tipo_responsavel = 'outros' AND (NEW.nome_externo IS NULL OR btrim(NEW.nome_externo) = '') THEN
    RAISE EXCEPTION 'Informe o nome de quem retirará o patinete';
  END IF;

  IF NEW.status IN ('agendada','em_andamento') THEN
    IF EXISTS (
      SELECT 1 FROM public.scooter_reservations r
      WHERE r.scooter_id = NEW.scooter_id
        AND r.org_id = NEW.org_id
        AND r.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND r.status IN ('agendada','em_andamento')
        AND r.inicio_em < NEW.fim_em
        AND r.fim_em > NEW.inicio_em
    ) THEN
      RAISE EXCEPTION 'Já existe uma reserva ativa para este patinete no período selecionado';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_scooter_reservation ON public.scooter_reservations;
CREATE TRIGGER trg_validate_scooter_reservation
  BEFORE INSERT OR UPDATE ON public.scooter_reservations
  FOR EACH ROW EXECUTE FUNCTION public.validate_scooter_reservation();

DROP TRIGGER IF EXISTS trg_scooter_reservations_set_updated_at ON public.scooter_reservations;
CREATE TRIGGER trg_scooter_reservations_set_updated_at
  BEFORE UPDATE ON public.scooter_reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();