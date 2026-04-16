-- 1) Permitir DELETE para usuários com capability mobility_access
DROP POLICY IF EXISTS "cmf_delete" ON public.committee_mobility_forms;
CREATE POLICY "cmf_delete" ON public.committee_mobility_forms FOR DELETE
  USING (
    public.get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role])
    OR public.has_capability(auth.uid(), org_id, 'mobility_access')
  );

DROP POLICY IF EXISTS "cmm_delete" ON public.committee_mobility_members;
CREATE POLICY "cmm_delete" ON public.committee_mobility_members FOR DELETE
  USING (
    public.get_user_org_role(auth.uid(), org_id) = ANY (ARRAY['admin'::org_role, 'gestor'::org_role])
    OR public.has_capability(auth.uid(), org_id, 'mobility_access')
  );

-- 2) Trigger para CASCADE limpeza de mobility_authorizations quando form/member internos forem deletados
CREATE OR REPLACE FUNCTION public.cascade_delete_mobility_auth_by_form()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.mobility_authorizations WHERE internal_form_id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.cascade_delete_mobility_auth_by_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.mobility_authorizations WHERE internal_member_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_auth_by_form ON public.committee_mobility_forms;
CREATE TRIGGER trg_cascade_auth_by_form
  BEFORE DELETE ON public.committee_mobility_forms
  FOR EACH ROW EXECUTE FUNCTION public.cascade_delete_mobility_auth_by_form();

DROP TRIGGER IF EXISTS trg_cascade_auth_by_member ON public.committee_mobility_members;
CREATE TRIGGER trg_cascade_auth_by_member
  BEFORE DELETE ON public.committee_mobility_members
  FOR EACH ROW EXECUTE FUNCTION public.cascade_delete_mobility_auth_by_member();

-- 3) Trigger para CASCADE delete de members quando form for deletado
CREATE OR REPLACE FUNCTION public.cascade_delete_members_by_form()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.committee_mobility_members WHERE form_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_members_by_form ON public.committee_mobility_forms;
CREATE TRIGGER trg_cascade_members_by_form
  BEFORE DELETE ON public.committee_mobility_forms
  FOR EACH ROW EXECUTE FUNCTION public.cascade_delete_members_by_form();