import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { formatGradingDisplay } from '@/lib/grading';
import { getIconicLabel } from '@/lib/iconic-numbers';
import { computeCardStats } from '@/lib/stats';
import { getCards } from '@/lib/tracker-store';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const view = searchParams.get('view') || 'home';
  const cardParam = searchParams.get('card');

  const cards = await getCards();
  const stats = computeCardStats(cards);

  if (cardParam) {
    const id = parseInt(cardParam, 10);
    const card = Number.isInteger(id) ? cards.find((c) => c.id === id) : undefined;
    if (card) {
      const padded = card.id.toString().padStart(2, '0');
      const iconic = getIconicLabel(card.id);

      return new ImageResponse(
        (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '56px 64px',
              background: 'linear-gradient(135deg, #1a1410 0%, #2b2117 60%, #1a1410 100%)',
              color: '#FFF8F0',
              fontFamily: 'Georgia, serif',
              border: '8px solid #D6A73D',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 28, color: '#D6A73D', fontWeight: 700, letterSpacing: 2 }}>
                GOLDEN CHOCOBO TRACKER
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  padding: '8px 20px',
                  borderRadius: 10,
                  background: card.found ? 'rgba(22, 101, 52, 0.8)' : 'rgba(55, 65, 81, 0.8)',
                  color: card.found ? '#86EFAC' : '#D1D5DB',
                }}
              >
                {card.found ? 'FOUND' : 'UNPULLED'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 82, fontWeight: 700, color: '#D6A73D', lineHeight: 1 }}>
                #{padded} / 77
              </div>
              {iconic && (
                <div style={{ fontSize: 30, color: '#FDE047', fontWeight: 700 }}>
                  ★ {iconic}
                </div>
              )}
              <div style={{ fontSize: 30, color: '#FFF8F0', opacity: 0.92 }}>
                {card.found
                  ? `Pulled by ${card.foundBy || 'Unknown'}${card.dateFound ? ` on ${card.dateFound}` : ''}`
                  : 'This serialized MTG × Final Fantasy copy has not been reported yet.'}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '2px solid rgba(214, 167, 61, 0.35)',
                paddingTop: 24,
                fontSize: 26,
              }}
            >
              <div style={{ display: 'flex', gap: 40 }}>
                {typeof card.price === 'number' && (
                  <div style={{ color: '#4ADE80', fontWeight: 700 }}>
                    Sale: ${card.price.toLocaleString()}
                  </div>
                )}
                {card.grading && (
                  <div style={{ color: '#60A5FA', fontWeight: 700 }}>
                    {formatGradingDisplay(card.grading)}
                  </div>
                )}
              </div>
              <div style={{ color: '#D6A73D' }}>
                {stats.foundCount}/77 Found ({stats.foundPercentage.toFixed(1)}%)
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }
  }

  const latestPull = stats.recentDiscoveries[0];
  const headline =
    view === 'stats' ? 'Market & Pull Statistics' : 'MTG × Final Fantasy Serialized Tracker';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          background: 'linear-gradient(135deg, #1a1410 0%, #2d2316 55%, #17120e 100%)',
          color: '#FFF8F0',
          fontFamily: 'Georgia, serif',
          border: '8px solid #D6A73D',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 24, color: '#D6A73D', letterSpacing: 3, fontWeight: 700 }}>
            {headline.toUpperCase()}
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, color: '#FFF8F0', lineHeight: 1.05 }}>
            Golden Chocobo Tracker
          </div>
        </div>

        {/* Live Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 34, fontWeight: 700 }}>
            <div style={{ color: '#D6A73D' }}>
              {stats.foundCount} / {stats.totalCards} Found
            </div>
            <div style={{ color: '#FDE047' }}>{stats.foundPercentage.toFixed(1)}%</div>
          </div>
          <div
            style={{
              width: '100%',
              height: 28,
              background: 'rgba(255, 248, 240, 0.16)',
              borderRadius: 14,
              border: '2px solid #D6A73D',
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(2, stats.foundPercentage))}%`,
                height: '100%',
                background: '#D6A73D',
              }}
            />
          </div>
        </div>

        {/* KPI Strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '2px solid rgba(214, 167, 61, 0.35)',
            paddingTop: 26,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, color: 'rgba(255,248,240,0.7)' }}>MEDIAN SALE</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#4ADE80' }}>
              {stats.medianPrice > 0 ? `$${Math.round(stats.medianPrice).toLocaleString()}` : 'N/A'}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, color: 'rgba(255,248,240,0.7)' }}>REMAINING UNPULLED</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#D6A73D' }}>
              {stats.remainingCount} Cards
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, color: 'rgba(255,248,240,0.7)' }}>GRADED POP</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#60A5FA' }}>
              {stats.gradingStats.totalGraded} Graded
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, color: 'rgba(255,248,240,0.7)' }}>LATEST FIND</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#FFF8F0' }}>
              {latestPull ? `#${latestPull.id.toString().padStart(2, '0')}` : '—'}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}
