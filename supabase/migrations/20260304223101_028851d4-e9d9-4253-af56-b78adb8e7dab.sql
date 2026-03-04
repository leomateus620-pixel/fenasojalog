
DROP POLICY IF EXISTS "audit_reports_select" ON public.security_audit_reports;
CREATE POLICY "audit_reports_select" ON public.security_audit_reports
  FOR SELECT TO authenticated
  USING (get_user_org_role(auth.uid(), org_id) IN ('admin'::org_role, 'operador'::org_role));

DROP POLICY IF EXISTS "audit_reports_insert" ON public.security_audit_reports;
CREATE POLICY "audit_reports_insert" ON public.security_audit_reports
  FOR INSERT TO authenticated
  WITH CHECK (get_user_org_role(auth.uid(), org_id) IN ('admin'::org_role, 'operador'::org_role));
