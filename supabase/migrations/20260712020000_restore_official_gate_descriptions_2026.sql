-- Restores the access semantics printed in the official Fenasoja 2026 legend.
-- The previous data-only correction reduced A10/A11 to their short names.
-- This remains restricted to managed, non-commercial reference entities.

WITH official_gate_names(public_identifier, official_name) AS (
  VALUES
    ('A10', 'Portão 10 — entrada e saída de visitantes'),
    ('A11', 'Portão 11 — entrada e saída de visitantes e expositores')
)
UPDATE public.map_entities AS entity
SET name = official_gate_names.official_name,
    metadata = coalesce(entity.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'officialDisplayName', official_gate_names.official_name,
        'cartographicCorrection', 'official-pdf-2026-04-29-access-semantics'
      ),
    updated_at = now()
FROM official_gate_names
WHERE entity.public_identifier = official_gate_names.public_identifier
  AND entity.classification = 'GATE'
  AND entity.is_archived = false
  AND lower(coalesce(entity.metadata->>'seedManaged', 'false')) = 'true'
  AND coalesce(entity.metadata->>'sourceRevision', '') LIKE '2026%'
  AND NOT EXISTS (
    SELECT 1
    FROM public.commercial_lots AS lot
    WHERE lot.entity_id = entity.id
  )
  AND (
    entity.name IS DISTINCT FROM official_gate_names.official_name
    OR entity.metadata->>'officialDisplayName' IS DISTINCT FROM official_gate_names.official_name
  );
