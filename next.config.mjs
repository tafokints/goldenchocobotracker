import { buildImageRemotePatterns, buildSecurityHeaders } from './src/lib/security-headers.mjs';

const isDev = process.env.NODE_ENV !== 'production';
const isHttpsDeployment =
  process.env.VERCEL === '1' || process.env.FORCE_HTTPS_HEADERS === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    // WebP encodes ~10x faster than AVIF on cold regional Edge POPs while keeping thumbnails tiny
    formats: ['image/webp'],
    // Keep optimized card thumbnails cached at Vercel Edge for 31 days
    minimumCacheTTL: 2678400,
    // Tailored breakpoints so 220px card thumbnails on 2x DPR pick 384w/512w instead of 640w
    imageSizes: [192, 256, 384, 512],
    // Strict allowlist — eliminates wildcard open image proxy billing/SSRF abuse
    remotePatterns: buildImageRemotePatterns(process.env.R2_PUBLIC_BASE_URL),
  },
  async redirects() {
    return [
      {
        source: '/card/:id([1-9])',
        destination: '/card/0:id',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: buildSecurityHeaders({
          isDev,
          isHttpsDeployment,
          r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
        }),
      },
      {
        source: '/api/health',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ];
  },
};

export default nextConfig;
