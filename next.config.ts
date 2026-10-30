import { fileURLToPath } from "node:url";
import path from "node:path";
import type { NextConfig } from "next";

const dir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keeps the trace rooted at this project even though a stray lockfile
  // exists higher up in the user's home directory.
  outputFileTracingRoot: dir,
  images: {
    // Local / API-served media is optimised locally. Remote editorial imagery
    // is served `unoptimized` (see src/components/ui/MediaImage.tsx) so the
    // site never depends on a remote image proxy at request time.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  eslint: {
    // Lint still runs via `npm run lint`; builds stay unblocked by style rules.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
