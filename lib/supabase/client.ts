import { createClient as createSsrBrowserClient } from "@/utils/supabase/client";

/**
 * Browser Supabase client (@supabase/ssr).
 * Prefer /api routes for guest flows; use this for direct client access when needed.
 */
export function createBrowserClient() {
  return createSsrBrowserClient();
}
