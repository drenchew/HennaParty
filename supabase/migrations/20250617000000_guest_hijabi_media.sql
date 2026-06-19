-- Guest hijab preference + separate storage for hijabi photos/videos
-- =============================================================================

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS hijabi BOOLEAN;

COMMENT ON COLUMN public.guests.hijabi IS
  'Photo/video section: true = hijabi-private buckets; false = standard buckets; NULL until guest chooses.';

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS is_hijabi BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS is_hijabi BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.photos.is_hijabi IS 'Storage bucket group at upload time (photos vs photos-hijabi).';
COMMENT ON COLUMN public.videos.is_hijabi IS 'Storage bucket group at upload time (videos vs videos-hijabi).';

CREATE INDEX IF NOT EXISTS idx_photos_is_hijabi ON public.photos (is_hijabi);
CREATE INDEX IF NOT EXISTS idx_videos_is_hijabi ON public.videos (is_hijabi);

-- Hijabi-private buckets (same limits as standard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'photos-hijabi',
    'photos-hijabi',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'videos-hijabi',
    'videos-hijabi',
    false,
    26214400,
    ARRAY['video/webm', 'video/mp4', 'video/quicktime']
  )
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
