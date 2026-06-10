import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { domains: ["firebasestorage.googleapis.com"] },
  // Disable static optimization for dynamic Firebase pages
  experimental: {},
};

export default nextConfig;
