import type { NextConfig } from "next";

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
});

const nextConfig: NextConfig = {
  // Tambahkan baris ini sesuai petunjuk error Next.js
  turbopack: {},
};

export default withPWA(nextConfig);