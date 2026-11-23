import { NextResponse } from 'next/server';
import { buildRecentActivity } from '@/lib/activity';
import { buildRssXml } from '@/lib/rss';
import { getSiteUrl } from '@/lib/site-config';
import { getCards } from '@/lib/tracker-store';

export async function GET() {
  try {
    const cards = await getCards();
    const events = buildRecentActivity(cards, { limit: 25 });
    const xml = buildRssXml({
      siteUrl: getSiteUrl(),
      title: 'Golden Chocobo Tracker — Live Pulls, Sales & Grades',
      description:
        'Verified discoveries, reported sales, and grading milestones for all 77 serialized Golden Chocobo cards from MTG × Final Fantasy.',
      events,
    });

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new NextResponse('Error generating feed', { status: 500 });
  }
}
