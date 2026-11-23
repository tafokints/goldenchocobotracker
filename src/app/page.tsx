import Link from 'next/link';
import AffiliateLinks from '@/components/AffiliateLinks';
import ProgressBar from '@/components/ProgressBar';
import TrackerGrid from '@/components/TrackerGrid';
import { getResolvedCards } from '@/lib/redis-cards';
import { getSiteUrl } from '@/lib/site-config';

export const revalidate = 300;

export default async function HomePage() {
  const cards = await getResolvedCards();

  const foundCards = cards.filter((card) => card.found);
  const foundCount = foundCards.length;
  const totalCount = cards.length;

  const lastFoundCard = [...foundCards]
    .filter((card) => Boolean(card.dateFound))
    .sort((a, b) => new Date(b.dateFound!).getTime() - new Date(a.dateFound!).getTime())[0];

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
      <main className="flex min-h-screen flex-col items-center p-6 md:p-12">
        <header className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex flex-wrap gap-4">
          <h1 className="text-2xl md:text-4xl font-bold text-chocobo-gold">
            Golden Chocobo Tracker
          </h1>
          <nav className="flex items-center space-x-5" aria-label="Main navigation">
            <Link
              href="/stats"
              className="text-chocobo-gold hover:text-yellow-400 transition-colors font-semibold"
            >
              Stats
            </Link>
            <Link
              href="/submit"
              className="text-chocobo-gold hover:text-yellow-400 transition-colors font-semibold"
            >
              Submit Update
            </Link>
          </nav>
        </header>

        <section
          aria-label="Discovery progress"
          className="w-full max-w-5xl mt-6 text-center bg-chocobo-dark/75 p-6 rounded-lg border border-chocobo-gold/30"
        >
          <ProgressBar current={foundCount} total={totalCount} />
          {lastFoundCard && (
            <p className="text-chocobo-light mt-4 text-sm">
              Last find:{' '}
              <Link
                href={`/card/${lastFoundCard.id.toString().padStart(2, '0')}`}
                className="text-chocobo-gold hover:underline font-semibold"
              >
                #{lastFoundCard.id.toString().padStart(2, '0')}
              </Link>{' '}
              by {lastFoundCard.foundBy} on {lastFoundCard.dateFound}
            </p>
          )}
        </section>

        <TrackerGrid initialCards={cards} />

        <AffiliateLinks />
      </main>
    </>
  );
}
