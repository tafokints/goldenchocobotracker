import type { CSSProperties } from 'react';
import type { TrackerThemeConfig } from '@/db/schema';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export const DEFAULT_CHOCOBO_THEME: Required<
  Pick<
    TrackerThemeConfig,
    'accentHex' | 'accentBrightHex' | 'bgHex' | 'surfaceHex' | 'recessedHex' | 'fgHex' | 'mutedHex'
  >
> = {
  accentHex: '#D6A73D',
  accentBrightHex: '#E8C468',
  bgHex: '#1B1612',
  surfaceHex: '#241D17',
  recessedHex: '#16120E',
  fgHex: '#F6EFE4',
  mutedHex: '#B5A694',
};

export function parseHexColor(hex: string | undefined | null): RgbColor | null {
  if (!hex || typeof hex !== 'string') return null;
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function mixRgb(a: RgbColor, b: RgbColor, weightB: number): RgbColor {
  const w = Math.max(0, Math.min(1, weightB));
  return {
    r: Math.round(a.r * (1 - w) + b.r * w),
    g: Math.round(a.g * (1 - w) + b.g * w),
    b: Math.round(a.b * (1 - w) + b.b * w),
  };
}

export function rgbToTriplet(c: RgbColor): string {
  return `${c.r} ${c.g} ${c.b}`;
}

export function rgbToHex(c: RgbColor): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`.toUpperCase();
}

export interface ResolvedTrackerPalette {
  accentHex: string;
  accentBrightHex: string;
  bgHex: string;
  surfaceHex: string;
  recessedHex: string;
  fgHex: string;
  mutedHex: string;
  disclosureBgHex: string;
}

/**
 * Resolves a complete high-contrast dark-ledger color system from any tracker's `themeConfig`.
 * Honors explicit palette overrides when set, and derives balanced surface/recessed/muted/bright
 * shades automatically when only the 3 base hex colors (`accentHex`, `bgHex`, `fgHex`) are given.
 */
export function resolveTrackerPalette(theme?: Partial<TrackerThemeConfig> | null): ResolvedTrackerPalette {
  const accent = parseHexColor(theme?.accentHex) ?? parseHexColor(DEFAULT_CHOCOBO_THEME.accentHex)!;
  const bg = parseHexColor(theme?.bgHex) ?? parseHexColor(DEFAULT_CHOCOBO_THEME.bgHex)!;
  const fg = parseHexColor(theme?.fgHex) ?? parseHexColor(DEFAULT_CHOCOBO_THEME.fgHex)!;

  const white: RgbColor = { r: 255, g: 255, b: 255 };
  const black: RgbColor = { r: 0, g: 0, b: 0 };

  const accentBright =
    parseHexColor(theme?.accentBrightHex) ?? mixRgb(accent, white, 0.24);
  const surface =
    parseHexColor(theme?.surfaceHex) ?? mixRgb(bg, white, 0.055);
  const recessed =
    parseHexColor(theme?.recessedHex) ?? mixRgb(bg, black, 0.28);
  const muted =
    parseHexColor(theme?.mutedHex) ?? mixRgb(fg, bg, 0.3);
  const disclosureBg = mixRgb(bg, accent, 0.09);

  return {
    accentHex: rgbToHex(accent),
    accentBrightHex: rgbToHex(accentBright),
    bgHex: rgbToHex(bg),
    surfaceHex: rgbToHex(surface),
    recessedHex: rgbToHex(recessed),
    fgHex: rgbToHex(fg),
    mutedHex: rgbToHex(muted),
    disclosureBgHex: rgbToHex(disclosureBg),
  };
}

/**
 * Produces inline CSS custom properties that re-theme every Tailwind `chocobo-*` utility token
 * (including alpha modifiers like `/25`, `/45`, `/80`) cleanly inside a tracker route subtree.
 */
export function buildTrackerThemeCssVars(theme?: Partial<TrackerThemeConfig> | null): CSSProperties {
  const palette = resolveTrackerPalette(theme);
  const accent = parseHexColor(palette.accentHex)!;
  const accentBright = parseHexColor(palette.accentBrightHex)!;
  const bg = parseHexColor(palette.bgHex)!;
  const surface = parseHexColor(palette.surfaceHex)!;
  const recessed = parseHexColor(palette.recessedHex)!;
  const fg = parseHexColor(palette.fgHex)!;
  const muted = parseHexColor(palette.mutedHex)!;

  return {
    '--theme-accent-rgb': rgbToTriplet(accent),
    '--theme-accent-bright-rgb': rgbToTriplet(accentBright),
    '--theme-bg-rgb': rgbToTriplet(bg),
    '--theme-surface-rgb': rgbToTriplet(surface),
    '--theme-recessed-rgb': rgbToTriplet(recessed),
    '--theme-fg-rgb': rgbToTriplet(fg),
    '--theme-muted-rgb': rgbToTriplet(muted),
    '--theme-disclosure-bg': palette.disclosureBgHex,
    '--tracker-accent': palette.accentHex,
    '--tracker-bg': palette.bgHex,
    '--tracker-fg': palette.fgHex,
  } as CSSProperties;
}
