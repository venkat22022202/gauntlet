import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gauntlet's scan runner talks to user-supplied, OpenAI-compatible endpoints
  // at request time. Nothing provider-specific is hard-coded.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
