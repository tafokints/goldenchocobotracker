'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { SubmissionPayload, SubmissionStatus, SubmissionType } from '@/db/schema';

interface CurrentItemSnapshot {
  status: string;
  foundBy: string | null;
  dateFound: string | null;
  sourceUrl: string | null;
  marketplaceUrl: string | null;
  imageUrl: string | null;
  latestPriceCents: number | null;
  latestPriceDate: string | null;
  gradingService: string | null;
  grade: number | null;
  certNumber: string | null;
  dateGraded: string | null;
}

interface EnrichedSubmission {
  id: string;
  trackerName: string;
  trackerSlug: string;
  seriesName: string;
  seriesMax: number;
  serialNumber: number;
  submissionType: SubmissionType;
  payloadJson: SubmissionPayload;
  proofUrl: string | null;
  proofImageKey: string | null;
  previewImageUrl: string | null;
  submitterHandle: string | null;
  status: SubmissionStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  currentItem: CurrentItemSnapshot | null;
}

const TYPE_BADGES: Record<SubmissionType, string> = {
  new_find: 'New Discovery',
  price_sale: 'Sale / Price',
  grading_update: 'Grading',
  photo_upload: 'Photo Upload',
  correction: 'Correction',
};

export default function ModerationQueue() {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [items, setItems] = useState<EnrichedSubmission[]>([]);
  const [dbConfigured, setDbConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadQueue = useCallback(async (statusFilter: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/submissions?status=${statusFilter}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        setErrorMsg(`Failed to load moderation queue (${res.status})`);
        return;
      }
      const data = await res.json();
      setDbConfigured(Boolean(data.databaseConfigured));
      setItems(data.submissions || []);
    } catch {
      setErrorMsg('Network error loading submissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue(filter);
  }, [filter, loadQueue]);

  const handleDecision = async (id: string, decision: 'approve' | 'reject') => {
    setBusyId(id);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          reviewNote: notesById[id] || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || `Action failed (${res.status})`);
        return;
      }
      await loadQueue(filter);
    } catch {
      setErrorMsg('Network error processing review action.');
    } finally {
      setBusyId(null);
    }
  };

  if (!dbConfigured) {
    return (
      <div className="w-full max-w-4xl bg-chocobo-dark border border-chocobo-gold rounded-lg p-6 text-center space-y-2">
        <h2 className="text-xl font-bold text-chocobo-gold">Neon Postgres Not Configured Yet</h2>
        <p className="text-sm text-chocobo-light/85">
          Add <code>DATABASE_URL</code> in Vercel and run <code>npm run db:push</code> +{' '}
          <code>npm run db:migrate-redis</code> to enable the community moderation queue.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${
                filter === tab
                  ? 'bg-chocobo-gold text-chocobo-dark'
                  : 'border border-chocobo-gold/50 text-chocobo-light hover:border-chocobo-gold'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => loadQueue(filter)}
          className="text-xs text-chocobo-gold hover:underline"
        >
          Refresh Queue
        </button>
      </div>

      {errorMsg && (
        <div role="alert" className="p-3 rounded bg-red-950/60 border border-red-500 text-red-200 text-sm">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-chocobo-gold">Loading submissions...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-chocobo-dark border border-chocobo-gold/40 rounded-lg text-chocobo-light/80">
          No {filter === 'all' ? '' : filter} submissions right now.
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => {
            const padded = item.serialNumber
              .toString()
              .padStart(Math.max(2, item.seriesMax.toString().length), '0');
            const p = item.payloadJson;
            const cur = item.currentItem;

            return (
              <article
                key={item.id}
                className="bg-chocobo-dark border border-chocobo-gold rounded-lg p-5 space-y-4"
              >
                <div className="flex flex-wrap justify-between items-start gap-2 border-b border-chocobo-gold/30 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-chocobo-gold text-chocobo-dark text-xs font-bold px-2 py-0.5 rounded">
                        {TYPE_BADGES[item.submissionType]}
                      </span>
                      <h2 className="text-lg font-bold text-chocobo-gold">
                        {item.seriesName} #{padded}/{item.seriesMax}
                      </h2>
                      <span className="text-xs text-chocobo-light/70">({item.trackerName})</span>
                    </div>
                    <p className="text-xs text-chocobo-light/70 mt-1">
                      Submitted {new Date(item.createdAt).toLocaleString()}
                      {item.submitterHandle ? ` by ${item.submitterHandle}` : ' (anonymous)'}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      item.status === 'pending'
                        ? 'bg-yellow-800/60 text-yellow-200'
                        : item.status === 'approved'
                          ? 'bg-green-800/60 text-green-200'
                          : 'bg-red-800/60 text-red-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Side-by-side Diff */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-black/30 border border-chocobo-gold/25 rounded p-4 space-y-1">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-chocobo-light/70 mb-2">
                      Current Live Record
                    </h3>
                    {cur ? (
                      <>
                        <p>Status: {cur.status}</p>
                        <p>Found By: {cur.foundBy || '—'}</p>
                        <p>Date Found: {cur.dateFound || '—'}</p>
                        <p>
                          Latest Price:{' '}
                          {cur.latestPriceCents !== null
                            ? `$${Math.round(cur.latestPriceCents / 100).toLocaleString()} (${cur.latestPriceDate || 'n/a'})`
                            : '—'}
                        </p>
                        <p>
                          Grading:{' '}
                          {cur.gradingService
                            ? `${cur.gradingService} ${cur.grade ?? ''}${cur.certNumber ? ` (#${cur.certNumber})` : ''}`
                            : '—'}
                        </p>
                      </>
                    ) : (
                      <p className="text-chocobo-light/60">Not yet recorded (Unfound)</p>
                    )}
                  </div>

                  <div className="bg-chocobo-gold/10 border border-chocobo-gold/60 rounded p-4 space-y-1">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-chocobo-gold mb-2">
                      Proposed Update
                    </h3>
                    {p.foundBy && <p>Found By: <strong>{p.foundBy}</strong></p>}
                    {p.dateFound && <p>Date Found: <strong>{p.dateFound}</strong></p>}
                    {p.price !== undefined && (
                      <p>
                        Sale Price: <strong>${p.price.toLocaleString()}</strong>
                        {p.saleDate ? ` on ${p.saleDate}` : ''}
                        {p.platform ? ` (${p.platform})` : ''}
                      </p>
                    )}
                    {(p.soldBy || p.soldTo) && (
                      <p>
                        Transfer: {p.soldBy || '?'} &rarr; {p.soldTo || '?'}
                      </p>
                    )}
                    {p.gradingService && (
                      <p>
                        Grading: <strong>{p.gradingService} {p.grade}</strong>
                        {p.certNumber ? ` · Cert #${p.certNumber}` : ''}
                        {p.dateGraded ? ` (${p.dateGraded})` : ''}
                      </p>
                    )}
                    {p.notes && <p>Notes: {p.notes}</p>}
                    {item.proofUrl && (
                      <p className="pt-1">
                        Proof:{' '}
                        <a
                          href={item.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-chocobo-gold underline break-all"
                        >
                          {item.proofUrl}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Quarantined Photo Preview */}
                {item.previewImageUrl && (
                  <div className="bg-black/30 border border-chocobo-gold/30 rounded p-4">
                    <p className="text-xs uppercase tracking-wider font-bold text-chocobo-gold mb-2">
                      Quarantined Photo Preview (EXIF Stripped — Private Until Approved)
                    </p>
                    {/* Signed presigned R2 preview URL for authenticated admins only */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewImageUrl}
                      alt={`Submitted proof for #${padded}`}
                      className="max-h-72 rounded border border-chocobo-gold/40 object-contain"
                    />
                  </div>
                )}

                {/* Moderation Actions */}
                {item.status === 'pending' ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <input
                      type="text"
                      value={notesById[item.id] || ''}
                      onChange={(e) =>
                        setNotesById((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Optional review note..."
                      className="flex-1 bg-chocobo-light text-chocobo-dark border border-chocobo-gold rounded py-2 px-3 text-sm"
                    />
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleDecision(item.id, 'approve')}
                      className="bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold py-2 px-4 rounded text-sm"
                    >
                      {busyId === item.id ? 'Working...' : 'Approve & Publish'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleDecision(item.id, 'reject')}
                      className="bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white font-bold py-2 px-4 rounded text-sm"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-chocobo-light/70">
                    Reviewed by {item.reviewedBy || 'admin'}
                    {item.reviewNote ? ` — "${item.reviewNote}"` : ''}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
