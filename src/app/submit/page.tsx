import type { Metadata } from 'next';
import Link from 'next/link';
import SubmissionForm from '@/components/SubmissionForm';
import { hasDatabaseEnv, type SubmissionType } from '@/db';
import { hasR2Env } from '@/lib/r2';
import { DEFAULT_SERIES_SLUG, DEFAULT_TRACKER_SLUG } from '@/lib/tracker-store';

export const metadata: Metadata = {
  title: 'Submit a Find or Update',
  description:
    'Report a newly discovered Golden Chocobo card, verified sale price, grading update, or card photo for community review.',
  alternates: {
    canonical: '/submit',
  },
};

const VALID_TYPES = new Set<SubmissionType>([
  'new_find',
  'price_sale',
  'grading_update',
  'photo_upload',
  'correction',
]);

interface SubmitPageProps {
  searchParams: Promise<{ card?: string; type?: string }>;
}

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const params = await searchParams;
  const parsedCard = params.card ? parseInt(params.card, 10) : undefined;
  const initialSerial =
    parsedCard && Number.isInteger(parsedCard) && parsedCard >= 1 && parsedCard <= 77
      ? parsedCard
      : undefined;
  const initialType =
    params.type && VALID_TYPES.has(params.type as SubmissionType)
      ? (params.type as SubmissionType)
      : 'new_find';

  const submissionsReady = hasDatabaseEnv();
  const uploadsEnabled = submissionsReady && hasR2Env();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || undefined;

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12">
      <header className="w-full max-w-xl flex items-center justify-between mb-6 gap-4 text-sm font-mono">
        <Link href="/" className="text-chocobo-gold hover:text-yellow-400 transition-colors">
          &larr; Back to Tracker
        </Link>
        <Link href="/admin" className="text-chocobo-light/70 hover:text-chocobo-gold text-xs">
          Admin
        </Link>
      </header>

      <div className="w-full max-w-xl text-center mb-6 space-y-2">
        <h1 className="text-3xl font-bold text-chocobo-gold">Submit a Find or Update</h1>
        <p className="text-sm text-chocobo-light/85">
          No account needed. Every submission is reviewed by a maintainer before going live to keep
          tracker data accurate and spam-free.
        </p>
      </div>

      <SubmissionForm
        trackerSlug={DEFAULT_TRACKER_SLUG}
        seriesSlug={DEFAULT_SERIES_SLUG}
        serialMin={1}
        serialMax={77}
        seriesName="Golden Chocobo"
        initialSerial={initialSerial}
        initialType={initialType}
        turnstileSiteKey={turnstileSiteKey}
        uploadsEnabled={uploadsEnabled}
        submissionsReady={submissionsReady}
      />
    </main>
  );
}
