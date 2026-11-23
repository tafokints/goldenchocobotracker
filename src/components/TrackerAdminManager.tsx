'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface SeriesDraft {
  name: string;
  slug: string;
  serialMin: string;
  serialMax: string;
}

interface AdminTrackerRecord {
  id: string;
  slug: string;
  customDomain: string | null;
  name: string;
  game: string;
  setName: string;
  description: string;
  affiliateLinksEnabled: boolean;
  isPublished: boolean;
  series: Array<{ id: string; slug: string; name: string; serialMin: number; serialMax: number }>;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export default function TrackerAdminManager() {
  const [records, setRecords] = useState<AdminTrackerRecord[]>([]);
  const [dbConfigured, setDbConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Create form state
  const [trackerName, setTrackerName] = useState('');
  const [slug, setSlug] = useState('');
  const [game, setGame] = useState<'mtg' | 'pokemon' | 'one-piece' | 'lorcana' | 'sports' | 'other'>('mtg');
  const [collectionSetName, setCollectionSetName] = useState('');
  const [description, setDescription] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [accentHex, setAccentHex] = useState('#D6A73D');
  const [bgHex, setBgHex] = useState('#201A15');
  const [seriesDrafts, setSeriesDrafts] = useState<SeriesDraft[]>([
    { name: '', slug: '', serialMin: '1', serialMax: '500' },
  ]);

  const loadTrackers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/trackers', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setDbConfigured(Boolean(data.databaseConfigured));
      setRecords(data.trackers || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrackers();
  }, [loadTrackers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        name: trackerName,
        slug: slug || slugify(trackerName),
        game,
        setName: collectionSetName,
        description,
        customDomain: customDomain.trim() || undefined,
        themeConfig: { accentHex, bgHex, fgHex: '#FFF8F0' },
        affiliateLinksEnabled: false,
        isPublished: true,
        series: seriesDrafts.map((s, idx) => ({
          name: s.name,
          slug: s.slug || slugify(s.name),
          serialMin: parseInt(s.serialMin, 10) || 1,
          serialMax: parseInt(s.serialMax, 10) || 100,
          sortOrder: idx,
        })),
      };

      const res = await fetch('/api/admin/trackers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ text: data.error || 'Failed to create tracker.', isError: true });
        return;
      }

      setFeedback({
        text: `Created tracker "${data.tracker.name}" at /t/${data.tracker.slug}.`,
        isError: false,
      });
      setTrackerName('');
      setSlug('');
      setCollectionSetName('');
      setDescription('');
      setCustomDomain('');
      setSeriesDrafts([{ name: '', slug: '', serialMin: '1', serialMax: '500' }]);
      await loadTrackers();
    } catch {
      setFeedback({ text: 'Network error creating tracker.', isError: true });
    } finally {
      setSaving(false);
    }
  };

