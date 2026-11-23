import type { GradingInfo } from './types';

export const COMMON_GRADE_LABELS = [
  'Pristine 10',
  'Black Label 10',
  'Gold Label 10',
  'Gem Mint 10',
  'Perfect 10',
  'MBA Gold Diamond',
  'MBA Black Diamond',
  'MBA Silver Diamond',
] as const;

export type GradingDisplayInput = Pick<GradingInfo, 'service' | 'grade'> & {
  gradeLabel?: string | null;
};

const INLINE_TIER_RE =
  /^(pristine|black label|gold label|gem mint|mint|perfect|pristine black label|pristine gold label)$/i;

/**
 * Formats a card's grading info into a collector-friendly display label.
 *
 * Examples:
 * - { service: 'CGC', grade: 10, gradeLabel: 'Pristine 10' }      -> "CGC Pristine 10"
 * - { service: 'CGC', grade: 10, gradeLabel: 'Pristine' }         -> "CGC Pristine 10"
 * - { service: 'BGS', grade: 10, gradeLabel: 'Black Label 10' }   -> "BGS Black Label 10"
 * - { service: 'PSA', grade: 10, gradeLabel: 'MBA Gold Diamond' } -> "PSA 10 · MBA Gold Diamond"
 * - { service: 'PSA', grade: 8 }                                  -> "PSA 8"
 */
export function formatGradingDisplay(grading: GradingDisplayInput | null | undefined): string {
  if (!grading) return '';

  const service = grading.service.trim();
  const gradeStr = String(grading.grade);
  const base = service ? `${service} ${gradeStr}` : gradeStr;

  const rawLabel = grading.gradeLabel?.trim();
  if (!rawLabel) {
    return base;
  }

  // Avoid repeating the grading service if a user typed it into gradeLabel (e.g. "CGC Pristine 10")
  let label = rawLabel;
  if (service) {
    const escapedService = service.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    label = label.replace(new RegExp(`^${escapedService}\\s+`, 'i'), '').trim();
    if (!label) {
      return base;
    }
  }

  // If the label already includes the numeric grade (e.g. "Pristine 10", "Black Label 10", "Gem Mint 10"),
  // display as "<Service> <Label>" without repeating the grade number.
  const escapedGrade = gradeStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const containsGrade = new RegExp(`(^|\\s)${escapedGrade}($|\\s|[^0-9.])`).test(label);
  if (containsGrade) {
    return service ? `${service} ${label}` : label;
  }

  // Known inline grade tier without the numeric grade (e.g. "Pristine", "Black Label", "Gem Mint")
  if (INLINE_TIER_RE.test(label)) {
    return service ? `${service} ${label} ${gradeStr}` : `${label} ${gradeStr}`;
  }

  // Secondary designation / authentication tier (e.g. "MBA Gold Diamond")
  return `${base} · ${label}`;
}
