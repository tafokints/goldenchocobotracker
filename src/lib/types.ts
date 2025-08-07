export interface PriceHistoryEntry {
  price: number;
  date: string;
  soldBy?: string;
  soldTo?: string;
}

export interface GradingInfo {
  service: string;
  grade: number;
  dateGraded?: string;
}

export interface ChocoboCard {
  id: number;
  name: string;
  found: boolean;
  foundBy?: string;
  dateFound?: string;
  link?: string;
  image?: string;
  price?: number;
  priceDate?: string;
  priceHistory: PriceHistoryEntry[];
  grading?: GradingInfo;
} 