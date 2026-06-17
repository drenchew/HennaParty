import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files, images, and large multipart uploads.
     * Upload routes use X-Guest-Token (not Supabase cookies) and skip body buffering.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/video/upload|api/photo/upload|api/photos|api/capsule/upload|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
