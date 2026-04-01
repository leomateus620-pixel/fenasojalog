-- Drop the existing permissive policy
DROP POLICY IF EXISTS "vehicle_docs_select" ON storage.objects;

-- Create restricted policy: only authenticated org members can read
CREATE POLICY "vehicle_docs_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'vehicle-documents'
  AND is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);