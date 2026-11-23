import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-config';
import { TOTAL_CHOCOBO_CARDS } from '@/lib/validation';

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    ...cardPages,
  ];
}
