/**
 * Formats USD amounts cleanly for compact badges and matrix tiles (e.g., $1.4M, $75k, $8.5k, $950).
 */
export function formatCompactUsd(amount: number): string {
  if (!Number.isFinite(amount)) return '$0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    const formatted = m >= 10 ? Math.round(m).toString() : m.toFixed(1).replace(/\.0$/, '');
    return `${sign}$${formatted}M`;
  }
  if (abs >= 10_000) {
    return `${sign}$${Math.round(abs / 1_000)}k`;
  }
  if (abs >= 1_000) {
    const k = abs / 1_000;
    return `${sign}$${k.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}
