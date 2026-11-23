import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Submit a Find or Update',
  description:
    'Community submissions for Golden Chocobo serialized card discoveries, reported sales, grading updates, and photos.',
  alternates: {
    canonical: '/submit',
  },
};

export default function SubmitPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-xl bg-chocobo-dark border border-chocobo-gold rounded-lg p-8 space-y-6 text-center">
        <h1 className="text-3xl font-bold text-chocobo-gold">Submit a Find or Update</h1>
        <p className="text-chocobo-light/90 leading-relaxed">
          We are upgrading our community submission system with verified proof links, photo
          uploads, and spam protection so every new pull, sale, and grading update can be
          reviewed quickly without risking vandalism.
        </p>
        <p className="text-sm text-chocobo-light/75">
          Track maintainers can sign in directly through the Admin Dashboard to record verified
          updates right away.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            href="/"
            className="bg-chocobo-gold hover:bg-yellow-400 text-chocobo-dark font-bold py-2.5 px-5 rounded transition-colors"
          >
            &larr; Back to Tracker
          </Link>
          <Link
            href="/admin"
            className="border border-chocobo-gold hover:bg-chocobo-gold/15 text-chocobo-gold font-semibold py-2.5 px-5 rounded transition-colors"
          >
            Admin Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
