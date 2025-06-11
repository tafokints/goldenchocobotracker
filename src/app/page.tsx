import { Redis } from '@upstash/redis';
import { ChocoboCard } from "../lib/types";
import Link from "next/link";
import AffiliateLinks from "../components/AffiliateLinks";
import ReportButton from '@/components/ReportButton';

const redis = Redis.fromEnv();

export default async function Home() {
  const cards: ChocoboCard[] = (await redis.get('chocobo-cards')) || [];

  const foundCards = cards.filter((card) => card.found);
  const foundCount = foundCards.length;
  const totalCount = cards.length;

  const lastFoundCard = foundCards.sort((a, b) => {
    if (!a.dateFound || !b.dateFound) return 0;
    return new Date(b.dateFound).getTime() - new Date(a.dateFound).getTime();
  })[0];

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-12">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-2xl md:text-4xl font-bold text-chocobo-gold mb-4 lg:mb-0">
          Golden Chocobo Tracker
        </h1>
        <ReportButton />
      </div>

      <div className="w-full max-w-5xl mt-6 text-center bg-chocobo-dark bg-opacity-75 p-4 rounded-lg">
        <h2 className="text-2xl font-bold text-chocobo-gold">
          {foundCount} / {totalCount} Found
        </h2>
        {lastFoundCard && (
          <p className="text-chocobo-light mt-2">
            Last find: #{lastFoundCard.id.toString().padStart(2, '0')} by {lastFoundCard.foundBy} on {lastFoundCard.dateFound}
          </p>
        )}
      </div>

      <div className="w-full max-w-5xl mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="border border-chocobo-gold rounded-lg p-4 bg-chocobo-dark shadow-[0_0_15px_rgba(214,167,61,0.5)] flex flex-col">
              <h2 className="text-lg font-bold text-chocobo-gold">#{card.id.toString().padStart(2, '0')}</h2>
              <div className="flex-grow">
                <p className={`font-bold ${card.found ? "text-yellow-400" : "text-gray-400"}`}>
                  {card.found ? "Found" : "Not Found"}
                </p>
                {card.found && (
                  <div className="text-sm mt-2 text-chocobo-light">
                    <p>Found by: {card.foundBy}</p>
                    <p>Date: {card.dateFound}</p>
                    {card.link && <a href={card.link} target="_blank" rel="noopener noreferrer" className="text-chocobo-gold hover:underline">Source</a>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AffiliateLinks />
    </main>
  );
}
