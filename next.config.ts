import type { NextConfig } from "next";

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
});

const nextConfig: NextConfig = {
  // Biarkan kosong atau tambahkan konfigurasi standar Next.js jika diperlukan
};

export default withPWA(nextConfig);