import { describe, expect, it } from 'vitest';
import { buildRecentActivity } from '@/lib/activity';
import { cardsToCsv, escapeCsvCell } from '@/lib/csv';
import { getGradingCertUrl } from '@/lib/grading-certs';
import { getIconicLabel, isIconicNumber, normalizeIconicMap } from '@/lib/iconic-numbers';
import { buildRssXml, escapeXml } from '@/lib/rss';
import type { ResolvedCard } from '@/lib/types';

describe('grading cert verification URLs', () => {
  it('builds verified lookup URLs for PSA, CGC, BGS, and TAG', () => {
    expect(getGradingCertUrl('PSA', '104829104')).toBe('https://www.psacard.com/cert/104829104');
    expect(getGradingCertUrl('CGC', '#4321001')).toBe('https://www.cgccards.com/certlookup/4321001/');
    expect(getGradingCertUrl('BGS', '0016223344')).toContain('beckett.com/grading/card-lookup');
    expect(getGradingCertUrl('TAG', 'A12345')).toBe('https://my.taggrading.com/card/A12345');
  });

  it('rejects unsafe or malformed cert numbers and unknown services', () => {
    expect(getGradingCertUrl('PSA', '1234/../../evil')).toBeNull();
    expect(getGradingCertUrl('PSA', 'javascript:alert(1)')).toBeNull();
    expect(getGradingCertUrl('UNKNOWN', '123456')).toBeNull();
  });
});

describe('iconic numbers & grail config', () => {
  it('identifies Golden Chocobo iconic numbers and supports custom tracker maps', () => {
    expect(getIconicLabel(7)).toBe('FFVII Grail');
    expect(isIconicNumber(77)).toBe(true);
    expect(isIconicNumber(42)).toBe(false);

    const custom = normalizeIconicMap({ '300': 'Final Elven Ring' });
    expect(getIconicLabel(300, custom)).toBe('Final Elven Ring');
    expect(getIconicLabel(7, custom)).toBeNull();
  });
});

describe('CSV export & formula injection protection', () => {
  it('neutralizes spreadsheet formula prefixes and escapes commas/quotes', () => {
    expect(escapeCsvCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
    expect(escapeCsvCell('+1+1')).toBe("'+1+1");
    expect(escapeCsvCell('-cmd')).toBe("'-cmd");
    expect(escapeCsvCell('@SUM(A1:A2)')).toBe("'@SUM(A1:A2)");
    expect(escapeCsvCell('Alice, "The Collector"')).toBe('"Alice, ""The Collector"""');
  });

  it('exports card headers and rows cleanly', () => {
    const cards: ResolvedCard[] = [
      {
        id: 7,
        name: 'Golden Chocobo #07',
        found: true,
        foundBy: 'Cloud',
        dateFound: '2026-01-15',
        pullChannel: 'lgs',
        region: 'Japan',
        price: 120000,
        priceDate: '2026-01-20',
        priceHistory: [{ price: 120000, date: '2026-01-20' }],
        grading: { service: 'PSA', grade: 10, certNumber: '99988877' },
        resolvedImage: null,
      },
    ];

    const csv = cardsToCsv(cards);
    expect(csv).toContain('serial_number,name,iconic_tag');
    expect(csv).toContain('7,Golden Chocobo #07,FFVII Grail,Found,Cloud,2026-01-15,Local Game Store (LGS),Japan,120000');
  });
});

describe('activity feed & RSS 2.0 XML builder', () => {
  it('escapes XML special characters and builds valid RSS 2.0 channel', () => {
    expect(escapeXml('MTG & <FF> "77"')).toBe('MTG &amp; &lt;FF&gt; &quot;77&quot;');

    const cards: ResolvedCard[] = [
      {
        id: 7,
        name: 'Golden Chocobo #07',
        found: true,
        foundBy: 'A&B <Games>',
        dateFound: '2026-02-01',
        price: 150000,
        priceDate: '2026-02-05',
        priceHistory: [{ price: 150000, date: '2026-02-05' }],
        resolvedImage: null,
      },
    ];

    const events = buildRecentActivity(cards, { limit: 5 });
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('sale');
    expect(events[1].type).toBe('pull');

    const xml = buildRssXml({
      siteUrl: 'https://goldenchocobotracker.vercel.app',
      title: 'Golden Chocobo Tracker',
      description: 'Live pulls & sales',
      events,
    });
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('A&amp;B &lt;Games&gt;');
    expect(xml).toContain('https://goldenchocobotracker.vercel.app/card/07');
  });
});
