export interface ParsedHttpsOrigin {
  protocol: 'https';
  hostname: string;
  origin: string;
}

export interface RemotePattern {
  protocol: 'https';
  hostname: string;
}

export interface SecurityHeaderOptions {
  isDev?: boolean;
  isHttpsDeployment?: boolean;
  r2PublicBaseUrl?: string | null;
}

export interface SecurityHeaderEntry {
  key: string;
  value: string;
}

export function parseHttpsOrigin(rawUrl: string | undefined | null): ParsedHttpsOrigin | null;
export function buildImageRemotePatterns(r2PublicBaseUrl?: string | null): RemotePattern[];
export function buildContentSecurityPolicy(options?: SecurityHeaderOptions): string;
export function buildSecurityHeaders(options?: SecurityHeaderOptions): SecurityHeaderEntry[];
