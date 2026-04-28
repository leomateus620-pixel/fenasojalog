
-- 1) Adicionar coluna nome_externo em electric_carts (suporte a tipo "outros" no fluxo imediato)
ALTER TABLE public.electric_carts
  ADD COLUMN IF NOT EXISTS nome_externo text;

-- 2) Criar tabela cart_reservations
CREATE TABLE IF NOT EXISTS public.cart_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  cart_id uuid NOT NULL,
  tipo_responsavel text NOT NULL CHECK (tipo_responsavel IN ('interno','empresa','outros')),
  responsavel_user_id uuid,
  comissao text,
  empresa_slug text,
  nome_externo text,
  telefone_externo text,
  inicio_em timestamptz NOT NULL,
  fim_em timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada','em_andamento','concluida','cancelada')),
  observacoes text,
  created_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cart_reservations_org ON public.cart_reservations(org_id);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_cart ON public.cart_reservations(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_period ON public.cart_reservations(cart_id, inicio_em, fim_em) WHERE status IN ('agendada','em_andamento');

-- 3) Trigger updated_at
DROP TRIGGER IF EXISTS trg_cart_reservations_updated_at ON public.cart_reservations;
CREATE TRIGGER trg_cart_reservations_updated_at
BEFORE UPDATE ON public.cart_reservations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Trigger validação + conflito
CREATE OR REPLACE FUNCTION public.validate_cart_reservation()
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
    RAISE EXCEPTION 'Informe o nome de quem retirará o carrinho';
  END IF;

  -- Conflito de período (somente reservas ativas)
  IF NEW.status IN ('agendada','em_andamento') THEN
    IF EXISTS (
      SELECT 1 FROM public.cart_reservations r
      WHERE r.cart_id = NEW.cart_id
        AND r.org_id = NEW.org_id
        AND r.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND r.status IN ('agendada','em_andamento')
        AND r.inicio_em < NEW.fim_em
        AND r.fim_em > NEW.inicio_em
    ) THEN
      RAISE EXCEPTION 'Já existe uma reserva ativa para este carrinho no período selecionado';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_cart_reservation ON public.cart_reservations;
CREATE TRIGGER trg_validate_cart_reservation
BEFORE INSERT OR UPDATE ON public.cart_reservations
FOR EACH ROW EXECUTE FUNCTION public.validate_cart_reservation();

-- 5) RLS
ALTER TABLE public.cart_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cart_reservations_select ON public.cart_reservations;
CREATE POLICY cart_reservations_select
ON public.cart_reservations FOR SELECT
USING (is_org_member(auth.uid(), org_id));

DROP POLICY IF EXISTS cart_reservations_insert ON public.cart_reservations;
CREATE POLICY cart_reservations_insert
ON public.cart_reservations FOR INSERT
WITH CHECK (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

DROP POLICY IF EXISTS cart_reservations_update ON public.cart_reservations;
CREATE POLICY cart_reservations_update
ON public.cart_reservations FOR UPDATE
USING (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

DROP POLICY IF EXISTS cart_reservations_delete ON public.cart_reservations;
CREATE POLICY cart_reservations_delete
ON public.cart_reservations FOR DELETE
USING (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role]));
