import type { NextConfig } from "next";

/** Video uploads allow up to 25 MB; add headroom for multipart boundaries. */
const MAX_UPLOAD_BODY = "30mb";

/**
 * Allow phone/LAN access during dev (e.g. http://172.20.10.3:3000).
 * Set ALLOWED_DEV_ORIGINS=172.20.10.3,192.168.1.5 in .env.local if your IP changes.
 */
const allowedDevOrigins =
  process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? ["172.20.10.3"];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  experimental: {
    middlewareClientMaxBodySize: MAX_UPLOAD_BODY,
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
