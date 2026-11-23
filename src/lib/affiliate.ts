import type { ChocoboCard } from './types';

/**
 * Mandatory site-wide affiliate disclosure combining Amazon Associates' exact verbatim statement
 * with eBay Partner Network (EPN), TCGplayer (Impact), and FTC guidelines.
 */
export const AFFILIATE_DISCLOSURE_BANNER =
  'As an Amazon Associate I earn from qualifying purchases. We also participate in the eBay Partner Network and the TCGplayer Affiliate Program, and may earn commissions from qualifying purchases made through links on this site at no extra cost to you.';

export const AFFILIATE_DISCLOSURE_SHORT =
  'Disclosure: As an Amazon Associate I earn from qualifying purchases. Links below are paid affiliate links (Amazon, TCGplayer, eBay Partner Network) and we may earn a commission on qualifying purchases at no extra cost to you.';

export interface AffiliateProductLink {
  name: string;
  merchant: 'Amazon' | 'TCGplayer' | 'eBay';
  url: string;
}

export interface CommunityResourceLink {
  name: string;
  description: string;
  url: string;
}

export const FEATURED_AFFILIATE_LINKS: AffiliateProductLink[] = [
  {
    name: "Final Fantasy Collector's Boxes",
    merchant: 'Amazon',
    url: 'https://amzn.to/4kAIv6n',
  },
  {
    name: 'Final Fantasy Boxes & Singles',
    merchant: 'TCGplayer',
    url: 'https://partner.tcgplayer.com/WyLbG3',
  },
  {
    name: 'MTG Final Fantasy Listings',
    merchant: 'eBay',
    url: 'https://ebay.us/MZ8psC',
  },
];

/**
 * Non-affiliate friend / community links kept visually separate from commercial affiliate links.
 */
export const COMMUNITY_RESOURCE_LINKS: CommunityResourceLink[] = [
  {
    name: 'Magic: The Gathering Deck Builder',
    description: 'Community tool built by a friend (non-affiliate link)',
    url: 'https://bit.ly/4kqjKd6',
  },
];

const AFFILIATE_HOST_PATTERNS = [
  /(^|\.)ebay\.com$/i,
  /(^|\.)ebay\.us$/i,
  /(^|\.)amzn\.to$/i,
  /(^|\.)amazon\./i,
  /^partner\.tcgplayer\.com$/i,
];

const AFFILIATE_PARAM_KEYS = ['campid', 'mkevt', 'mkcid', 'tag'];

export function isAffiliateUrl(rawUrl?: string | null): boolean {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    if (AFFILIATE_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname))) {
      return true;
    }
    return AFFILIATE_PARAM_KEYS.some((key) => parsed.searchParams.has(key));
  } catch {
    return false;
  }
}

export function isSafeHttpUrl(rawUrl?: string | null): rawUrl is string {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface ResolvedCardLinks {
  pullSourceUrl: string | null;
  marketplaceUrl: string | null;
  marketplaceLabel: string;
  isMarketplaceAffiliate: boolean;
}

/**
 * Separates pull-proof links from commercial marketplace links, including backward-compatible
 * classification of legacy `card.link` records stored in Redis.
 */
export function resolveCardLinks(card: Pick<ChocoboCard, 'link' | 'sourceUrl' | 'marketplaceUrl' | 'marketplaceLabel'>): ResolvedCardLinks {
  const explicitSource = isSafeHttpUrl(card.sourceUrl) ? card.sourceUrl : null;
  const explicitMarketplace = isSafeHttpUrl(card.marketplaceUrl) ? card.marketplaceUrl : null;

  let pullSourceUrl = explicitSource;
  let marketplaceUrl = explicitMarketplace;

  if (isSafeHttpUrl(card.link)) {
    if (isAffiliateUrl(card.link)) {
      if (!marketplaceUrl) {
        marketplaceUrl = card.link;
      }
    } else if (!pullSourceUrl) {
      pullSourceUrl = card.link;
    }
  }

  let marketplaceLabel = card.marketplaceLabel?.trim() || 'Marketplace';
  if (!card.marketplaceLabel && marketplaceUrl) {
    const lower = marketplaceUrl.toLowerCase();
    if (lower.includes('ebay.com') || lower.includes('ebay.us')) {
      marketplaceLabel = 'eBay';
    } else if (lower.includes('tcgplayer.com')) {
      marketplaceLabel = 'TCGplayer';
    } else if (lower.includes('amazon.') || lower.includes('amzn.to')) {
      marketplaceLabel = 'Amazon';
    }
  }

  return {
    pullSourceUrl,
    marketplaceUrl,
    marketplaceLabel,
    isMarketplaceAffiliate: isAffiliateUrl(marketplaceUrl),
  };
}
