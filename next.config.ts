/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- CRITICAL: FIX FOR PDF-PARSE & TURBOPACK ---
  // This tells Next.js not to bundle this library, 
  // preventing "Module not found" and "Export default" errors.
  serverExternalPackages: ["pdf-parse"],

  // Enables optimizations for Lucide icons used in your ChatInput
  transpilePackages: ["lucide-react"],

  // Standard React safety checks
  reactStrictMode: true,

  // --- BUILD OPTIMIZATION ---
  // Generates a unique ID for every build to prevent stale cache 
  // errors like "Module factory not available"
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },

  // --- CACHE CONTROL ---
  // Prevents the browser from caching outdated JS chunks during development
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

  // --- IMAGE OPTIMIZATION ---
  // Allows you to display external images (like user avatars or links)
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