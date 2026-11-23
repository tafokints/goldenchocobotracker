'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[GlobalErrorBoundary]', {
      message: error.message,
      digest: error.digest ?? null,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          backgroundColor: '#1B1612',
          color: '#F6EFE4',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        <main
          role="alert"
          style={{
            maxWidth: '30rem',
            width: '100%',
            backgroundColor: '#241D17',
            border: '1px solid rgba(214, 167, 61, 0.4)',
            borderRadius: '0.5rem',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: '0 0 0.5rem',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#D6A73D',
              fontWeight: 600,
            }}
          >
            Golden Chocobo Tracker
          </p>
          <h1
            style={{
              margin: '0 0 0.75rem',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#F6EFE4',
            }}
          >
            Unable to Render Page
          </h1>
          <p
            style={{
              margin: '0 0 1.5rem',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: '#B5A694',
            }}
          >
            An unexpected error interrupted this page. Reload or try again in a moment.
          </p>
          {error.digest && (
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.75rem', color: '#B5A694' }}>
              Reference ID: <code>{error.digest}</code>
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                backgroundColor: '#D6A73D',
                color: '#1B1612',
                border: 'none',
                borderRadius: '0.375rem',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              style={{
                backgroundColor: 'transparent',
                color: '#D6A73D',
                border: '1px solid rgba(214, 167, 61, 0.5)',
                borderRadius: '0.375rem',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go Home
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
