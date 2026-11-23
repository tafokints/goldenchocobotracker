import type { Metadata } from 'next';
import Link from 'next/link';
import { auth, signIn, signOut } from '@/auth';
import ModerationQueue from '@/components/ModerationQueue';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Submission Moderation Queue',
  robots: { index: false, follow: false },
};

export default async function AdminQueuePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12">
      <header className="w-full max-w-5xl flex flex-wrap items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-chocobo-gold">Moderation Queue</h1>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="text-chocobo-gold hover:underline">
            Card Management
          </Link>
          <Link href="/admin/trackers" className="text-chocobo-gold hover:underline">
            Trackers
          </Link>
          <Link href="/" className="text-chocobo-light/80 hover:text-chocobo-gold">
            &larr; Tracker
          </Link>
          {session?.user && (
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/admin' });
              }}
            >
              <button
                type="submit"
                className="border border-chocobo-gold/60 hover:bg-chocobo-gold/15 text-chocobo-light px-3 py-1 rounded text-xs"
              >
                Sign out
              </button>
            </form>
          )}
        </nav>
      </header>

      {!session?.user ? (
        <div className="w-full max-w-md bg-chocobo-dark border border-chocobo-gold rounded-lg p-8 text-center space-y-4">
          <p className="text-chocobo-light">Sign in with GitHub to review community submissions.</p>
          <form
            action={async () => {
              'use server';
              await signIn('github', { redirectTo: '/admin/queue' });
            }}
          >
            <button
              type="submit"
              className="w-full bg-chocobo-gold hover:bg-yellow-400 text-chocobo-dark font-bold py-2.5 px-4 rounded"
            >
              Sign in with GitHub
            </button>
          </form>
        </div>
      ) : !session.user.isAdmin ? (
        <div className="w-full max-w-md bg-chocobo-dark border border-red-500/70 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-red-400">Access Denied</h2>
        </div>
      ) : (
        <ModerationQueue />
      )}
    </main>
  );
}
