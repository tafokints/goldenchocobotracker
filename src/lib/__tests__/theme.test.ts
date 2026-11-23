import { describe, expect, it } from 'vitest';
import {
  buildTrackerThemeCssVars,
  parseHexColor,
  resolveTrackerPalette,
} from '@/lib/theme';

describe('per-tracker theme palette derivation', () => {
  it('parses valid 6-digit hex colors and rejects invalid strings', () => {
    expect(parseHexColor('#E07A2F')).toEqual({ r: 224, g: 122, b: 47 });
    expect(parseHexColor('invalid')).toBeNull();
    expect(parseHexColor('#fff')).toBeNull();
  });

  it('preserves explicit Middle-earth obsidian & ember theme tokens', () => {
    const vars = buildTrackerThemeCssVars({
      accentHex: '#E07A2F',
      accentBrightHex: '#F4A259',
      bgHex: '#111014',
      surfaceHex: '#1B181E',
      recessedHex: '#0B0A0D',
      fgHex: '#F4EFEA',
      mutedHex: '#ACA39E',
    }) as Record<string, string>;

    expect(vars['--theme-accent-rgb']).toBe('224 122 47');
    expect(vars['--theme-bg-rgb']).toBe('17 16 20');
    expect(vars['--theme-surface-rgb']).toBe('27 24 30');
    expect(vars['--theme-recessed-rgb']).toBe('11 10 13');
    expect(vars['--theme-muted-rgb']).toBe('172 163 158');
  });

  it('automatically derives surface, recessed, muted, and bright shades from 3 base hex colors', () => {
    const palette = resolveTrackerPalette({
      accentHex: '#38BDF8',
      bgHex: '#0F172A',
      fgHex: '#F1F5F9',
    });

    expect(palette.accentHex).toBe('#38BDF8');
    expect(palette.surfaceHex).not.toBe(palette.bgHex);
    expect(palette.recessedHex).not.toBe(palette.bgHex);
    expect(palette.accentBrightHex).not.toBe(palette.accentHex);
    expect(palette.mutedHex).toMatch(/^#[0-9A-F]{6}$/);
  });
});
