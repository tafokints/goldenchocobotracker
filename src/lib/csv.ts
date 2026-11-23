import { resolveCardLinks } from '@/lib/affiliate';
import { GOLDEN_CHOCOBO_ICONIC_NUMBERS, getIconicLabel } from '@/lib/iconic-numbers';
import { PULL_CHANNEL_LABELS, type ResolvedCard } from '@/lib/types';

/**
 * Escapes a CSV cell per RFC 4180 and neutralizes Excel/Sheets formula injection
 * (cells starting with =, +, -, @, tab, or carriage return).
 */
export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  let str = String(value);

  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function cardsToCsv(
  cards: ResolvedCard[],
  iconicMap: Record<number, string> = GOLDEN_CHOCOBO_ICONIC_NUMBERS
): string {
  const headers = [
    'serial_number',
    'name',
    'iconic_tag',
    'status',
    'found_by',
    'date_found',
    'pull_channel',
    'region',
    'latest_sale_usd',
    'latest_sale_date',
    'recorded_sales_count',
    'grading_service',
    'grade',
    'cert_number',
    'date_graded',
    'pull_source_url',
  ];

  const rows = cards.map((card) => {
    const { pullSourceUrl } = resolveCardLinks(card);
    return [
      card.id,
      card.name,
      getIconicLabel(card.id, iconicMap) || '',
      card.found ? 'Found' : 'Not Found',
      card.foundBy || '',
      card.dateFound || '',
      card.pullChannel ? PULL_CHANNEL_LABELS[card.pullChannel] : '',
      card.region || '',
      typeof card.price === 'number' ? card.price : '',
      card.priceDate || '',
      card.priceHistory?.length || 0,
      card.grading?.service || '',
      card.grading?.grade ?? '',
      card.grading?.certNumber || '',
      card.grading?.dateGraded || '',
      pullSourceUrl || '',
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}
