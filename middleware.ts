import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optional middleware — API routes validate X-Guest-Token themselves.
 * Extend here for rate limiting or CORS if needed.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
