import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tách TypeScript check ra khỏi build để tránh OOM.
  // Chạy `npm run type-check` riêng để kiểm tra lỗi type.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
