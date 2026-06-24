/** Max video length for time-capsule recordings and uploads. */
export const MAX_VIDEO_DURATION_SECONDS = 30;

/** Client-side compression targets (before upload). */
export const PHOTO_COMPRESS_TARGET_BYTES = 3 * 1024 * 1024;
export const VIDEO_COMPRESS_TARGET_BYTES = 15 * 1024 * 1024;

/** Re-encode uploaded videos larger than this before upload. */
export const VIDEO_COMPRESS_THRESHOLD_BYTES = VIDEO_COMPRESS_TARGET_BYTES;

/** Supabase bucket limits — unchanged, no migration required. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;