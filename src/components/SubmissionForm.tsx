'use client';

import React, { useRef, useState } from 'react';
import type { SubmissionType } from '@/db/schema';
import { COMMON_GRADE_LABELS, formatGradingDisplay } from '@/lib/grading';
import TurnstileWidget from './TurnstileWidget';

interface SubmissionFormProps {
  trackerSlug: string;
  seriesSlug?: string;
  serialMin: number;
  serialMax: number;
  seriesName: string;
  initialSerial?: number;
  initialType?: SubmissionType;
  turnstileSiteKey?: string;
  uploadsEnabled: boolean;
  submissionsReady: boolean;
}

const SUBMISSION_TYPES: Array<{ value: SubmissionType; label: string; hint: string }> = [
  { value: 'new_find', label: 'New Pull / Discovery', hint: 'Report a newly pulled serialized card' },
  { value: 'price_sale', label: 'Reported Sale / Price', hint: 'Log a verified public or private sale' },
  { value: 'grading_update', label: 'Grading Update', hint: 'Add PSA, BGS, CGC, or TAG grade & cert #' },
  { value: 'photo_upload', label: 'Card Photo Upload', hint: 'Submit a clear photo of the card' },
  { value: 'correction', label: 'Correction / Ownership Change', hint: 'Fix a typo or report a transfer' },
];

