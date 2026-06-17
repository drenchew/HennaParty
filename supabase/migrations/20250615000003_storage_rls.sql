-- Apply via Supabase SQL Editor only (postgres pooler cannot ALTER storage.objects).
-- Dashboard: https://supabase.com/dashboard/project/hgxihcjjtwzhamrpzwhb/sql/new

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "storage_objects_deny_anon_select"
  ON storage.objects FOR SELECT TO anon
  USING (false);

CREATE POLICY "storage_objects_deny_anon_insert"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (false);

CREATE POLICY "storage_objects_deny_anon_update"
  ON storage.objects FOR UPDATE TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "storage_objects_deny_anon_delete"
  ON storage.objects FOR DELETE TO anon
  USING (false);

CREATE POLICY "storage_objects_deny_authenticated_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (false);

CREATE POLICY "storage_objects_deny_authenticated_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "storage_objects_deny_authenticated_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "storage_objects_deny_authenticated_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "storage_service_role_photos_all"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'photos')
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "storage_service_role_videos_all"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'videos')
  WITH CHECK (bucket_id = 'videos');
