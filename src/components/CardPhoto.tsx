'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CardPhotoProps {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  loading?: 'eager' | 'lazy';
  quality?: number;
  fallbackSerial?: string;
}

/**
 * Refined Fantasy Ledger image wrapper around `next/image`.
 * - Priority (above-the-fold LCP) images render immediately at full opacity with zero fade penalty.
 * - Below-the-fold lazy images show a subtle warm espresso shimmer until loaded, then cross-fade smoothly.
 * - Falls back gracefully to a styled serial placeholder if a network hiccup occurs.
 */
export default function CardPhoto({
  src,
  alt,
  sizes,
  priority = false,
  loading,
  quality = 75,
  fallbackSerial,
}: CardPhotoProps) {
  const [loaded, setLoaded] = useState(priority);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-chocobo-recessed text-center p-3 select-none">
        {fallbackSerial && (
          <span className="font-display text-xl font-bold text-chocobo-gold/80 tabular-nums">
            #{fallbackSerial}
          </span>
        )}
        <span className="text-[11px] uppercase tracking-wider text-chocobo-muted mt-1">
          Image Unavailable
        </span>
      </div>
    );
  }

  return (
    <>
      {!loaded && <div aria-hidden="true" className="absolute inset-0 ledger-shimmer" />}
      <Image
        src={src}
        alt={alt}
        fill
        quality={quality}
        priority={priority}
        loading={priority ? undefined : loading}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`object-contain transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
}
