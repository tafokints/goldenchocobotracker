import { NextRequest, NextResponse } from 'next/server';
import {
  normalizeHost,
  parseHubDomains,
  parseStaticDomainMap,
  resolveHostRoute,
  shouldBypassMiddleware,
} from '@/lib/routing';

const PRIMARY_DEFAULT_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'goldenchocobotracker.vercel.app',
  'goldenchocobotracker.com',
]);

async function lookupCustomDomainInRedis(host: string): Promise<string | null> {
  const baseUrl = (
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    ''
  ).replace(/\/+$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!baseUrl || !token) return null;

  try {
    const key = encodeURIComponent(`tracker:domain:${host}`);
    const res = await fetch(`${baseUrl}/get/${key}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: unknown };
    if (typeof data.result === 'string' && /^[a-z0-9-]+$/.test(data.result)) {
      return data.result;
    }
    return null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (shouldBypassMiddleware(pathname)) {
    return NextResponse.next();
  }

  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const host = normalizeHost(rawHost);

  if (!host) {
    return NextResponse.next();
  }

  const hubDomains = parseHubDomains(process.env.NEXT_PUBLIC_HUB_DOMAINS);

  // Fast path: default Golden Chocobo hosts and local dev never incur a Redis lookup
  if (!hubDomains.has(host) && (PRIMARY_DEFAULT_HOSTS.has(host) || host.endsWith('.vercel.app'))) {
    const staticMap = parseStaticDomainMap(process.env.CUSTOM_DOMAIN_MAP);
    const matched = staticMap[host] ?? null;
    const decision = resolveHostRoute({ host, pathname, hubDomains, matchedTrackerSlug: matched });
    if (decision.action === 'rewrite' && decision.destination) {
      const url = request.nextUrl.clone();
      url.pathname = decision.destination;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  let matchedTrackerSlug: string | null = null;
  if (!hubDomains.has(host)) {
    const staticMap = parseStaticDomainMap(process.env.CUSTOM_DOMAIN_MAP);
    matchedTrackerSlug = staticMap[host] ?? (await lookupCustomDomainInRedis(host));
  }

  const decision = resolveHostRoute({
    host,
    pathname,
    hubDomains,
    matchedTrackerSlug,
  });

  if (decision.action === 'rewrite' && decision.destination) {
    const url = request.nextUrl.clone();
    url.pathname = decision.destination;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
