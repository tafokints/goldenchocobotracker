import type { MetadataRoute } from 'next';
import { listPublishedTrackers } from '@/lib/multi-tracker';
import { getSiteUrl } from '@/lib/site-config';
import { DEFAULT_TRACKER_SLUG } from '@/lib/tracker-store';
import { TOTAL_CHOCOBO_CARDS } from '@/lib/validation';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const lastModified = new Date();

  const cardPages: MetadataRoute.Sitemap = Array.from({ length: TOTAL_CHOCOBO_CARDS }, (_, i) => {
    const padded = (i + 1).toString().padStart(2, '0');
    return {
      url: `${baseUrl}/card/${padded}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    };
  });

  const extraTrackerPages: MetadataRoute.Sitemap = [];
  try {
    const published = await listPublishedTrackers();
    for (const tracker of published) {
      if (tracker.slug === DEFAULT_TRACKER_SLUG) continue;
      extraTrackerPages.push(
        {
          url: `${baseUrl}/t/${tracker.slug}`,
          lastModified,
          changeFrequency: 'daily',
          priority: 0.9,
        },
        {
          url: `${baseUrl}/t/${tracker.slug}/stats`,
          lastModified,
          changeFrequency: 'daily',
          priority: 0.75,
        }
      );
    }
  } catch {
    // Graceful fallback during static build without DB access
  }

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/hub`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    ...extraTrackerPages,
    ...cardPages,
  ];
}
