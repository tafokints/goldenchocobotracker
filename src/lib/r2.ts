import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp, { type Metadata } from 'sharp';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif']);

let cachedR2Client: S3Client | null = null;

export function hasR2Env(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_BASE_URL
  );
}

function getR2Client(): S3Client {
  if (!hasR2Env()) {
    throw new Error('Cloudflare R2 environment variables are not configured');
  }
  if (!cachedR2Client) {
    cachedR2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return cachedR2Client;
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (!bucket) throw new Error('R2_BUCKET_NAME is not configured');
  return bucket;
}

export function getR2PublicUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  const cleanKey = key.replace(/^\/+/, '');
  return `${base}/${cleanKey}`;
}

export interface SanitizedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  contentType: 'image/webp';
}

/**
 * Validates raw uploaded bytes using sharp (rejecting non-images, SVGs, HTML, and >5MB files),
 * auto-orients, resizes to max 1400px, re-encodes as WebP, and strips ALL EXIF/GPS metadata.
 */
export async function sanitizeUploadedImage(rawBuffer: Buffer): Promise<SanitizedImageResult> {
  if (rawBuffer.length === 0) {
    throw new Error('Image file is empty');
  }
  if (rawBuffer.length > MAX_UPLOAD_BYTES) {
    throw new Error('Image exceeds maximum allowed size of 5 MB');
  }

  let metadata: Metadata;
  try {
    metadata = await sharp(rawBuffer, { limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new Error('Uploaded file is not a valid image');
  }

  if (!metadata.format || !ALLOWED_IMAGE_FORMATS.has(metadata.format)) {
    throw new Error('Only JPEG, PNG, WebP, and AVIF images are allowed');
  }

  const { data, info } = await sharp(rawBuffer, { limitInputPixels: 40_000_000 })
    .rotate() // Respect EXIF orientation, then drop all EXIF/IPTC/XMP metadata on output
    .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    contentType: 'image/webp',
  };
}

/**
 * Uploads a sanitized community submission image into a private quarantine prefix.
 * Never exposed publicly until an admin approves the submission.
 */
export async function uploadQuarantinedImage(
  rawBuffer: Buffer,
  submissionId: string
): Promise<string> {
  const sanitized = await sanitizeUploadedImage(rawBuffer);
  const key = `quarantine/submissions/${submissionId}.webp`;

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: sanitized.buffer,
      ContentType: sanitized.contentType,
      CacheControl: 'private, no-store',
    })
  );

  return key;
}

/**
 * Generates a short-lived signed URL so authenticated admins can preview a quarantined photo
 * inside `/admin/queue` without ever making the quarantine prefix public.
 */
export async function getQuarantinedImagePreviewUrl(
  key: string,
  expiresInSeconds = 900
): Promise<string | null> {
  if (!hasR2Env() || !key.startsWith('quarantine/')) {
    return null;
  }

  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    }),
    { expiresIn: expiresInSeconds }
  );
}

/**
 * Promotes a quarantined photo into the public CDN prefix on approval and deletes the quarantine copy.
 */
export async function promoteQuarantinedImage(
  quarantineKey: string,
  trackerSlug: string,
  serialNumber: number
): Promise<string> {
  if (!quarantineKey.startsWith('quarantine/')) {
    throw new Error('Invalid quarantine object key');
  }

  const bucket = getBucketName();
  const client = getR2Client();
  const padded = serialNumber.toString().padStart(2, '0');
  const publicKey = `public/trackers/${trackerSlug}/serial-${padded}-${Date.now()}.webp`;

  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${quarantineKey}`,
      Key: publicKey,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
      MetadataDirective: 'REPLACE',
    })
  );

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: quarantineKey,
    })
  );

  return getR2PublicUrl(publicKey);
}

/**
 * Deletes a quarantined photo when a submission is rejected.
 */
export async function deleteQuarantinedImage(quarantineKey: string): Promise<void> {
  if (!hasR2Env() || !quarantineKey.startsWith('quarantine/')) {
    return;
  }

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: quarantineKey,
    })
  );
}

/**
 * Direct public upload helper for admin uploads & migration scripts.
 */
export async function uploadPublicCardImage(
  rawBuffer: Buffer,
  trackerSlug: string,
  filenameStem: string
): Promise<string> {
  const sanitized = await sanitizeUploadedImage(rawBuffer);
  const key = `public/trackers/${trackerSlug}/${filenameStem}.webp`;

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: sanitized.buffer,
      ContentType: sanitized.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return getR2PublicUrl(key);
}
