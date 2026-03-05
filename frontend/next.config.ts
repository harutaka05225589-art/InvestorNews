import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  async rewrites() {
    return [
      {
        source: '/api/og.png',
        destination: '/api/og',
      },
    ]
  },
};

export default nextConfig;
