const DEFAULT_SITE_URL = 'https://goldenchocobotracker.vercel.app';

/**
 * Returns the canonical public base URL without a trailing slash.
 * Override with `NEXT_PUBLIC_SITE_URL` in Vercel if/when migrating to a custom domain.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, '');
  }
  return DEFAULT_SITE_URL;
}
