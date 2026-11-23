export type PullChannel =
  | 'lgs'
  | 'personal_box'
  | 'breaker'
  | 'retail'
  | 'gift_bundle'
  | 'unknown';

export const PULL_CHANNEL_LABELS: Record<PullChannel, string> = {
  lgs: 'Local Game Store (LGS)',
  personal_box: 'Personal Collector Box',
  breaker: 'Live Breaker / Whatnot',
  retail: 'Big Box Retail',
  gift_bundle: 'Gift / Collector Bundle',
  unknown: 'Unknown / Unspecified',
};

export interface PriceHistoryEntry {
  price: number;
  date: string;
  soldBy?: string;
  soldTo?: string;
  sourceUrl?: string;
}

export interface GradingInfo {
  service: string;
  grade: number;
  dateGraded?: string;
  certNumber?: string;
}

export interface ChocoboCard {
  id: number;
  name: string;
  found: boolean;
  foundBy?: string;
  dateFound?: string;
  /** Optional pull origin channel (LGS, Breaker, Personal Box, Retail, etc.). */
  pullChannel?: PullChannel;
  /** Optional country/region where the card was pulled (e.g., US, Japan, Canada, Europe). */
  region?: string;
  /** Legacy field that may hold either a pull source URL or an eBay listing URL. */
  link?: string;
  /** Explicit non-affiliate pull discovery proof URL (Instagram, Reddit, X, etc.). */
  sourceUrl?: string;
  /** Explicit marketplace / eBay affiliate listing URL. */
  marketplaceUrl?: string;
  /** Display name for the marketplace (e.g., "eBay", "Goldin"). */
  marketplaceLabel?: string;
  image?: string;
  price?: number;
  priceDate?: string;
  priceHistory: PriceHistoryEntry[];
  grading?: GradingInfo | null;
}

export interface ResolvedCard extends ChocoboCard {
  /** Verified image URL if an asset exists, or null if unfound/no image (prevents 404s & CLS). */
  resolvedImage: string | null;
}
