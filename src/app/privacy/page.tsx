import type { Metadata } from 'next';
import Link from 'next/link';
import { AFFILIATE_DISCLOSURE_BANNER } from '@/lib/affiliate';

export const metadata: Metadata = {
  title: 'Privacy, Cookies & Affiliate Disclosures',
  description:
    'How Golden Chocobo Tracker handles analytics, community submissions, EXIF stripping, affiliate disclosures, and intellectual property notices.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <main className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-10">
      <article className="max-w-3xl mx-auto bg-chocobo-surface border border-chocobo-gold/25 rounded-lg p-5 sm:p-8 space-y-6">
        <header className="border-b border-chocobo-gold/20 pb-4 space-y-1.5">
          <p className="text-xs uppercase tracking-widest font-semibold text-chocobo-gold">
            Trust &amp; Transparency
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-chocobo-gold">
            Privacy, Cookies &amp; Disclosures
          </h1>
          <p className="text-xs sm:text-sm text-chocobo-muted">
            Plain-English summary of how this community ledger operates and protects contributor
            privacy.
          </p>
        </header>

        <section className="space-y-2 text-sm text-chocobo-light/90 leading-relaxed">
          <h2 className="font-display text-lg font-bold text-chocobo-gold">
            1. Affiliate Program Disclosures
          </h2>
          <div className="bg-[#2A2013] border border-chocobo-gold/35 rounded-md p-3.5 text-xs sm:text-sm text-chocobo-light">
            <strong className="text-chocobo-gold">Disclosure:</strong> {AFFILIATE_DISCLOSURE_BANNER}
          </div>
          <p>
            Commercial shopping links (such as Amazon, TCGplayer, and eBay Partner Network links)
            are explicitly labeled <strong className="text-chocobo-light">(Paid Link)</strong> and
            use <code className="text-chocobo-gold text-xs">rel=&quot;sponsored&quot;</code>.
            Non-affiliate community tools (such as the Deck Builder under Community Resources) are
            kept clearly separated and earn no referral fee.
          </p>
        </section>

        <section className="space-y-2 text-sm text-chocobo-light/90 leading-relaxed">
          <h2 className="font-display text-lg font-bold text-chocobo-gold">
            2. Analytics &amp; Performance Telemetry
          </h2>
          <p>
            We use privacy-focused <strong className="text-chocobo-light">Vercel Web Analytics</strong>{' '}
            and <strong className="text-chocobo-light">Vercel Speed Insights</strong> to measure
            aggregate page traffic and Core Web Vitals (LCP, CLS, INP). We do not run third-party
            advertising trackers, do not build cross-site ad profiles, and never sell user data.
          </p>
        </section>

        <section className="space-y-2 text-sm text-chocobo-light/90 leading-relaxed">
          <h2 className="font-display text-lg font-bold text-chocobo-gold">
            3. Community Submissions &amp; Photo Privacy
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-chocobo-light/90">
            <li>
              <strong className="text-chocobo-light">Bot Protection:</strong> The{' '}
              <Link href="/submit" className="text-chocobo-gold hover:underline">
                Submit Update
              </Link>{' '}
              form uses Cloudflare Turnstile to block automated spam without intrusive puzzles.
            </li>
            <li>
              <strong className="text-chocobo-light">Rate Limiting:</strong> To prevent abuse, the
              submission API hashes incoming IP addresses with a server-side secret salt (SHA-256)
              for short-lived sliding-window rate limits. Raw IP addresses are never stored in our
              database.
            </li>
            <li>
              <strong className="text-chocobo-light">EXIF &amp; GPS Stripping:</strong> Every
              uploaded card photo is decoded, resized, re-encoded to WebP, and stripped of all
              EXIF, camera, and GPS location metadata before storage.
            </li>
            <li>
              <strong className="text-chocobo-light">Quarantine &amp; Deletion:</strong> Unreviewed
              photos stay in a private quarantine bucket until an admin approves them; rejected
              uploads are deleted from storage.
            </li>
          </ul>
        </section>

        <section className="space-y-2 text-sm text-chocobo-light/90 leading-relaxed">
          <h2 className="font-display text-lg font-bold text-chocobo-gold">
            4. Admin Authentication
          </h2>
          <p>
            Public visitors never need an account or login cookie. Site moderators authenticate
            solely via GitHub OAuth against an allowlisted administrator list using encrypted
            HTTP-only session cookies.
          </p>
        </section>

        <section className="space-y-2 text-sm text-chocobo-light/90 leading-relaxed">
          <h2 className="font-display text-lg font-bold text-chocobo-gold">
            5. Unofficial Fan Project Notice
          </h2>
          <p>
            Golden Chocobo Tracker is an independent, community-maintained collector ledger. It is
            not affiliated with, endorsed, sponsored, or specifically approved by{' '}
            <strong className="text-chocobo-light">Wizards of the Coast LLC</strong> or{' '}
            <strong className="text-chocobo-light">Square Enix Co., Ltd.</strong> Magic: The
            Gathering, Final Fantasy, and Chocobo are trademarks of their respective owners.
          </p>
        </section>

        <footer className="pt-4 border-t border-chocobo-gold/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link href="/" className="text-chocobo-gold hover:underline font-medium py-1">
            &larr; Back to Golden Chocobo Tracker
          </Link>
          <Link href="/methodology" className="text-chocobo-light hover:text-chocobo-gold py-1">
            Read Verification Methodology &rarr;
          </Link>
        </footer>
      </article>
    </main>
  );
}
