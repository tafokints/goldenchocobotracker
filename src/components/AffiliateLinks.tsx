import React from 'react';
import {
  AFFILIATE_DISCLOSURE_SHORT,
  COMMUNITY_RESOURCE_LINKS,
  FEATURED_AFFILIATE_LINKS,
} from '@/lib/affiliate';

export default function AffiliateLinks() {
  return (
    <div className="w-full max-w-5xl mt-12 space-y-10">
      <section aria-labelledby="shop-mtg-ff-heading">
        <h2
          id="shop-mtg-ff-heading"
          className="text-2xl font-bold text-center mb-3 text-chocobo-gold"
        >
          Shop MTG &times; Final Fantasy Sealed &amp; Singles
        </h2>
        <p
          role="note"
          className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-950 rounded text-xs sm:text-sm text-center"
        >
          {AFFILIATE_DISCLOSURE_SHORT}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURED_AFFILIATE_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 bg-chocobo-dark border border-chocobo-gold hover:bg-chocobo-gold hover:text-chocobo-dark text-chocobo-gold font-bold py-3 px-4 rounded text-center transition-colors"
            >
              <span>{link.name}</span>
              <span className="text-xs font-normal opacity-90">
                Shop on {link.merchant} (Paid Link)
              </span>
            </a>
          ))}
        </div>
      </section>

      {COMMUNITY_RESOURCE_LINKS.length > 0 && (
        <section
          aria-labelledby="community-resources-heading"
          className="border-t border-chocobo-gold/30 pt-8"
        >
          <h2
            id="community-resources-heading"
            className="text-xl font-bold text-center mb-3 text-chocobo-gold"
          >
            Community Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-center">
            {COMMUNITY_RESOURCE_LINKS.map((resource) => (
              <a
                key={resource.name}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1 bg-chocobo-dark/80 border border-chocobo-gold/50 hover:border-chocobo-gold text-chocobo-light font-semibold py-3 px-4 rounded text-center transition-colors"
              >
                <span className="text-chocobo-gold">{resource.name}</span>
                <span className="text-xs text-chocobo-light/80">{resource.description}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
