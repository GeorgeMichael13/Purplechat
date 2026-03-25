import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // --- STABLE TOP-LEVEL KEYS (Next.js 16+) ---
  serverExternalPackages: ["pdf-parse"],
  
  // --- TURBOPACK CONFIG ---
  // Moved out of experimental to be a top-level key
  turbopack: {
    resolveAlias: {
      canvas: 'false',
      encoding: 'false',
    },
  },

  // --- BUILD & LINT SETTINGS ---
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // --- EXPERIMENTAL (Keep only what is actually experimental) ---
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
    proxyClientMaxBodySize: '20mb',
  },

  // --- WEBPACK FALLBACK ---
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },

  transpilePackages: ["lucide-react"],
  reactStrictMode: true,

  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },

  async headers() {
    return [
      {
        source: "/_next/static/chunks/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;