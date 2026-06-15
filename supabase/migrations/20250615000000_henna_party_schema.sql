-- =============================================================================
-- Henna Party — Production Supabase Schema
-- =============================================================================
-- Identity: anonymous guests identified by guest_token (stored in localStorage).
-- Recommended access pattern: Next.js Route Handlers using SUPABASE_SERVICE_ROLE_KEY
-- (service role bypasses RLS). Direct anon/authenticated client access is denied.
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. guests
-- =============================================================================
CREATE TABLE public.guests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_token  UUID        NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT guests_guest_token_format CHECK (guest_token <> '00000000-0000-0000-0000-000000000000'::uuid)
);

COMMENT ON TABLE  public.guests IS 'Anonymous guest sessions; guest_token is the client-facing identifier.';
COMMENT ON COLUMN public.guests.guest_token IS 'UUID persisted in browser localStorage and sent via X-Guest-Token header.';

CREATE INDEX idx_guests_created_at ON public.guests (created_at DESC);

-- =============================================================================
-- 2. duas
-- =============================================================================
CREATE TABLE public.duas (
  id                 SERIAL      PRIMARY KEY,
  arabic             TEXT        NOT NULL,
  translation        TEXT        NOT NULL,
  used               BOOLEAN     NOT NULL DEFAULT false,
  assigned_guest_id  UUID        REFERENCES public.guests (id) ON DELETE SET NULL,
  assigned_at        TIMESTAMPTZ,

  CONSTRAINT duas_arabic_not_empty CHECK (char_length(trim(arabic)) > 0),
  CONSTRAINT duas_translation_not_empty CHECK (char_length(trim(translation)) > 0),
  CONSTRAINT duas_used_requires_guest CHECK (
    (used = false AND assigned_guest_id IS NULL)
    OR (used = true AND assigned_guest_id IS NOT NULL)
  )
);

COMMENT ON TABLE  public.duas IS 'Pool of unique duas; each row can be assigned to at most one guest.';
COMMENT ON COLUMN public.duas.used IS 'True once this dua has been assigned to a guest.';
COMMENT ON COLUMN public.duas.assigned_guest_id IS 'Which guest received this dua (enables idempotent reload).';

CREATE UNIQUE INDEX idx_duas_assigned_guest_id
  ON public.duas (assigned_guest_id)
  WHERE assigned_guest_id IS NOT NULL;

CREATE INDEX idx_duas_available
  ON public.duas (id)
  WHERE used = false;

-- =============================================================================
-- 3. photos
-- =============================================================================
CREATE TABLE public.photos (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id   UUID        NOT NULL REFERENCES public.guests (id) ON DELETE CASCADE,
  url        TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT photos_url_not_empty CHECK (char_length(trim(url)) > 0)
);

COMMENT ON COLUMN public.photos.url IS 'Storage object path inside the photos bucket (not a public URL).';

CREATE INDEX idx_photos_guest_id ON public.photos (guest_id);
CREATE INDEX idx_photos_guest_created ON public.photos (guest_id, created_at DESC);

-- Max 3 photos per guest
CREATE OR REPLACE FUNCTION public.enforce_photo_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT count(*) FROM public.photos WHERE guest_id = NEW.guest_id) >= 3 THEN
    RAISE EXCEPTION 'PHOTO_LIMIT_REACHED: each guest may upload at most 3 photos'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_photos_limit
  BEFORE INSERT ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_photo_limit();

-- =============================================================================
-- 4. messages (advice)
-- =============================================================================
CREATE TABLE public.messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id   UUID        NOT NULL REFERENCES public.guests (id) ON DELETE CASCADE,
  message    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT messages_not_empty CHECK (char_length(trim(message)) BETWEEN 1 AND 2000)
);

CREATE INDEX idx_messages_guest_id ON public.messages (guest_id);
CREATE INDEX idx_messages_created_at ON public.messages (created_at DESC);

-- One advice message per guest (adjust if multiple messages are desired)
CREATE UNIQUE INDEX idx_messages_one_per_guest ON public.messages (guest_id);

-- =============================================================================
-- 5. videos (time capsule)
-- =============================================================================
CREATE TABLE public.videos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id    UUID        NOT NULL UNIQUE REFERENCES public.guests (id) ON DELETE CASCADE,
  video_url   TEXT        NOT NULL,
  unlock_date TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT videos_url_not_empty CHECK (char_length(trim(video_url)) > 0),
  CONSTRAINT videos_unlock_after_create CHECK (unlock_date > created_at)
);

COMMENT ON COLUMN public.videos.video_url IS 'Storage object path inside the videos bucket (not a public URL).';
COMMENT ON COLUMN public.videos.unlock_date IS 'Server-enforced unlock date; typically created_at + 1 year.';

CREATE INDEX idx_videos_guest_id ON public.videos (guest_id);
CREATE INDEX idx_videos_unlock_date ON public.videos (unlock_date);

-- Default unlock_date to created_at + 1 year when omitted
CREATE OR REPLACE FUNCTION public.set_video_unlock_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.unlock_date IS NULL THEN
    NEW.unlock_date := NEW.created_at + INTERVAL '1 year';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_videos_unlock_date
  BEFORE INSERT ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_video_unlock_date();

