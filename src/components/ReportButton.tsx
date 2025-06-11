'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useKonamiCode } from '@/hooks/useKonamiCode';

export default function ReportButton() {
  const [showSubmit, setShowSubmit] = useState(false);

  useKonamiCode(() => setShowSubmit(true));

  if (!showSubmit) {
    return null;
  }

  return (
    <Link href="/submit" className="bg-chocobo-gold hover:bg-yellow-400 text-chocobo-dark font-bold py-2 px-4 rounded">
      Report a Find
    </Link>
  );
} 