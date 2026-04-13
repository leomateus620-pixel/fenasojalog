
-- Seed default expense categories for all orgs that don't have any yet
INSERT INTO expense_categories (name, icon, requires_vehicle, requires_transport, requires_document, org_id)
SELECT c.name, c.icon, c.requires_vehicle, c.requires_transport, c.requires_document, o.id
FROM organizations o
CROSS JOIN (VALUES
  ('Combustível', 'fuel', true, false, true),
  ('Pedágio', 'toll', false, true, true),
  ('Alimentação', 'utensils', false, false, false),
  ('Hospedagem', 'hotel', false, false, true),
  ('Manutenção', 'wrench', true, false, true),
  ('Lavagem', 'droplets', true, false, false),
  ('Estacionamento', 'parking', true, false, false),
  ('Frete de Apoio', 'truck', false, false, true),
  ('Despesas Diversas', 'receipt', false, false, false),
  ('Reembolso', 'banknote', false, false, false),
  ('Diária', 'calendar', false, false, false),
  ('Nota de Compra', 'shopping-cart', false, false, true),
  ('Material Operacional', 'package', false, false, true),
  ('Emergencial', 'alert-triangle', false, false, false)
) AS c(name, icon, requires_vehicle, requires_transport, requires_document)
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories ec WHERE ec.org_id = o.id AND ec.name = c.name
);

-- Also allow operador role to insert categories (for future auto-seed)
DROP POLICY IF EXISTS cat_insert ON expense_categories;
CREATE POLICY cat_insert ON expense_categories FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), org_id));
