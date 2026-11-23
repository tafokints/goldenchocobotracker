import React from 'react';
import {
  AFFILIATE_DISCLOSURE_SHORT,
  COMMUNITY_RESOURCE_LINKS,
  FEATURED_AFFILIATE_LINKS,
} from '@/lib/affiliate';

export default function AffiliateLinks() {
  return (
    <div className="w-full pt-8 space-y-8">
      <section
        aria-labelledby="shop-mtg-ff-heading"
        className="bg-chocobo-surface border border-chocobo-gold/25 rounded-lg p-5 sm:p-6 space-y-4"
      >
        <div className="text-center space-y-1">
          <h2
            id="shop-mtg-ff-heading"
            className="font-display text-xl sm:text-2xl font-bold text-chocobo-gold"
          >
            Shop MTG &times; Final Fantasy Sealed &amp; Singles
          </h2>
          <p
            role="note"
            className="max-w-3xl mx-auto text-xs text-chocobo-muted bg-[#2A2013] border border-chocobo-gold/30 rounded px-3.5 py-2"
          >
            {AFFILIATE_DISCLOSURE_SHORT}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FEATURED_AFFILIATE_LINKS.map((link) => (
            <a
              key={link.name}
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

      {COMMUNITY_RESOURCE_LINKS.length > 0 && (
        <section aria-labelledby="community-resources-heading" className="text-center space-y-3">
          <h2
            id="community-resources-heading"
            className="font-display text-lg font-bold text-chocobo-gold/90"
          >
            Community Resources
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {COMMUNITY_RESOURCE_LINKS.map((resource) => (
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
