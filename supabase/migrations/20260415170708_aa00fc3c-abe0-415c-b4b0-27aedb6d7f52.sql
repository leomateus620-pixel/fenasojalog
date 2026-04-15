
-- ══════════════════════════════════════════════════════════════
-- 1. TABLES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.official_committees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  committee_name text NOT NULL,
  president_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, committee_name)
);

CREATE TABLE public.committee_mobility_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  committee_id uuid NOT NULL REFERENCES public.official_committees(id) ON DELETE CASCADE,
  committee_name_snapshot text NOT NULL,
  president_name_snapshot text NOT NULL,
  operational_responsible_name text,
  operational_responsible_phone text,
  operational_responsible_email text,
  needs_electric_car boolean NOT NULL DEFAULT false,
  needs_scooter boolean NOT NULL DEFAULT false,
  submission_status text NOT NULL DEFAULT 'rascunho',
  submitted_at timestamptz,
  submitted_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.committee_mobility_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES public.committee_mobility_forms(id) ON DELETE CASCADE,
  committee_id uuid NOT NULL REFERENCES public.official_committees(id) ON DELETE CASCADE,
  member_name text NOT NULL,
  member_role text,
  member_identifier text,
  access_electric_car boolean NOT NULL DEFAULT false,
  access_scooter boolean NOT NULL DEFAULT false,
  qr_access_free boolean NOT NULL DEFAULT false,
  access_status text NOT NULL DEFAULT 'pendente',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 2. INDEXES
-- ══════════════════════════════════════════════════════════════

CREATE INDEX idx_official_committees_org ON public.official_committees(org_id);
CREATE INDEX idx_cmf_org ON public.committee_mobility_forms(org_id);
CREATE INDEX idx_cmf_committee ON public.committee_mobility_forms(committee_id);
CREATE INDEX idx_cmm_org ON public.committee_mobility_members(org_id);
CREATE INDEX idx_cmm_form ON public.committee_mobility_members(form_id);
CREATE INDEX idx_cmm_committee ON public.committee_mobility_members(committee_id);
CREATE INDEX idx_cmm_status ON public.committee_mobility_members(access_status);

-- ══════════════════════════════════════════════════════════════
-- 3. UPDATED_AT TRIGGERS
-- ══════════════════════════════════════════════════════════════

CREATE TRIGGER set_updated_at_official_committees
  BEFORE UPDATE ON public.official_committees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_cmf
  BEFORE UPDATE ON public.committee_mobility_forms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_cmm
  BEFORE UPDATE ON public.committee_mobility_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- 4. RLS
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.official_committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_mobility_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_mobility_members ENABLE ROW LEVEL SECURITY;

-- official_committees
CREATE POLICY "oc_select" ON public.official_committees FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "oc_insert" ON public.official_committees FOR INSERT
  WITH CHECK (public.get_user_org_role(auth.uid(), org_id) IN ('admin','gestor'));
CREATE POLICY "oc_update" ON public.official_committees FOR UPDATE
  USING (public.get_user_org_role(auth.uid(), org_id) IN ('admin','gestor'));
CREATE POLICY "oc_delete" ON public.official_committees FOR DELETE
  USING (public.get_user_org_role(auth.uid(), org_id) IN ('admin','gestor'));

-- committee_mobility_forms
CREATE POLICY "cmf_select" ON public.committee_mobility_forms FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "cmf_insert" ON public.committee_mobility_forms FOR INSERT
  WITH CHECK (public.get_user_org_role(auth.uid(), org_id) IN ('admin','gestor','operador'));
CREATE POLICY "cmf_update" ON public.committee_mobility_forms FOR UPDATE
  USING (public.get_user_org_role(auth.uid(), org_id) IN ('admin','gestor','operador'));
CREATE POLICY "cmf_delete" ON public.committee_mobility_forms FOR DELETE
  USING (public.get_user_org_role(auth.uid(), org_id) IN ('admin','gestor'));

-- committee_mobility_members
CREATE POLICY "cmm_select" ON public.committee_mobility_members FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "cmm_insert" ON public.committee_mobility_members FOR INSERT
  WITH CHECK (public.get_user_org_role(auth.uid(), org_id) IN ('admin','gestor','operador'));
CREATE POLICY "cmm_update" ON public.committee_mobility_members FOR UPDATE
  USING (public.get_user_org_role(auth.uid(), org_id) IN ('admin','gestor','operador'));
CREATE POLICY "cmm_delete" ON public.committee_mobility_members FOR DELETE
  USING (public.get_user_org_role(auth.uid(), org_id) IN ('admin','gestor'));

-- ══════════════════════════════════════════════════════════════
-- 5. SEED – 29 comissões oficiais Fenasoja 2026
-- ══════════════════════════════════════════════════════════════

INSERT INTO public.official_committees (org_id, committee_name, president_name)
SELECT o.id, c.committee_name, c.president_name
FROM public.organizations o
CROSS JOIN (VALUES
  ('Assessoria Financeira', 'Jeferson Araújo'),
  ('Assessoria de Sustentabilidade', 'Estela Zamberlan Schwerz'),
  ('Assessoria de Imprensa', 'Deise Anelise Froelich'),
  ('Assessoria Projetos Captações Institucionais', 'Jardel Hillesheim'),
  ('Assessoria Jurídica', 'José Mauro Barbieri'),
  ('Assessoria de Relações Internacionais', 'Jeferson Carvalho Frey'),
  ('Assessoria de Protocolo', 'Jorge Luiz Viana'),
  ('Agricultura, Soja e Derivados', 'Vanessa Matraszek Gnoatto'),
  ('Inovação e Experiência', 'Douglas Rafael Marques'),
  ('Arte e Cultura', 'Leonardo Chitolina'),
  ('Bilheteria', 'Gustavo Reis'),
  ('Credenciamento', 'Daniel Dallalba'),
  ('Cooperativismo', 'Alexandre Dall''Agnese'),
  ('Espaço do Automóvel', 'Elton Luís Walker'),
  ('Exporural', 'Germano Tessmer Büttow'),
  ('Indústria, Comércio e Serviços', 'Jorge Vinícius Feix'),
  ('Infraestrutura e Segurança do Trabalho', 'Djeison Fernando Drey'),
  ('Logística, Hotelaria e Turismo', 'Eduardo Santos'),
  ('Novas Gerações', 'Josyane Cristina Heck'),
  ('Pecuária', 'Elisandra Simão Reis'),
  ('Prevenção e Combate a Incêndio', 'Cap. Leonardo Ruy Dambros'),
  ('Recepção e Cerimonial', 'Simone Casagrande'),
  ('Relações Institucionais', 'Paulo Miguel Nedel'),
  ('Saúde, Bem-estar e Acessibilidade', 'Rosa Zorzan De Paula'),
  ('Segurança', 'Ten. Cel. Vanessa Peripolli'),
  ('Serviços', 'Valtair Dorneles'),
  ('Soja Store', 'Carla Freisleben Servat'),
  ('Shows', 'Vítor Hugo Nogueira Dutra'),
  ('Gastronomia', 'Rodrigo Calixto')
) AS c(committee_name, president_name)
ON CONFLICT (org_id, committee_name) DO NOTHING;