-- =============================================================================
-- 6. votes (questionnaire)
-- =============================================================================
CREATE TABLE public.votes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id    UUID        NOT NULL REFERENCES public.guests (id) ON DELETE CASCADE,
  question_id INTEGER     NOT NULL,
  answer      TEXT        NOT NULL,

  CONSTRAINT votes_answer_not_empty CHECK (char_length(trim(answer)) > 0),
  CONSTRAINT votes_question_id_positive CHECK (question_id > 0),
  CONSTRAINT votes_one_per_question UNIQUE (guest_id, question_id)
);

CREATE INDEX idx_votes_guest_id ON public.votes (guest_id);
CREATE INDEX idx_votes_question_id ON public.votes (question_id);
CREATE INDEX idx_votes_question_answer ON public.votes (question_id, answer);

-- =============================================================================
-- Helper: resolve guest by token
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_guest_id_by_token(p_guest_token UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.guests WHERE guest_token = p_guest_token LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_guest_id_by_token(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guest_id_by_token(UUID) TO service_role;

-- =============================================================================
-- Helper: atomic unique dua assignment (no duplicates until pool exhausted)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.assign_dua(p_guest_token UUID)
RETURNS public.duas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest_id UUID;
  v_dua      public.duas;
BEGIN
  SELECT id INTO v_guest_id
  FROM public.guests
  WHERE guest_token = p_guest_token;

  IF v_guest_id IS NULL THEN
    RAISE EXCEPTION 'GUEST_NOT_FOUND'
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Idempotent: return existing assignment for this guest
  SELECT d.* INTO v_dua
  FROM public.duas d
  WHERE d.assigned_guest_id = v_guest_id;

  IF FOUND THEN
    RETURN v_dua;
  END IF;

  -- Assign next available dua (row-level lock prevents double assignment)
  UPDATE public.duas d
  SET
    used              = true,
    assigned_guest_id = v_guest_id,
    assigned_at       = now()
  WHERE d.id = (
    SELECT d2.id
    FROM public.duas d2
    WHERE d2.used = false
    ORDER BY d2.id
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING d.* INTO v_dua;

  IF v_dua.id IS NULL THEN
    RAISE EXCEPTION 'DUA_POOL_EXHAUSTED'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN v_dua;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_dua(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_dua(UUID) TO service_role;

-- =============================================================================
-- Helper: server-side video unlock check (for signed URL generation)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_video_unlocked(p_video_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.videos v
    WHERE v.id = p_video_id
      AND now() >= v.unlock_date
  );
$$;

REVOKE ALL ON FUNCTION public.is_video_unlocked(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_video_unlocked(UUID) TO service_role;

-- =============================================================================
-- Aggregate stats (thank-you page)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_event_stats()
RETURNS TABLE (
  duas_assigned   BIGINT,
  photos_uploaded BIGINT,
  messages_count  BIGINT,
  votes_count     BIGINT,
  videos_count    BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.duas WHERE used = true),
    (SELECT count(*) FROM public.photos),
    (SELECT count(*) FROM public.messages),
    (SELECT count(*) FROM public.votes),
    (SELECT count(*) FROM public.videos);
$$;

REVOKE ALL ON FUNCTION public.get_event_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_stats() TO service_role;

-- =============================================================================
-- Row Level Security — deny direct client access; use service role via API
-- =============================================================================
ALTER TABLE public.guests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes    ENABLE ROW LEVEL SECURITY;

-- guests
CREATE POLICY "guests_deny_anon"
  ON public.guests FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "guests_deny_authenticated"
  ON public.guests FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "guests_service_role_all"
  ON public.guests FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- duas
CREATE POLICY "duas_deny_anon"
  ON public.duas FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "duas_deny_authenticated"
  ON public.duas FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "duas_service_role_all"
  ON public.duas FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- photos
CREATE POLICY "photos_deny_anon"
  ON public.photos FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "photos_deny_authenticated"
  ON public.photos FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "photos_service_role_all"
  ON public.photos FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- messages
CREATE POLICY "messages_deny_anon"
  ON public.messages FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "messages_deny_authenticated"
  ON public.messages FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "messages_service_role_all"
  ON public.messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- videos
CREATE POLICY "videos_deny_anon"
  ON public.videos FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "videos_deny_authenticated"
  ON public.videos FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "videos_service_role_all"
  ON public.videos FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- votes
CREATE POLICY "votes_deny_anon"
  ON public.votes FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "votes_deny_authenticated"
  ON public.votes FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "votes_service_role_all"
  ON public.votes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =============================================================================
-- Storage buckets (private — signed URLs only via server)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'photos',
    'photos',
    false,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'videos',
    'videos',
    false,
    26214400, -- 25 MB (~60s compressed mobile video)
    ARRAY['video/webm', 'video/mp4', 'video/quicktime']
  )
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- Storage RLS — block public/anon; service role manages objects via API
-- =============================================================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Deny anon on all buckets
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

-- Deny authenticated (no Supabase Auth login in this app)
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

-- Service role: full access to photos + videos buckets
CREATE POLICY "storage_service_role_photos_all"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'photos')
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "storage_service_role_videos_all"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'videos')
  WITH CHECK (bucket_id = 'videos');

-- Optional: path convention enforcement helper (call from upload API before storage insert)
-- Expected paths: {guest_id}/{file_id}.ext
