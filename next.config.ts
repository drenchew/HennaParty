import type { NextConfig } from "next";

/** Video uploads allow up to 25 MB; add headroom for multipart boundaries. */
const MAX_UPLOAD_BODY = "30mb";

const nextConfig: NextConfig = {
  experimental: {
    middlewareClientMaxBodySize: MAX_UPLOAD_BODY,
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
