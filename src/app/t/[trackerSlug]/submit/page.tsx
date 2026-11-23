import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SubmissionForm from '@/components/SubmissionForm';
import { hasDatabaseEnv, type SubmissionType } from '@/db';
import { getHydratedTracker } from '@/lib/multi-tracker';
import { hasR2Env } from '@/lib/r2';

interface TrackerSubmitPageProps {
  params: Promise<{ trackerSlug: string }>;
  searchParams: Promise<{ series?: string; card?: string; type?: string }>;
}

const VALID_TYPES = new Set<SubmissionType>([
  'new_find',
  'price_sale',
  'grading_update',
  'photo_upload',
  'correction',
]);

export async function generateMetadata({ params }: TrackerSubmitPageProps): Promise<Metadata> {
  const { trackerSlug } = await params;
  const tracker = await getHydratedTracker(trackerSlug);
  if (!tracker) return { title: 'Submit Update' };

  return {
    title: {
      absolute: `Submit Update — ${tracker.name}`,
    },
    description: `Report a serialized card discovery, sale price, grading update, or photo for ${tracker.name}.`,
  };
}

export default async function DynamicTrackerSubmitPage({
  params,
  searchParams,
}: TrackerSubmitPageProps) {
  const { trackerSlug } = await params;
  const query = await searchParams;
  const tracker = await getHydratedTracker(trackerSlug);

  if (!tracker || !tracker.isPublished || tracker.series.length === 0) {
    notFound();
  }

  const activeSeries =
    (query.series && tracker.series.find((s) => s.slug === query.series)) || tracker.series[0];

  const parsedCard = query.card ? parseInt(query.card, 10) : undefined;
  const initialSerial =
    parsedCard &&
    Number.isInteger(parsedCard) &&
    parsedCard >= activeSeries.serialMin &&
    parsedCard <= activeSeries.serialMax
      ? parsedCard
      : undefined;

  const initialType =
    query.type && VALID_TYPES.has(query.type as SubmissionType)
      ? (query.type as SubmissionType)
      : 'new_find';

  return (
    <main className="flex flex-1 flex-col items-center px-4 sm:px-6 pt-5 pb-10">
      <header className="w-full max-w-xl flex items-center justify-between mb-5 text-xs sm:text-sm">
        <Link
          href={`/t/${tracker.slug}`}
          className="text-chocobo-gold hover:text-chocobo-gold-bright transition-colors"
        >
          &larr; Back to {tracker.name}
        </Link>
      </header>

      <div className="w-full max-w-xl text-center mb-6 space-y-1.5">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-chocobo-gold">
          Submit Update &mdash; {tracker.name}
        </h1>
        <p className="text-xs sm:text-sm text-chocobo-muted">
          All community submissions are reviewed before publishing.
        </p>
      </div>

      {tracker.series.length > 1 && (
        <div className="w-full max-w-xl mb-4 flex flex-wrap justify-center gap-2">
          {tracker.series.map((s) => (
            <Link
              key={s.id}
              href={`/t/${tracker.slug}/submit?series=${encodeURIComponent(s.slug)}`}
              className={`px-3 py-1.5 rounded text-xs font-bold border ${
                s.slug === activeSeries.slug
                  ? 'bg-chocobo-gold text-chocobo-dark border-chocobo-gold'
                  : 'border-chocobo-gold/50 text-chocobo-light hover:border-chocobo-gold'
              }`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      <SubmissionForm
        trackerSlug={tracker.slug}
        seriesSlug={activeSeries.slug}
        serialMin={activeSeries.serialMin}
        serialMax={activeSeries.serialMax}
        seriesName={activeSeries.name}
        initialSerial={initialSerial}
        initialType={initialType}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || undefined}
        uploadsEnabled={hasDatabaseEnv() && hasR2Env()}
        submissionsReady={hasDatabaseEnv()}
      />
    </main>
  );
}
