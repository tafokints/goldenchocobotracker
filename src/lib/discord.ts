import type { SubmissionPayload, SubmissionType } from '@/db/schema';
import { getSiteUrl } from '@/lib/site-config';

const TYPE_LABELS: Record<SubmissionType, string> = {
  new_find: 'New Pull / Discovery',
  price_sale: 'Reported Sale / Price',
  grading_update: 'Grading Update',
  photo_upload: 'Card Photo Upload',
  correction: 'Correction / Ownership Change',
};

export interface DiscordSubmissionNotification {
  submissionId: string;
  trackerName: string;
  seriesName: string;
  serialNumber: number;
  serialMax: number;
  submissionType: SubmissionType;
  payload: SubmissionPayload;
  proofUrl?: string | null;
  hasPhotoUpload: boolean;
  submitterHandle?: string | null;
}

/**
 * Fires a rich embed to a private Discord channel webhook when a community submission lands
 * in the moderation queue. Never throws so webhook issues never fail a valid submission.
 */
export async function notifyDiscordNewSubmission(
  info: DiscordSubmissionNotification
): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_SUBMISSIONS_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return false;
  }

  const padded = info.serialNumber
    .toString()
    .padStart(Math.max(2, info.serialMax.toString().length), '0');
  const queueUrl = `${getSiteUrl()}/admin/queue`;

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: 'Tracker', value: info.trackerName, inline: true },
    { name: 'Card', value: `${info.seriesName} #${padded}/${info.serialMax}`, inline: true },
    { name: 'Type', value: TYPE_LABELS[info.submissionType], inline: true },
  ];

  if (info.payload.foundBy) {
    fields.push({ name: 'Found By', value: info.payload.foundBy, inline: true });
  }
  if (info.payload.dateFound) {
    fields.push({ name: 'Date Found', value: info.payload.dateFound, inline: true });
  }
  if (info.payload.price !== undefined) {
    fields.push({
      name: 'Reported Sale',
      value: `$${info.payload.price.toLocaleString()}${info.payload.saleDate ? ` (${info.payload.saleDate})` : ''}`,
      inline: true,
    });
  }
  if (info.payload.gradingService && info.payload.grade !== undefined) {
    fields.push({
      name: 'Grading',
      value: `${info.payload.gradingService} ${info.payload.grade}${
        info.payload.certNumber ? ` · Cert #${info.payload.certNumber}` : ''
      }`,
      inline: true,
    });
  }
  if (info.payload.notes) {
    fields.push({ name: 'Notes', value: info.payload.notes.slice(0, 500), inline: false });
  }
  if (info.proofUrl) {
    fields.push({ name: 'Proof Link', value: info.proofUrl.slice(0, 500), inline: false });
  }
  if (info.hasPhotoUpload) {
    fields.push({
      name: 'Uploaded Photo',
      value: 'Attached in R2 quarantine (preview inside Admin Queue)',
      inline: false,
    });
  }
  if (info.submitterHandle) {
    fields.push({ name: 'Submitted By', value: info.submitterHandle, inline: true });
  }

  fields.push({
    name: 'Review Action',
    value: `[Open Admin Moderation Queue](${queueUrl})`,
    inline: false,
  });

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Serial Tracker Bot',
        embeds: [
          {
            title: `New Submission: #${padded} (${TYPE_LABELS[info.submissionType]})`,
            url: queueUrl,
            color: 0xd6a73d,
            fields,
            footer: { text: `Submission ID: ${info.submissionId}` },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Discord webhook returned non-OK status:', response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to send Discord submission notification:', error);
    return false;
  }
}
