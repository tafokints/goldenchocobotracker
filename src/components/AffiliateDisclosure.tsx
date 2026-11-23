import React from 'react';
import { AFFILIATE_DISCLOSURE_BANNER } from '@/lib/affiliate';

export default function AffiliateDisclosure() {
  return (
    <aside
      role="note"
      aria-label="Affiliate disclosure"
      style={{ backgroundColor: 'var(--theme-disclosure-bg, #2A2013)' }}
      className="w-full text-chocobo-light/95 text-center text-[10.5px] sm:text-xs leading-[1.35] sm:leading-snug px-3 sm:px-4 py-1.5 sm:py-2 border-b border-chocobo-gold/40"
    >
      <div className="max-w-6xl mx-auto">
        <strong className="text-chocobo-gold font-semibold">Affiliate Disclosure:</strong>{' '}
        {AFFILIATE_DISCLOSURE_BANNER}
      </div>
    </aside>
  );
}
