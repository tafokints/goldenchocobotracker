/**
 * Shared HTTP security header & Next.js image remotePatterns builders.
 * Kept as pure ESM (.mjs) so both `next.config.mjs` and Vitest unit tests share the exact same logic.
 */

/**
 * Safely extracts `{ protocol, hostname, origin }` from an optional HTTPS URL string.
 * @param {string | undefined | null} rawUrl
 */
export function parseHttpsOrigin(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return null;
    return {
      protocol: 'https',
      hostname: parsed.hostname,
      origin: parsed.origin,
    };
  } catch {
    return null;
  }
}

/**
 * Builds strict `next/image` `remotePatterns` scoped only to Cloudflare R2
 * (public dev buckets, presigned admin preview hosts, and optional custom `R2_PUBLIC_BASE_URL`).
 * Eliminates the open wildcard `hostname: '**'` proxy vector.
 *
 * @param {string | undefined | null} r2PublicBaseUrl
 */
export function buildImageRemotePatterns(r2PublicBaseUrl) {
  const patterns = [
    { protocol: 'https', hostname: '**.r2.dev' },
    { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
  ];

  const custom = parseHttpsOrigin(r2PublicBaseUrl);
  if (
    custom &&
    !custom.hostname.endsWith('.r2.dev') &&
    !custom.hostname.endsWith('.r2.cloudflarestorage.com')
  ) {
    patterns.push({ protocol: 'https', hostname: custom.hostname });
  }

  return patterns;
}

/**
 * Builds an ISR-safe Content-Security-Policy tailored for Next.js App Router,
 * Vercel Analytics/Speed Insights, Cloudflare Turnstile, GitHub OAuth, and Cloudflare R2.
 *
 * @param {{ isDev?: boolean; isHttpsDeployment?: boolean; r2PublicBaseUrl?: string | null }} [options]
 */
export function buildContentSecurityPolicy(options = {}) {
  const { isDev = false, isHttpsDeployment = false, r2PublicBaseUrl = null } = options;

  const customR2 = parseHttpsOrigin(r2PublicBaseUrl);

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    'https://challenges.cloudflare.com',
    'https://va.vercel-scripts.com',
  ];

  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    'https://*.r2.dev',
    'https://*.r2.cloudflarestorage.com',
    ...(customR2 ? [customR2.origin] : []),
  ];

  const connectSrc = [
    "'self'",
    'https://challenges.cloudflare.com',
    'https://vitals.vercel-insights.com',
    'https://va.vercel-scripts.com',
    ...(customR2 ? [customR2.origin] : []),
  ];

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc.join(' ')}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    'frame-src https://challenges.cloudflare.com',
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://github.com",
    ...(isHttpsDeployment ? ['upgrade-insecure-requests'] : []),
  ];

  return directives.join('; ');
}

/**
 * Returns the full set of enterprise HTTP security headers applied by `next.config.mjs`.
 *
 * @param {{ isDev?: boolean; isHttpsDeployment?: boolean; r2PublicBaseUrl?: string | null }} [options]
 */
export function buildSecurityHeaders(options = {}) {
  const { isDev = false, isHttpsDeployment = false, r2PublicBaseUrl = null } = options;

  const headers = [
    {
      key: 'Content-Security-Policy',
      value: buildContentSecurityPolicy({ isDev, isHttpsDeployment, r2PublicBaseUrl }),
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    },
  ];

  if (isHttpsDeployment) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  }

  return headers;
}
