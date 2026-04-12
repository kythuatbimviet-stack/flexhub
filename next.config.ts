import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone mode for Docker
  output: 'standalone',
  // Tách TypeScript check ra khỏi build để tránh OOM.
  // Chạy `npm run type-check` riêng để kiểm tra lỗi type.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
  // [SEC] HTTP Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Control referrer info
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions Policy: disable unused browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Force HTTPS for 1 year (enable in production)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Basic Content Security Policy
          // NOTE: Adjust 'script-src' and 'connect-src' if you add third-party scripts
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed by Next.js dev mode
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.google.com https://lh3.googleusercontent.com https://img.vietqr.io",
              "connect-src 'self' https://*.supabase.co https://api.resend.com wss://*.supabase.co",
              "frame-src 'self' https://docs.google.com https://drive.google.com",
              "object-src 'self' https://docs.google.com https://drive.google.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
