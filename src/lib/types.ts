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
