import React from 'react';
import { AFFILIATE_DISCLOSURE_BANNER } from '@/lib/affiliate';

export default function AffiliateDisclosure() {
  return (
    <aside
      role="note"
      aria-label="Affiliate disclosure"
      className="w-full bg-yellow-400 text-chocobo-dark text-center text-xs sm:text-sm font-semibold px-4 py-2.5 border-b-2 border-yellow-600"
    >
      <strong>Affiliate Disclosure:</strong> {AFFILIATE_DISCLOSURE_BANNER}
    </aside>
  );
}
