-- Storage RLS policies (OPTIONAL for Henna Party)
-- =============================================================================
-- Supabase owns storage.objects — you CANNOT run:
--   ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- RLS is already enabled by default on hosted Supabase (April 2025+).
--
-- This app uses SUPABASE_SERVICE_ROLE_KEY for all uploads/admin — service role
-- bypasses RLS, so the app works WITHOUT this file.
--
-- Run only the CREATE POLICY block below if you want extra lock-down (deny
-- anon/authenticated direct storage access). Skip entirely if policies fail.
-- Dashboard alternative: Storage → bucket → Policies (same rules, no SQL).
-- =============================================================================

DROP POLICY IF EXISTS
  "storage_objects_deny_anon_select" ON storage.objects;
DROP POLICY IF EXISTS
  "storage_objects_deny_anon_insert" ON storage.objects;
DROP POLICY IF EXISTS
  "storage_objects_deny_anon_update" ON storage.objects;
DROP POLICY IF EXISTS
  "storage_objects_deny_anon_delete" ON storage.objects;
DROP POLICY IF EXISTS
  "storage_objects_deny_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS
  "storage_objects_deny_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS
  "storage_objects_deny_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS
  "storage_objects_deny_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS
  "storage_service_role_photos_all" ON storage.objects;
DROP POLICY IF EXISTS
  "storage_service_role_videos_all" ON storage.objects;
DROP POLICY IF EXISTS
  "storage_service_role_photos_hijabi_all" ON storage.objects;
DROP POLICY IF EXISTS
  "storage_service_role_videos_hijabi_all" ON storage.objects;

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

CREATE POLICY "storage_service_role_photos_hijabi_all"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'photos-hijabi')
  WITH CHECK (bucket_id = 'photos-hijabi');

CREATE POLICY "storage_service_role_videos_hijabi_all"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'videos-hijabi')
  WITH CHECK (bucket_id = 'videos-hijabi');
