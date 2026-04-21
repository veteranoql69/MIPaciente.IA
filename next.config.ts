import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ties the build ID to the git commit SHA so browsers always invalidate
  // their cached JS/CSS after a new deployment is pushed.
  generateBuildId: async () => {
    return process.env.GITHUB_SHA ?? `local-${Date.now()}`
  },
};

export default nextConfig;