  const toggleFlag = async (
    trackerId: string,
    field: 'isPublished' | 'affiliateLinksEnabled',
    nextVal: boolean
  ) => {
    setFeedback(null);
    const res = await fetch(`/api/admin/trackers/${trackerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: nextVal }),
    });
    if (res.ok) {
      await loadTrackers();
    } else {
      const data = await res.json().catch(() => ({}));
      setFeedback({ text: data.error || 'Update failed.', isError: true });
    }
  };

  if (!dbConfigured) {
    return (
      <div className="w-full max-w-4xl bg-chocobo-dark border border-chocobo-gold rounded-lg p-6 text-center space-y-2">
        <h2 className="text-xl font-bold text-chocobo-gold">Neon Postgres Required for Multi-Tracker Management</h2>
        <p className="text-sm text-chocobo-light/85">
          Once <code>DATABASE_URL</code> is configured and migrated, you can launch new serialized
          trackers and multi-series runs directly from this page without code changes.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-8">
      {/* Existing Trackers */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-chocobo-gold">Configured Trackers</h2>
        {loading ? (
          <p className="text-chocobo-light/80 text-sm">Loading trackers...</p>
        ) : records.length === 0 ? (
          <p className="text-chocobo-light/80 text-sm">
            No trackers in Postgres yet. Run <code>npm run db:migrate-redis</code> or create one below.
          </p>
        ) : (
          <div className="space-y-3">
            {records.map((t) => (
              <div
                key={t.id}
                className="bg-chocobo-dark border border-chocobo-gold/70 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/t/${t.slug}`}
                      className="text-lg font-bold text-chocobo-gold hover:underline"
                    >
                      {t.name}
                    </Link>
                    <span className="text-xs px-2 py-0.5 rounded bg-chocobo-gold/20 text-chocobo-gold uppercase">
                      {t.game}
                    </span>
                    <code className="text-xs text-chocobo-light/70">/t/{t.slug}</code>
                    {t.customDomain && (
                      <code className="text-xs text-green-300">{t.customDomain}</code>
                    )}
                  </div>
                  <p className="text-xs text-chocobo-light/75">
                    Series:{' '}
                    {t.series
                      .map((s) => `${s.name} (${s.serialMin}–${s.serialMax})`)
                      .join(', ')}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFlag(t.id, 'isPublished', !t.isPublished)}
                    className={`px-3 py-1.5 rounded text-xs font-bold border ${
                      t.isPublished
                        ? 'bg-green-800/50 border-green-500 text-green-200'
                        : 'bg-gray-800 border-gray-600 text-gray-300'
                    }`}
                  >
                    {t.isPublished ? 'Published' : 'Draft'}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFlag(t.id, 'affiliateLinksEnabled', !t.affiliateLinksEnabled)}
                    title="Enable only after registering domain with EPN, Amazon Associates, and TCGplayer"
                    className={`px-3 py-1.5 rounded text-xs font-bold border ${
                      t.affiliateLinksEnabled
                        ? 'bg-yellow-700/50 border-chocobo-gold text-yellow-200'
                        : 'bg-gray-800 border-gray-600 text-gray-300'
                    }`}
                  >
                    {t.affiliateLinksEnabled ? 'Affiliates: ON' : 'Affiliates: OFF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create New Tracker Form */}
      <section className="bg-chocobo-dark border border-chocobo-gold rounded-lg p-6">
        <h2 className="text-xl font-bold text-chocobo-gold mb-1">Launch New Serialized Tracker</h2>
        <p className="text-xs text-chocobo-light/75 mb-5">
          Affiliate links start disabled by default until you register the new domain in EPN,
          Amazon Associates, and TCGplayer (Impact).
        </p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-chocobo-gold mb-1">
                Tracker Name *
              </label>
              <input
                type="text"
                required
                value={trackerName}
                onChange={(e) => {
                  setTrackerName(e.target.value);
                  if (!slug) setSlug(slugify(e.target.value));
                }}
                placeholder="e.g., LOTR Serialized Sol Rings"
                className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-chocobo-gold mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="e.g., lotr-sol-rings"
                className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-chocobo-gold mb-1">Game</label>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value as typeof game)}
                className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3 text-sm"
              >
                <option value="mtg">Magic: The Gathering</option>
                <option value="pokemon">Pokemon</option>
                <option value="one-piece">One Piece</option>
                <option value="lorcana">Disney Lorcana</option>
                <option value="sports">Sports Cards</option>
                <option value="other">Other Collectible</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-chocobo-gold mb-1">
                Set / Collection Name *
              </label>
              <input
                type="text"
                required
                value={collectionSetName}
                onChange={(e) => setCollectionSetName(e.target.value)}
                placeholder="e.g., Tales of Middle-earth"
                className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-chocobo-gold mb-1">
              Description *
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Track every serialized Elven, Dwarven, and Human Sol Ring pull and sale."
              className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-chocobo-gold mb-1">
                Custom Domain (optional)
              </label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="solringtracker.com"
                className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-chocobo-gold mb-1">
                Accent Hex
              </label>
              <input
                type="color"
                value={accentHex}
                onChange={(e) => setAccentHex(e.target.value)}
                className="w-full h-10 bg-chocobo-light border border-chocobo-gold rounded p-1"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-chocobo-gold mb-1">
                Background Hex
              </label>
              <input
                type="color"
                value={bgHex}
                onChange={(e) => setBgHex(e.target.value)}
                className="w-full h-10 bg-chocobo-light border border-chocobo-gold rounded p-1"
              />
            </div>
          </div>

          {/* Series Builder */}
          <div className="border-t border-chocobo-gold/30 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-chocobo-gold uppercase tracking-wide">
                Series / Variants (1 or More)
              </h3>
              <button
                type="button"
                onClick={() =>
                  setSeriesDrafts((prev) => [
                    ...prev,
                    { name: '', slug: '', serialMin: '1', serialMax: '500' },
                  ])
                }
                className="text-xs bg-chocobo-gold/20 border border-chocobo-gold text-chocobo-gold px-2.5 py-1 rounded hover:bg-chocobo-gold hover:text-chocobo-dark font-bold"
              >
                + Add Series
              </button>
            </div>

            {seriesDrafts.map((s, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] text-chocobo-light/75 mb-1">Series Name</label>
                  <input
                    type="text"
                    required
                    value={s.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSeriesDrafts((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, name: val, slug: slugify(val) } : row
                        )
                      );
                    }}
                    placeholder="e.g., Elven Sol Ring"
                    className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-1.5 px-2.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] text-chocobo-light/75 mb-1">Slug</label>
                  <input
                    type="text"
                    required
                    value={s.slug}
                    onChange={(e) => {
                      const val = slugify(e.target.value);
                      setSeriesDrafts((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, slug: val } : row))
                      );
                    }}
                    placeholder="elven-sol-ring"
                    className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-1.5 px-2.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-chocobo-light/75 mb-1">Max #</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    required
                    value={s.serialMax}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSeriesDrafts((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, serialMax: val } : row))
                      );
                    }}
                    className="w-full bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-1.5 px-2.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  {seriesDrafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSeriesDrafts((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="w-full text-xs border border-red-500/70 text-red-300 hover:bg-red-900/40 rounded py-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-chocobo-gold hover:bg-yellow-400 disabled:opacity-60 text-chocobo-dark font-bold py-2.5 px-4 rounded transition-colors"
          >
            {saving ? 'Creating Tracker...' : 'Create Tracker'}
          </button>

          {feedback && (
            <p
              role="status"
              className={`text-sm text-center font-semibold ${
                feedback.isError ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {feedback.text}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
