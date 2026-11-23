import AffiliateLinks from '@/components/AffiliateLinks';
import LatestActivityStrip from '@/components/LatestActivityStrip';
import ProgressBar from '@/components/ProgressBar';
import TrackerGrid from '@/components/TrackerGrid';
import { buildRecentActivity } from '@/lib/activity';
import { getSiteUrl } from '@/lib/site-config';
import { getCards } from '@/lib/tracker-store';

export const revalidate = 300;

export default async function HomePage() {
  const cards = await getCards();
  const recentActivity = buildRecentActivity(cards, { limit: 6 });

  const foundCount = cards.filter((card) => card.found).length;
  const totalCount = cards.length;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Golden Chocobo Tracker',
    description:
      "Track all 77 serialized Golden Chocobo cards from Magic: The Gathering's Final Fantasy collaboration",
    url: getSiteUrl(),
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-8 space-y-3 sm:space-y-4">
        {/* Compact Hero + Progress Band */}
        <section
          aria-label="Golden Chocobo discovery progress"
          className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-4 items-center bg-chocobo-surface border border-chocobo-gold/25 rounded-lg px-3.5 py-3 sm:px-5 sm:py-4"
        >
          <div className="lg:col-span-6 space-y-0.5">
            <h1 className="font-display text-xl sm:text-3xl font-bold tracking-wide text-chocobo-gold leading-tight">
              Golden Chocobo Tracker
            </h1>
            <p className="text-xs sm:text-sm text-chocobo-muted">
              Serialized /77 Traveling Chocobo &middot; Magic: The Gathering &times; Final Fantasy
            </p>
          </div>
          <div className="lg:col-span-6">
            <ProgressBar current={foundCount} total={totalCount} />
          </div>
        </section>

        {/* Collapsible Single-Row Latest Activity Ticker */}
        <LatestActivityStrip events={recentActivity} />

        {/* Unified Dark Toolbar + Grid / 1-77 Wall */}
        <TrackerGrid initialCards={cards} />

        <AffiliateLinks />
      </main>
    </>
  );
}
