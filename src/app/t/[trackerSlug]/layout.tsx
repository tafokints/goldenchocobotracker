import type { ReactNode } from 'react';
import AffiliateDisclosure from '@/components/AffiliateDisclosure';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { getHydratedTracker } from '@/lib/multi-tracker';
import { buildTrackerThemeCssVars } from '@/lib/theme';

interface TrackerLayoutProps {
  children: ReactNode;
  params: Promise<{ trackerSlug: string }>;
}

export default async function TrackerLayout({ children, params }: TrackerLayoutProps) {
  const { trackerSlug } = await params;
  const tracker = await getHydratedTracker(trackerSlug);

  if (!tracker || !tracker.isPublished) {
    return (
      <div className="min-h-screen flex flex-col bg-chocobo-dark text-chocobo-light">
        <AffiliateDisclosure />
        <SiteHeader />
        <div className="flex-1 flex flex-col">{children}</div>
        <SiteFooter />
      </div>
    );
  }

  const themeVars = buildTrackerThemeCssVars(tracker.themeConfig);
  const brandTitle = tracker.themeConfig.brandTitle || tracker.name;
  const baseHref = `/t/${tracker.slug}`;

  return (
    <div
      style={themeVars}
      className="min-h-screen flex flex-col bg-chocobo-dark text-chocobo-light"
    >
      <AffiliateDisclosure />
      <SiteHeader
        brandName={brandTitle}
        brandHref={baseHref}
        navItems={[
          { href: baseHref, label: 'Tracker', matchExact: true },
          { href: `${baseHref}/stats`, label: 'Stats' },
          { href: '/hub', label: 'All Trackers' },
        ]}
        submitHref={`${baseHref}/submit`}
        submitLabel="Submit Update"
      />
      <div className="flex-1 flex flex-col">{children}</div>
      <SiteFooter
        brandTitle={tracker.name}
        tagline={`${tracker.setName} · Community-verified serialized ledger.`}
        trackerHref={baseHref}
        statsHref={`${baseHref}/stats`}
        submitHref={`${baseHref}/submit`}
        showExportLinks={false}
        ipNotice={tracker.themeConfig.ipNotice}
      />
    </div>
  );
}
