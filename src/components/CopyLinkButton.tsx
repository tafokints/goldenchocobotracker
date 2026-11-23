'use client';

import { useState } from 'react';

interface CopyLinkButtonProps {
  path: string;
  label?: string;
  className?: string;
}

export default function CopyLinkButton({
  path,
  label = 'Copy Link',
  className = '',
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const url = path.startsWith('http')
        ? path
        : `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ||
        'inline-block border border-chocobo-gold/60 hover:bg-chocobo-gold/15 text-chocobo-light text-xs font-semibold py-1.5 px-3 rounded transition-colors'
      }
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
