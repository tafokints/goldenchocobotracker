import React from 'react';
import {
  AFFILIATE_DISCLOSURE_SHORT,
  type AffiliateProductLink,
  type CommunityResourceLink,
} from '@/lib/affiliate';

interface TrackerAffiliateSectionProps {
  setName: string;
  affiliateLinksEnabled: boolean;
  affiliateLinks: AffiliateProductLink[];
  communityLinks: CommunityResourceLink[];
}

export default function TrackerAffiliateSection({
  setName,
  affiliateLinksEnabled,
  affiliateLinks,
  communityLinks,
}: TrackerAffiliateSectionProps) {
  const showAffiliateSection = affiliateLinksEnabled && affiliateLinks.length > 0;
  const showCommunitySection = communityLinks.length > 0;

  if (!showAffiliateSection && !showCommunitySection) {
    return null;
  }

  return (
    <div className="w-full pt-8 space-y-8">
      {showAffiliateSection && (
        <section
          aria-labelledby="tracker-shop-heading"
          className="bg-chocobo-surface border border-chocobo-gold/25 rounded-lg p-5 sm:p-6 space-y-4"
        >
          <div className="text-center space-y-1">
            <h2
              id="tracker-shop-heading"
              className="font-display text-xl sm:text-2xl font-bold text-chocobo-gold"
            >
              Shop {setName} Sealed &amp; Singles
            </h2>
            <p
              role="note"
              className="max-w-3xl mx-auto text-xs text-chocobo-muted border border-chocobo-gold/30 rounded px-3.5 py-2"
              style={{ backgroundColor: 'var(--theme-disclosure-bg, #2A2013)' }}
            >
              {AFFILIATE_DISCLOSURE_SHORT}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {affiliateLinks.map((link) => (
              <a
                key={`${link.merchant}-${link.name}`}
                href={link.url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1 bg-chocobo-recessed border border-chocobo-gold/40 hover:border-chocobo-gold hover:bg-chocobo-gold hover:text-chocobo-dark text-chocobo-gold font-semibold py-3 px-4 rounded-md text-center transition-colors group"
              >
                <span className="text-sm">{link.name}</span>
                <span className="text-xs font-normal text-chocobo-muted group-hover:text-chocobo-dark/85">
                  Shop on {link.merchant} (Paid Link)
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {showCommunitySection && (
        <section aria-labelledby="tracker-community-heading" className="text-center space-y-3">
          <h2
            id="tracker-community-heading"
            className="font-display text-lg font-bold text-chocobo-gold/90"
          >
            Community Resources
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {communityLinks.map((resource) => (
              <a
                key={resource.name}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full max-w-sm flex flex-col items-center justify-center gap-1 bg-chocobo-surface border border-chocobo-gold/25 hover:border-chocobo-gold/60 text-chocobo-light py-3 px-5 rounded-md text-center transition-colors"
              >
                <span className="text-sm font-semibold text-chocobo-gold">{resource.name}</span>
                <span className="text-xs text-chocobo-muted">{resource.description}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
