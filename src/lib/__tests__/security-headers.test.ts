import { describe, expect, it } from 'vitest';
import {
  buildContentSecurityPolicy,
  buildImageRemotePatterns,
  buildSecurityHeaders,
  parseHttpsOrigin,
} from '@/lib/security-headers.mjs';

describe('security headers & image host allowlist', () => {
  it('parses valid HTTPS origins and rejects HTTP or malformed URLs', () => {
    expect(parseHttpsOrigin('https://cdn.chocobo.gg/uploads/')).toEqual({
      protocol: 'https',
      hostname: 'cdn.chocobo.gg',
      origin: 'https://cdn.chocobo.gg',
    });
    expect(parseHttpsOrigin('http://insecure.example.com')).toBeNull();
    expect(parseHttpsOrigin('not-a-url')).toBeNull();
    expect(parseHttpsOrigin('')).toBeNull();
  });

  it('eliminates wildcard image hostnames and appends custom R2 domains cleanly', () => {
    const basePatterns = buildImageRemotePatterns(null);
    expect(basePatterns.some((p) => p.hostname === '**')).toBe(false);
    expect(basePatterns.map((p) => p.hostname)).toEqual([
      '**.r2.dev',
      '**.r2.cloudflarestorage.com',
    ]);

    const withCustom = buildImageRemotePatterns('https://media.goldenchocobotracker.com/bucket');
    expect(withCustom.map((p) => p.hostname)).toContain('media.goldenchocobotracker.com');

    // Does not duplicate default R2 suffixes
    const withR2Dev = buildImageRemotePatterns('https://pub-1234.r2.dev');
    expect(withR2Dev).toHaveLength(2);
  });

  it('builds a strict production CSP without unsafe-eval and with HTTPS upgrades on Vercel', () => {
    const prodCsp = buildContentSecurityPolicy({
      isDev: false,
      isHttpsDeployment: true,
      r2PublicBaseUrl: 'https://media.goldenchocobotracker.com',
    });

    expect(prodCsp).not.toContain("'unsafe-eval'");
    expect(prodCsp).toContain("frame-ancestors 'none'");
    expect(prodCsp).toContain("object-src 'none'");
    expect(prodCsp).toContain('https://challenges.cloudflare.com');
    expect(prodCsp).toContain('https://va.vercel-scripts.com');
    expect(prodCsp).toContain('https://media.goldenchocobotracker.com');
    expect(prodCsp).toContain('upgrade-insecure-requests');
  });

  it('allows unsafe-eval only in dev and omits HSTS/upgrade-insecure-requests on local HTTP', () => {
    const devHeaders = buildSecurityHeaders({ isDev: true, isHttpsDeployment: false });
    const csp = devHeaders.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).not.toContain('upgrade-insecure-requests');
    expect(devHeaders.find((h) => h.key === 'Strict-Transport-Security')).toBeUndefined();

    const prodHeaders = buildSecurityHeaders({ isDev: false, isHttpsDeployment: true });
    expect(prodHeaders.find((h) => h.key === 'Strict-Transport-Security')?.value).toContain(
      'max-age=63072000'
    );
    expect(prodHeaders.find((h) => h.key === 'X-Frame-Options')?.value).toBe('DENY');
    expect(prodHeaders.find((h) => h.key === 'X-Content-Type-Options')?.value).toBe('nosniff');
    expect(prodHeaders.find((h) => h.key === 'Referrer-Policy')?.value).toBe(
      'strict-origin-when-cross-origin'
    );
  });
});