export default function SubmissionForm({
  trackerSlug,
  seriesSlug,
  serialMin,
  serialMax,
  seriesName,
  initialSerial,
  initialType = 'new_find',
  turnstileSiteKey,
  uploadsEnabled,
  submissionsReady,
}: SubmissionFormProps) {
  const [submissionType, setSubmissionType] = useState<SubmissionType>(initialType);
  const [serialNumber, setSerialNumber] = useState(
    initialSerial && initialSerial >= serialMin && initialSerial <= serialMax
      ? String(initialSerial)
      : ''
  );
  const [proofUrl, setProofUrl] = useState('');
  const [submitterHandle, setSubmitterHandle] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());

  // Type-specific fields
  const [foundBy, setFoundBy] = useState('');
  const [dateFound, setDateFound] = useState('');
  const [pullChannel, setPullChannel] = useState('');
  const [region, setRegion] = useState('');
  const [price, setPrice] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [platform, setPlatform] = useState('');
  const [soldBy, setSoldBy] = useState('');
  const [soldTo, setSoldTo] = useState('');
  const [gradingService, setGradingService] = useState('PSA');
  const [grade, setGrade] = useState('');
  const [gradeLabel, setGradeLabel] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [dateGraded, setDateGraded] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const padWidth = Math.max(2, serialMax.toString().length);
  const serialCount = serialMax - serialMin + 1;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 5 * 1024 * 1024) {
      setFeedback({ text: 'Photo must be 5 MB or smaller.', isError: true });
      e.target.value = '';
      setPhotoFile(null);
      return;
    }
    setFeedback(null);
    setPhotoFile(file);
  };

  const resetForm = () => {
    setProofUrl('');
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFoundBy('');
    setDateFound('');
    setPullChannel('');
    setRegion('');
    setPrice('');
    setSaleDate('');
    setPlatform('');
    setSoldBy('');
    setSoldTo('');
    setGrade('');
    setGradeLabel('');
    setCertNumber('');
    setDateGraded('');
    setNotes('');
    setFormStartedAt(Date.now());
    setTurnstileReset((n) => n + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!submissionsReady) {
      setFeedback({
        text: 'Community submissions will open as soon as the moderation database is connected.',
        isError: true,
      });
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      setFeedback({ text: 'Please complete the human verification check below.', isError: true });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.set('trackerSlug', trackerSlug);
      if (seriesSlug) formData.set('seriesSlug', seriesSlug);
      formData.set('serialNumber', serialNumber);
      formData.set('submissionType', submissionType);
      formData.set('proofUrl', proofUrl);
      formData.set('submitterHandle', submitterHandle);
      formData.set('honeypot', honeypot);
      formData.set('formStartedAt', String(formStartedAt));
      if (turnstileToken) formData.set('turnstileToken', turnstileToken);
      if (photoFile) formData.set('photo', photoFile);

      if (submissionType === 'new_find') {
        formData.set('foundBy', foundBy);
        formData.set('dateFound', dateFound);
        if (pullChannel) formData.set('pullChannel', pullChannel);
        if (region) formData.set('region', region);
      } else if (submissionType === 'price_sale') {
        formData.set('price', price);
        formData.set('saleDate', saleDate);
        formData.set('platform', platform);
        formData.set('soldBy', soldBy);
        formData.set('soldTo', soldTo);
      } else if (submissionType === 'grading_update') {
        formData.set('gradingService', gradingService);
        formData.set('grade', grade);
        if (gradeLabel) formData.set('gradeLabel', gradeLabel);
        formData.set('certNumber', certNumber);
        formData.set('dateGraded', dateGraded);
      }
      if (notes) formData.set('notes', notes);

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const firstFieldError =
          data.details && typeof data.details === 'object'
            ? Object.values(data.details as Record<string, string[] | undefined>)
                .flat()
                .find(Boolean)
            : undefined;
        setFeedback({
          text: firstFieldError || data.error || 'Submission failed. Please check your entries.',
          isError: true,
        });
        setTurnstileReset((n) => n + 1);
        return;
      }

      setFeedback({
        text:
          data.message ||
          'Thank you! Your submission is in our moderation queue and typically goes live within 24 hours.',
        isError: false,
      });
      resetForm();
    } catch {
      setFeedback({ text: 'Network error while submitting. Please try again.', isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl bg-chocobo-surface border border-chocobo-gold/30 rounded-lg p-6 md:p-7 space-y-5"
    >
      {!submissionsReady && (
        <div
          role="status"
          className="p-3 rounded bg-yellow-900/40 border border-chocobo-gold/60 text-yellow-200 text-xs sm:text-sm"
        >
          Note: The Postgres moderation queue is not connected in this environment yet. Once{' '}
          <code>DATABASE_URL</code> is configured, submissions will flow directly into{' '}
          <code>/admin/queue</code>.
        </div>
      )}

      {/* Submission Type */}
      <div>
        <label htmlFor="submission-type" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
          Update Type
        </label>
        <select
          id="submission-type"
          value={submissionType}
          onChange={(e) => setSubmissionType(e.target.value as SubmissionType)}
          className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
        >
          {SUBMISSION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label} — {t.hint}
            </option>
          ))}
        </select>
      </div>

      {/* Serial Number */}
      <div>
        <label htmlFor="serial-number" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
          Card Serial Number ({seriesName})
        </label>
        {serialCount <= 250 ? (
          <select
            id="serial-number"
            required
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
          >
            <option value="">Select card #{serialMin.toString().padStart(padWidth, '0')}–#{serialMax}...</option>
            {Array.from({ length: serialCount }, (_, i) => serialMin + i).map((num) => (
              <option key={num} value={num}>
                {seriesName} #{num.toString().padStart(padWidth, '0')} / {serialMax}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="serial-number"
            type="number"
            required
            min={serialMin}
            max={serialMax}
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder={`Enter serial number (${serialMin}–${serialMax})`}
            className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
          />
        )}
      </div>

      {/* Type-specific inputs */}
      {submissionType === 'new_find' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="found-by" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
              Found By *
            </label>
            <input
              id="found-by"
              type="text"
              required
              value={foundBy}
              onChange={(e) => setFoundBy(e.target.value)}
              placeholder="Collector, LGS, or handle"
              className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
            />
          </div>
          <div>
            <label htmlFor="date-found" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
              Date Found *
            </label>
            <input
              id="date-found"
              type="date"
              required
              value={dateFound}
              onChange={(e) => setDateFound(e.target.value)}
              className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
            />
          </div>
          <div>
            <label htmlFor="pull-channel" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
              Where Was It Pulled? (optional)
            </label>
            <select
              id="pull-channel"
              value={pullChannel}
              onChange={(e) => setPullChannel(e.target.value)}
              className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
            >
              <option value="">Unspecified</option>
              <option value="lgs">Local Game Store (LGS)</option>
              <option value="personal_box">Personal Collector Box</option>
              <option value="breaker">Live Breaker / Whatnot</option>
              <option value="retail">Big Box Retail</option>
              <option value="gift_bundle">Gift / Collector Bundle</option>
            </select>
          </div>
          <div>
            <label htmlFor="pull-region" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
              Country / Region (optional)
            </label>
            <input
              id="pull-region"
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g., US, Japan, Canada, UK"
              className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
            />
          </div>
        </div>
      )}

      {submissionType === 'price_sale' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sale-price" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
                Sale Price (USD) *
              </label>
              <input
                id="sale-price"
                type="number"
                min="0"
                step="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 65000"
                className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
              />
            </div>
            <div>
              <label htmlFor="sale-date" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
                Sale Date *
              </label>
              <input
                id="sale-date"
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="sale-platform" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-1">
                Platform
              </label>
              <input
                id="sale-platform"
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="eBay, Goldin, Private"
                className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="sold-by" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-1">
                Seller (opt)
              </label>
              <input
                id="sold-by"
                type="text"
                value={soldBy}
                onChange={(e) => setSoldBy(e.target.value)}
                placeholder="Handle"
                className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="sold-to" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-1">
                Buyer (opt)
              </label>
              <input
                id="sold-to"
                type="text"
                value={soldTo}
                onChange={(e) => setSoldTo(e.target.value)}
                placeholder="Handle"
                className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2 px-3 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {submissionType === 'grading_update' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="grading-service" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
              Grading Service *
            </label>
            <select
              id="grading-service"
              value={gradingService}
              onChange={(e) => setGradingService(e.target.value)}
              className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
            >
              <option value="PSA">PSA</option>
              <option value="BGS">BGS (Beckett)</option>
              <option value="CGC">CGC</option>
              <option value="TAG">TAG</option>
              <option value="SGC">SGC</option>
            </select>
          </div>
          <div>
            <label htmlFor="grade-value" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
              Grade (0–10) *
            </label>
            <input
              id="grade-value"
              type="number"
              step="0.5"
              min="0"
              max="10"
              required
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g., 10 or 9.5"
              className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="grade-label" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
              Slab Tier / Designation (optional)
            </label>
            <input
              id="grade-label"
              type="text"
              list="submission-common-grade-labels"
              maxLength={60}
              value={gradeLabel}
              onChange={(e) => setGradeLabel(e.target.value)}
              placeholder="e.g., Pristine 10, Black Label 10, Gem Mint 10, MBA Gold Diamond"
              className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
            />
            <datalist id="submission-common-grade-labels">
              {COMMON_GRADE_LABELS.map((tier) => (
                <option key={tier} value={tier} />
              ))}
            </datalist>
            {gradingService && grade !== '' && !Number.isNaN(parseFloat(grade)) && (
              <p className="text-xs text-chocobo-muted mt-1.5">
                Display preview:{' '}
                <span className="text-chocobo-gold font-semibold">
                  {formatGradingDisplay({
                    service: gradingService,
                    grade: parseFloat(grade),
                    gradeLabel: gradeLabel || undefined,
                  })}
                </span>
              </p>
            )}
          </div>
          <div>
            <label htmlFor="cert-number" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
              Cert Number (optional)
            </label>
            <input
              id="cert-number"
              type="text"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
              placeholder="e.g., 104829104"
              className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
            />
          </div>
          <div>
            <label htmlFor="date-graded" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
              Date Graded (optional)
            </label>
            <input
              id="date-graded"
              type="date"
              value={dateGraded}
              onChange={(e) => setDateGraded(e.target.value)}
              className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
            />
          </div>
        </div>
      )}

      {/* Proof URL */}
      <div>
        <label htmlFor="proof-url" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
          Proof Link (Reddit, Instagram, X, eBay, Goldin, PSA Cert){' '}
          {submissionType === 'photo_upload' ? '(optional)' : '*'}
        </label>
        <input
          id="proof-url"
          type="url"
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
          placeholder="https://..."
          className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2.5 px-3"
        />
      </div>

      {/* Photo Upload */}
      <div>
        <label htmlFor="proof-photo" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
          Upload Card / Proof Photo {submissionType === 'photo_upload' ? '*' : '(optional)'}
        </label>
        <input
          ref={fileInputRef}
          id="proof-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={!uploadsEnabled}
          onChange={handlePhotoChange}
          className="block w-full text-sm text-chocobo-light file:mr-4 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-chocobo-gold file:text-chocobo-dark hover:file:bg-yellow-400 disabled:opacity-50"
        />
        <p className="text-xs text-chocobo-light/70 mt-1">
          {uploadsEnabled
            ? 'Max 5 MB (JPEG, PNG, WebP, AVIF). All EXIF/GPS metadata is stripped automatically and photos are held in moderation before publishing.'
            : 'Direct photo uploads activate once Cloudflare R2 is configured. Please share a proof link above in the meantime.'}
        </p>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="submission-notes" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
          Notes {submissionType === 'correction' ? '*' : '(optional)'}
        </label>
        <textarea
          id="submission-notes"
          rows={3}
          required={submissionType === 'correction'}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any helpful context for reviewers..."
          className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2 px-3 text-sm"
        />
      </div>

      {/* Submitter Credit */}
      <div>
        <label htmlFor="submitter-handle" className="block text-chocobo-gold text-xs font-bold uppercase tracking-wide mb-2">
          Your Handle / Credit (optional)
        </label>
        <input
          id="submitter-handle"
          type="text"
          value={submitterHandle}
          onChange={(e) => setSubmitterHandle(e.target.value)}
          placeholder="Reddit, Discord, or X handle"
          className="w-full bg-chocobo-recessed text-chocobo-light placeholder:text-chocobo-muted/65 border border-chocobo-gold/30 focus:outline-none focus:border-chocobo-gold rounded py-2 px-3 text-sm"
        />
      </div>

      {/* Honeypot field — invisible to humans */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website-field">Website</label>
        <input
          id="website-field"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* Cloudflare Turnstile */}
      {turnstileSiteKey && (
        <TurnstileWidget
          siteKey={turnstileSiteKey}
          resetSignal={turnstileReset}
          onToken={setTurnstileToken}
        />
      )}

      <button
        type="submit"
        disabled={submitting || !submissionsReady}
        className="w-full bg-chocobo-gold hover:bg-yellow-400 disabled:opacity-60 text-chocobo-dark font-bold py-3 px-4 rounded transition-colors"
      >
        {submitting ? 'Submitting for Review...' : 'Submit for Moderation Review'}
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
  );
}
