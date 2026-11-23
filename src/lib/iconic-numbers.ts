export const GOLDEN_CHOCOBO_ICONIC_NUMBERS: Record<number, string> = {
  1: 'First Print (#01)',
  7: 'FFVII Grail',
  8: 'FFVIII',
  9: 'FFIX',
  10: 'FFX',
  14: 'FFXIV',
  16: 'FFXVI',
  69: 'Collector Favorite',
  77: 'Final Bookend (#77)',
};

export function normalizeIconicMap(
  custom?: Record<string, string> | null,
  fallback: Record<number, string> = GOLDEN_CHOCOBO_ICONIC_NUMBERS
): Record<number, string> {
  if (!custom || Object.keys(custom).length === 0) {
    return fallback;
  }

  const normalized: Record<number, string> = {};
  for (const [key, label] of Object.entries(custom)) {
    const num = parseInt(key, 10);
    if (Number.isInteger(num) && num > 0 && label.trim()) {
      normalized[num] = label.trim();
    }
  }
  return Object.keys(normalized).length > 0 ? normalized : fallback;
}

export function getIconicLabel(
  serialNumber: number,
  iconicMap: Record<number, string> = GOLDEN_CHOCOBO_ICONIC_NUMBERS
): string | null {
  return iconicMap[serialNumber] ?? null;
}

export function isIconicNumber(
  serialNumber: number,
  iconicMap: Record<number, string> = GOLDEN_CHOCOBO_ICONIC_NUMBERS
): boolean {
  return Boolean(iconicMap[serialNumber]);
}
