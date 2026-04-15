DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'mobility_authorization_type'
  ) THEN
    CREATE TYPE public.mobility_authorization_type AS ENUM ('carro_eletrico', 'patinete');
  END IF;
END $$;

DROP POLICY IF EXISTS pfl_select ON public.public_form_links;
DROP POLICY IF EXISTS pfl_insert ON public.public_form_links;
DROP POLICY IF EXISTS pfl_update ON public.public_form_links;
DROP POLICY IF EXISTS pfl_delete ON public.public_form_links;

CREATE POLICY pfl_select
ON public.public_form_links
FOR SELECT
USING (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

CREATE POLICY pfl_insert
ON public.public_form_links
FOR INSERT
WITH CHECK (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

CREATE POLICY pfl_update
ON public.public_form_links
FOR UPDATE
USING (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

CREATE POLICY pfl_delete
ON public.public_form_links
FOR DELETE
USING (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

CREATE TABLE IF NOT EXISTS public.public_mobility_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  link_id uuid NOT NULL REFERENCES public.public_form_links(id) ON DELETE RESTRICT,
  committee_id uuid NOT NULL REFERENCES public.official_committees(id) ON DELETE RESTRICT,
  committee_name_snapshot text NOT NULL,
  president_name_snapshot text NOT NULL,
  operational_responsible_name text,
  operational_responsible_phone text,
  operational_responsible_email text,
  needs_electric_car boolean NOT NULL DEFAULT false,
  needs_scooter boolean NOT NULL DEFAULT false,
  submission_status text NOT NULL DEFAULT 'enviado',
  submitted_at timestamptz,
  last_public_access_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT public_mobility_forms_link_id_key UNIQUE (link_id)
);

CREATE INDEX IF NOT EXISTS idx_public_mobility_forms_org_id ON public.public_mobility_forms(org_id);
CREATE INDEX IF NOT EXISTS idx_public_mobility_forms_committee_id ON public.public_mobility_forms(committee_id);
CREATE INDEX IF NOT EXISTS idx_public_mobility_forms_status ON public.public_mobility_forms(submission_status);

CREATE TABLE IF NOT EXISTS public.public_mobility_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.public_mobility_forms(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  committee_id uuid NOT NULL REFERENCES public.official_committees(id) ON DELETE RESTRICT,
  member_name text NOT NULL,
  member_role text,
  member_identifier text,
  access_electric_car boolean NOT NULL DEFAULT false,
  access_scooter boolean NOT NULL DEFAULT false,
  qr_access_free boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_mobility_members_form_id ON public.public_mobility_members(form_id);
CREATE INDEX IF NOT EXISTS idx_public_mobility_members_org_id ON public.public_mobility_members(org_id);
CREATE INDEX IF NOT EXISTS idx_public_mobility_members_committee_id ON public.public_mobility_members(committee_id);

CREATE TABLE IF NOT EXISTS public.public_form_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  link_id uuid NOT NULL REFERENCES public.public_form_links(id) ON DELETE CASCADE,
  form_id uuid REFERENCES public.public_mobility_forms(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_scope text NOT NULL DEFAULT 'system',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_form_audit_org_id ON public.public_form_audit(org_id);
CREATE INDEX IF NOT EXISTS idx_public_form_audit_link_id ON public.public_form_audit(link_id);
CREATE INDEX IF NOT EXISTS idx_public_form_audit_form_id ON public.public_form_audit(form_id);
CREATE INDEX IF NOT EXISTS idx_public_form_audit_event_type ON public.public_form_audit(event_type);

CREATE TABLE IF NOT EXISTS public.mobility_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_link_id uuid NOT NULL REFERENCES public.public_form_links(id) ON DELETE CASCADE,
  source_form_id uuid NOT NULL REFERENCES public.public_mobility_forms(id) ON DELETE CASCADE,
  source_member_id uuid NOT NULL REFERENCES public.public_mobility_members(id) ON DELETE CASCADE,
  committee_id uuid NOT NULL REFERENCES public.official_committees(id) ON DELETE RESTRICT,
  committee_name_snapshot text NOT NULL,
  president_name_snapshot text NOT NULL,
  operational_responsible_name text,
  operational_responsible_phone text,
  operational_responsible_email text,
  member_name text NOT NULL,
  member_role text,
  member_identifier text,
  authorization_type public.mobility_authorization_type NOT NULL,
  qr_access_free boolean NOT NULL DEFAULT false,
  access_status text NOT NULL DEFAULT 'pendente',
  source_origin text NOT NULL DEFAULT 'formulario_publico',
  notes text,
  submitted_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mobility_authorizations_unique_source UNIQUE (source_member_id, authorization_type)
);

CREATE INDEX IF NOT EXISTS idx_mobility_authorizations_org_id ON public.mobility_authorizations(org_id);
CREATE INDEX IF NOT EXISTS idx_mobility_authorizations_committee_id ON public.mobility_authorizations(committee_id);
CREATE INDEX IF NOT EXISTS idx_mobility_authorizations_type ON public.mobility_authorizations(authorization_type);
CREATE INDEX IF NOT EXISTS idx_mobility_authorizations_status ON public.mobility_authorizations(access_status);
CREATE INDEX IF NOT EXISTS idx_mobility_authorizations_member_name ON public.mobility_authorizations(member_name);

ALTER TABLE public.public_mobility_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_mobility_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_form_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_authorizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pmf_select ON public.public_mobility_forms;
DROP POLICY IF EXISTS pmf_insert ON public.public_mobility_forms;
DROP POLICY IF EXISTS pmf_update ON public.public_mobility_forms;
DROP POLICY IF EXISTS pmf_delete ON public.public_mobility_forms;

CREATE POLICY pmf_select
ON public.public_mobility_forms
FOR SELECT
USING (is_org_member(auth.uid(), org_id));

CREATE POLICY pmf_insert
ON public.public_mobility_forms
FOR INSERT
WITH CHECK (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

CREATE POLICY pmf_update
ON public.public_mobility_forms
FOR UPDATE
USING (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

CREATE POLICY pmf_delete
ON public.public_mobility_forms
FOR DELETE
USING (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

DROP POLICY IF EXISTS pmm_select ON public.public_mobility_members;
DROP POLICY IF EXISTS pmm_insert ON public.public_mobility_members;
DROP POLICY IF EXISTS pmm_update ON public.public_mobility_members;
DROP POLICY IF EXISTS pmm_delete ON public.public_mobility_members;

CREATE POLICY pmm_select
ON public.public_mobility_members
FOR SELECT
USING (is_org_member(auth.uid(), org_id));

CREATE POLICY pmm_insert
ON public.public_mobility_members
FOR INSERT
WITH CHECK (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

CREATE POLICY pmm_update
ON public.public_mobility_members
FOR UPDATE
USING (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

CREATE POLICY pmm_delete
ON public.public_mobility_members
FOR DELETE
USING (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

DROP POLICY IF EXISTS pfa_select ON public.public_form_audit;

CREATE POLICY pfa_select
ON public.public_form_audit
FOR SELECT
USING (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

DROP POLICY IF EXISTS ma_select ON public.mobility_authorizations;
DROP POLICY IF EXISTS ma_insert ON public.mobility_authorizations;
DROP POLICY IF EXISTS ma_update ON public.mobility_authorizations;
DROP POLICY IF EXISTS ma_delete ON public.mobility_authorizations;

CREATE POLICY ma_select
ON public.mobility_authorizations
FOR SELECT
USING (is_org_member(auth.uid(), org_id));

CREATE POLICY ma_insert
ON public.mobility_authorizations
FOR INSERT
WITH CHECK (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

CREATE POLICY ma_update
ON public.mobility_authorizations
FOR UPDATE
USING (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

CREATE POLICY ma_delete
ON public.mobility_authorizations
FOR DELETE
USING (get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role, 'operador'::org_role]));

DROP TRIGGER IF EXISTS set_public_mobility_forms_updated_at ON public.public_mobility_forms;
CREATE TRIGGER set_public_mobility_forms_updated_at
BEFORE UPDATE ON public.public_mobility_forms
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_public_mobility_members_updated_at ON public.public_mobility_members;
CREATE TRIGGER set_public_mobility_members_updated_at
BEFORE UPDATE ON public.public_mobility_members
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_mobility_authorizations_updated_at ON public.mobility_authorizations;
CREATE TRIGGER set_mobility_authorizations_updated_at
BEFORE UPDATE ON public.mobility_authorizations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.sync_public_mobility_form(_form_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_form public.public_mobility_forms%ROWTYPE;
  v_link public.public_form_links%ROWTYPE;
BEGIN
  SELECT * INTO v_form
  FROM public.public_mobility_forms
  WHERE id = _form_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'formulário público não encontrado';
  END IF;

  SELECT * INTO v_link
  FROM public.public_form_links
  WHERE id = v_form.link_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'link público não encontrado';
  END IF;

  DELETE FROM public.mobility_authorizations
  WHERE source_form_id = v_form.id;

  INSERT INTO public.mobility_authorizations (
    org_id,
    source_link_id,
    source_form_id,
    source_member_id,
    committee_id,
    committee_name_snapshot,
    president_name_snapshot,
    operational_responsible_name,
    operational_responsible_phone,
    operational_responsible_email,
    member_name,
    member_role,
    member_identifier,
    authorization_type,
    qr_access_free,
    access_status,
    source_origin,
    notes,
    submitted_at,
    synced_at
  )
  SELECT
    m.org_id,
    v_form.link_id,
    v_form.id,
    m.id,
    v_form.committee_id,
    v_form.committee_name_snapshot,
    v_form.president_name_snapshot,
    v_form.operational_responsible_name,
    v_form.operational_responsible_phone,
    v_form.operational_responsible_email,
    m.member_name,
    m.member_role,
    m.member_identifier,
    auth_type.authorization_type,
    m.qr_access_free,
    'pendente',
    'formulario_publico',
    m.notes,
    v_form.submitted_at,
    now()
  FROM public.public_mobility_members m
  CROSS JOIN LATERAL (
    SELECT 'carro_eletrico'::public.mobility_authorization_type AS authorization_type
    WHERE m.access_electric_car = true
    UNION ALL
    SELECT 'patinete'::public.mobility_authorization_type AS authorization_type
    WHERE m.access_scooter = true
  ) auth_type
  WHERE m.form_id = v_form.id;

  UPDATE public.public_mobility_forms
  SET last_synced_at = now(),
      submission_status = 'sincronizado',
      updated_at = now()
  WHERE id = v_form.id;

  INSERT INTO public.public_form_audit (org_id, link_id, form_id, event_type, actor_scope, payload)
  VALUES (
    v_form.org_id,
    v_form.link_id,
    v_form.id,
    'sync_completed',
    'system',
    jsonb_build_object(
      'authorization_count', (SELECT COUNT(*) FROM public.mobility_authorizations WHERE source_form_id = v_form.id),
      'committee_id', v_form.committee_id,
      'committee_name', v_form.committee_name_snapshot
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_public_mobility_form(
  _token_hash text,
  _operational_responsible_name text DEFAULT NULL,
  _operational_responsible_phone text DEFAULT NULL,
  _operational_responsible_email text DEFAULT NULL,
  _needs_electric_car boolean DEFAULT false,
  _needs_scooter boolean DEFAULT false,
  _members jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link public.public_form_links%ROWTYPE;
  v_form_id uuid;
  v_member jsonb;
  v_member_name text;
  v_member_role text;
  v_member_identifier text;
  v_access_electric_car boolean;
  v_access_scooter boolean;
  v_qr_access_free boolean;
  v_notes text;
BEGIN
  IF _token_hash IS NULL OR btrim(_token_hash) = '' THEN
    RAISE EXCEPTION 'token inválido';
  END IF;

  IF _members IS NULL OR jsonb_typeof(_members) <> 'array' THEN
    RAISE EXCEPTION 'lista de integrantes inválida';
  END IF;

  SELECT * INTO v_link
  FROM public.public_form_links
  WHERE token_hash = _token_hash;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'link não encontrado';
  END IF;

  IF v_link.is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'link desativado';
  END IF;

  IF COALESCE(_needs_electric_car, false) IS NOT TRUE AND COALESCE(_needs_scooter, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'selecione ao menos um modal';
  END IF;

  INSERT INTO public.public_mobility_forms (
    org_id,
    link_id,
    committee_id,
    committee_name_snapshot,
    president_name_snapshot,
    operational_responsible_name,
    operational_responsible_phone,
    operational_responsible_email,
    needs_electric_car,
    needs_scooter,
    submission_status,
    submitted_at,
    last_public_access_at,
    updated_at
  ) VALUES (
    v_link.org_id,
    v_link.id,
    v_link.committee_id,
    v_link.committee_name_snapshot,
    v_link.president_name_snapshot,
    NULLIF(btrim(_operational_responsible_name), ''),
    NULLIF(btrim(_operational_responsible_phone), ''),
    NULLIF(btrim(_operational_responsible_email), ''),
    COALESCE(_needs_electric_car, false),
    COALESCE(_needs_scooter, false),
    'enviado',
    now(),
    now(),
    now()
  )
  ON CONFLICT (link_id)
  DO UPDATE SET
    committee_id = EXCLUDED.committee_id,
    committee_name_snapshot = EXCLUDED.committee_name_snapshot,
    president_name_snapshot = EXCLUDED.president_name_snapshot,
    operational_responsible_name = EXCLUDED.operational_responsible_name,
    operational_responsible_phone = EXCLUDED.operational_responsible_phone,
    operational_responsible_email = EXCLUDED.operational_responsible_email,
    needs_electric_car = EXCLUDED.needs_electric_car,
    needs_scooter = EXCLUDED.needs_scooter,
    submission_status = 'enviado',
    submitted_at = now(),
    last_public_access_at = now(),
    updated_at = now()
  RETURNING id INTO v_form_id;

  DELETE FROM public.public_mobility_members
  WHERE form_id = v_form_id;

  FOR v_member IN
    SELECT value
    FROM jsonb_array_elements(_members)
  LOOP
    v_member_name := btrim(COALESCE(v_member->>'member_name', ''));
    v_member_role := NULLIF(btrim(COALESCE(v_member->>'member_role', '')), '');
    v_member_identifier := NULLIF(btrim(COALESCE(v_member->>'member_identifier', '')), '');
    v_access_electric_car := COALESCE((v_member->>'access_electric_car')::boolean, false);
    v_access_scooter := COALESCE((v_member->>'access_scooter')::boolean, false);
    v_qr_access_free := COALESCE((v_member->>'qr_access_free')::boolean, false);
    v_notes := NULLIF(btrim(COALESCE(v_member->>'notes', '')), '');

    IF v_member_name = '' THEN
      RAISE EXCEPTION 'nome do integrante é obrigatório';
    END IF;

    IF v_access_electric_car IS NOT TRUE AND v_access_scooter IS NOT TRUE THEN
      RAISE EXCEPTION 'cada integrante precisa ter ao menos um modal';
    END IF;

    IF v_access_electric_car IS TRUE AND EXISTS (
      SELECT 1
      FROM public.public_mobility_members existing
      WHERE existing.form_id = v_form_id
        AND lower(existing.member_name) = lower(v_member_name)
        AND COALESCE(existing.member_identifier, '') = COALESCE(v_member_identifier, '')
        AND existing.access_electric_car = true
    ) THEN
      RAISE EXCEPTION 'integrante duplicado para carro elétrico';
    END IF;

    IF v_access_scooter IS TRUE AND EXISTS (
      SELECT 1
      FROM public.public_mobility_members existing
      WHERE existing.form_id = v_form_id
        AND lower(existing.member_name) = lower(v_member_name)
        AND COALESCE(existing.member_identifier, '') = COALESCE(v_member_identifier, '')
        AND existing.access_scooter = true
    ) THEN
      RAISE EXCEPTION 'integrante duplicado para patinete';
    END IF;

    INSERT INTO public.public_mobility_members (
      form_id,
      org_id,
      committee_id,
      member_name,
      member_role,
      member_identifier,
      access_electric_car,
      access_scooter,
      qr_access_free,
      notes
    ) VALUES (
      v_form_id,
      v_link.org_id,
      v_link.committee_id,
      v_member_name,
      v_member_role,
      v_member_identifier,
      v_access_electric_car,
      v_access_scooter,
      v_qr_access_free,
      v_notes
    );
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM public.public_mobility_members WHERE form_id = v_form_id
  ) THEN
    RAISE EXCEPTION 'adicione ao menos um integrante';
  END IF;

  INSERT INTO public.public_form_audit (org_id, link_id, form_id, event_type, actor_scope, payload)
  VALUES (
    v_link.org_id,
    v_link.id,
    v_form_id,
    'submission_received',
    'public',
    jsonb_build_object(
      'needs_electric_car', COALESCE(_needs_electric_car, false),
      'needs_scooter', COALESCE(_needs_scooter, false),
      'member_count', (SELECT COUNT(*) FROM public.public_mobility_members WHERE form_id = v_form_id)
    )
  );

  PERFORM public.sync_public_mobility_form(v_form_id);

  RETURN v_form_id;
END;
$$;