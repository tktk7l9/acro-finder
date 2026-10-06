import type { NextConfig } from "next";
import { securityHeaders } from "./lib/csp";

// lib/csp.ts is the source of truth for the security headers. These reach Worker
// responses only (/owners, 404s, RSC fallbacks); the static pages get the same
// headers from public/_headers, written by scripts/export-static.mjs.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({ dev: process.env.NODE_ENV !== "production" }),
      },
    ];
  },
};

export default nextConfig;
