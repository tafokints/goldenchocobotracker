import type { ActivityEvent } from '@/lib/activity';

export function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildRssXml(input: {
  siteUrl: string;
  title: string;
  description: string;
  events: ActivityEvent[];
}): string {
  const cleanSiteUrl = input.siteUrl.replace(/\/+$/, '');
  const feedUrl = `${cleanSiteUrl}/feed.xml`;
  const lastBuildDate =
    input.events[0] && !Number.isNaN(input.events[0].timestamp)
      ? new Date(input.events[0].timestamp).toUTCString()
      : new Date().toUTCString();

  const itemsXml = input.events
    .map((ev) => {
      const link = `${cleanSiteUrl}/card/${ev.paddedId}`;
      const pubDate = new Date(ev.timestamp).toUTCString();
      const titleText = ev.iconicLabel ? `${ev.title} (${ev.iconicLabel})` : ev.title;

      return [
        '    <item>',
        `      <title>${escapeXml(titleText)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="false">${escapeXml(ev.id)}</guid>`,
        `      <pubDate>${escapeXml(pubDate)}</pubDate>`,
        `      <description>${escapeXml(ev.summary)}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(input.title)}</title>`,
    `    <link>${escapeXml(cleanSiteUrl)}</link>`,
    `    <description>${escapeXml(input.description)}</description>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    `    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>`,
    itemsXml,
    '  </channel>',
    '</rss>',
  ].join('\n');
}
