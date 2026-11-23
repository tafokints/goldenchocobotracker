'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Renders the default Golden Chocobo chrome (top disclosure, header, footer) on non-`/t/*` routes.
 * Individual `/t/[trackerSlug]/*` routes render their own motif-themed chrome via `src/app/t/[trackerSlug]/layout.tsx`.
 */
export default function DefaultSiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/t/')) {
    return null;
  }
  return <>{children}</>;
}
