import { describe, expect, it } from 'vitest';
import {
  AFFILIATE_DISCLOSURE_BANNER,
  AFFILIATE_DISCLOSURE_SHORT,
  COMMUNITY_RESOURCE_LINKS,
  FEATURED_AFFILIATE_LINKS,
  isAffiliateUrl,
  resolveCardLinks,
} from '@/lib/affiliate';

describe('affiliate compliance helpers', () => {
  it('contains mandatory verbatim Amazon Associates disclosure alongside EPN and TCGplayer', () => {
    const requiredAmazonStatement = 'As an Amazon Associate I earn from qualifying purchases.';
    expect(AFFILIATE_DISCLOSURE_BANNER).toContain(requiredAmazonStatement);
    expect(AFFILIATE_DISCLOSURE_BANNER).toContain('eBay Partner Network');
    expect(AFFILIATE_DISCLOSURE_BANNER).toContain('TCGplayer');
    expect(AFFILIATE_DISCLOSURE_SHORT).toContain(requiredAmazonStatement);
  });

  it('separates friend community links from commercial affiliate links', () => {
    expect(FEATURED_AFFILIATE_LINKS.every((l) => l.url !== 'https://bit.ly/4kqjKd6')).toBe(true);
    expect(COMMUNITY_RESOURCE_LINKS.some((l) => l.url === 'https://bit.ly/4kqjKd6')).toBe(true);
  });

  it('classifies legacy eBay EPN card links as affiliate marketplace links', () => {
    const resolved = resolveCardLinks({
      link: 'https://www.ebay.com/itm/406051967653?campid=5339113954&mkevt=1',
    });
    expect(resolved.pullSourceUrl).toBeNull();
    expect(resolved.marketplaceUrl).toContain('ebay.com');
    expect(resolved.marketplaceLabel).toBe('eBay');
    expect(resolved.isMarketplaceAffiliate).toBe(true);
  });

  it('classifies Instagram pull links as non-affiliate pull sources', () => {
    const resolved = resolveCardLinks({
      link: 'https://www.instagram.com/p/DLJPL2WviUe/',
    });
    expect(resolved.pullSourceUrl).toBe('https://www.instagram.com/p/DLJPL2WviUe/');
    expect(resolved.marketplaceUrl).toBeNull();
    expect(resolved.isMarketplaceAffiliate).toBe(false);
  });

  it('strips unsafe javascript: links defensively', () => {
    expect(isAffiliateUrl('javascript:alert(1)')).toBe(false);
    const resolved = resolveCardLinks({
      link: 'javascript:alert(1)',
      sourceUrl: 'javascript:alert(2)',
      marketplaceUrl: 'javascript:alert(3)',
    });
    expect(resolved.pullSourceUrl).toBeNull();
    expect(resolved.marketplaceUrl).toBeNull();
  });
});
