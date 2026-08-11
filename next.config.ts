import type { NextConfig } from "next";

// Gunakan cara ini agar lebih kompatibel saat build
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
});

const nextConfig: NextConfig = {
  /* konfigurasi next.js lainnya */
};

export default withPWA(nextConfig);