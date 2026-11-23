import type { Metadata } from 'next';
import Link from 'next/link';
import { auth, signIn, signOut } from '@/auth';
import AdminDashboard from '@/components/AdminDashboard';
import { attachResolvedImages } from '@/lib/card-images';
import { readCardsDirect } from '@/lib/redis-cards';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12">
      <header className="w-full max-w-2xl flex items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-chocobo-gold">Admin Dashboard</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-chocobo-gold hover:underline">
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
        </div>
      </header>

      {!session?.user ? (
        <div className="w-full max-w-md bg-chocobo-dark border border-chocobo-gold rounded-lg p-8 text-center space-y-4">
          <p className="text-chocobo-light">
            Sign in with an allowlisted GitHub account to manage Golden Chocobo card records.
          </p>
          <form
            action={async () => {
              'use server';
              await signIn('github', { redirectTo: '/admin' });
            }}
          >
            <button
              type="submit"
              className="w-full bg-chocobo-gold hover:bg-yellow-400 text-chocobo-dark font-bold py-2.5 px-4 rounded transition-colors"
            >
              Sign in with GitHub
            </button>
          </form>
        </div>
      ) : !session.user.isAdmin ? (
        <div className="w-full max-w-md bg-chocobo-dark border border-red-500/70 rounded-lg p-8 text-center space-y-3">
          <h2 className="text-xl font-bold text-red-400">Access Denied</h2>
          <p className="text-sm text-chocobo-light/85">
            Signed in as <strong>{session.user.githubLogin || session.user.email || 'unknown'}</strong>,
            which is not on the <code>ADMIN_GITHUB_IDS</code> / <code>ADMIN_GITHUB_LOGINS</code> allowlist.
          </p>
        </div>
      ) : (
        <AdminDashboard
          initialCards={attachResolvedImages(await readCardsDirect())}
          adminLabel={session.user.githubLogin || session.user.name || 'Admin'}
        />
      )}
    </main>
  );
}
