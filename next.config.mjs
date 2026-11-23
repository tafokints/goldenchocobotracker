/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // WebP encodes ~10x faster than AVIF on cold regional Edge POPs while keeping thumbnails tiny
    formats: ['image/webp'],
    // Keep optimized card thumbnails cached at Vercel Edge for 31 days
    minimumCacheTTL: 2678400,
    // Tailored breakpoints so 220px card thumbnails on 2x DPR pick 384w/512w instead of 640w
    imageSizes: [192, 256, 384, 512],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
