import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AffiliateProductLink, CommunityResourceLink } from '@/lib/affiliate';
import type { PullChannel } from '@/lib/types';

export interface TrackerThemeConfig {
  accentHex: string;
  bgHex: string;
  fgHex: string;
  secondaryHex?: string;
}

export interface TrackerSeoConfig {
  title?: string;
  description?: string;
  ogImage?: string;
  keywords?: string[];
  iconicNumbers?: Record<string, string>;
}

export type SubmissionType =
  | 'new_find'
  | 'price_sale'
  | 'grading_update'
  | 'photo_upload'
  | 'correction';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface SubmissionPayload {
  foundBy?: string;
  dateFound?: string;
  pullChannel?: PullChannel;
  region?: string;
  sourceUrl?: string;
  marketplaceUrl?: string;
  marketplaceLabel?: string;
  price?: number;
  saleDate?: string;
  platform?: string;
  soldBy?: string;
  soldTo?: string;
  gradingService?: string;
  grade?: number;
  gradeLabel?: string;
  certNumber?: string;
  dateGraded?: string;
  notes?: string;
}

export const trackers = pgTable('trackers', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  customDomain: text('custom_domain').unique(),
  name: text('name').notNull(),
  game: text('game').notNull().default('mtg'),
  setName: text('set_name').notNull(),
  description: text('description').notNull(),
  themeConfig: jsonb('theme_config').$type<TrackerThemeConfig>().notNull(),
  affiliateConfig: jsonb('affiliate_config').$type<AffiliateProductLink[]>().notNull().default([]),
  communityLinks: jsonb('community_links').$type<CommunityResourceLink[]>().notNull().default([]),
  seoConfig: jsonb('seo_config').$type<TrackerSeoConfig>().notNull().default({}),
  /** Safety gate: only enable affiliate links after registering this domain with EPN/Amazon/Impact. */
  affiliateLinksEnabled: boolean('affiliate_links_enabled').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const series = pgTable(
  'series',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    trackerId: uuid('tracker_id')
      .notNull()
      .references(() => trackers.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    serialMin: integer('serial_min').notNull().default(1),
    serialMax: integer('serial_max').notNull(),
    imagePlaceholderUrl: text('image_placeholder_url'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('series_tracker_slug_idx').on(table.trackerId, table.slug)]
);

export const serialItems = pgTable(
  'serial_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    seriesId: uuid('series_id')
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' }),
    serialNumber: integer('serial_number').notNull(),
    status: text('status').$type<'unfound' | 'verified'>().notNull().default('unfound'),
    foundBy: text('found_by'),
    dateFound: text('date_found'),
    pullChannel: text('pull_channel').$type<PullChannel>(),
    region: text('region'),
    sourceUrl: text('source_url'),
    marketplaceUrl: text('marketplace_url'),
    marketplaceLabel: text('marketplace_label'),
    imageUrl: text('image_url'),
    latestPriceCents: bigint('latest_price_cents', { mode: 'number' }),
    latestPriceDate: text('latest_price_date'),
    gradingService: text('grading_service'),
    grade: doublePrecision('grade'),
    gradeLabel: text('grade_label'),
    certNumber: text('cert_number'),
    dateGraded: text('date_graded'),
    notes: text('notes'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('serial_items_series_number_idx').on(table.seriesId, table.serialNumber)]
);

export const priceEvents = pgTable(
  'price_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    itemId: uuid('item_id')
      .notNull()
      .references(() => serialItems.id, { onDelete: 'cascade' }),
    priceCents: bigint('price_cents', { mode: 'number' }).notNull(),
    currency: text('currency').notNull().default('USD'),
    eventType: text('event_type').$type<'sale' | 'listing'>().notNull().default('sale'),
    eventDate: text('event_date').notNull(),
    platform: text('platform'),
    sourceUrl: text('source_url'),
    soldBy: text('sold_by'),
    soldTo: text('sold_to'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('price_events_item_date_idx').on(table.itemId, table.eventDate)]
);

export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    trackerId: uuid('tracker_id')
      .notNull()
      .references(() => trackers.id, { onDelete: 'cascade' }),
    seriesId: uuid('series_id')
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' }),
    serialNumber: integer('serial_number').notNull(),
    submissionType: text('submission_type').$type<SubmissionType>().notNull(),
    payloadJson: jsonb('payload_json').$type<SubmissionPayload>().notNull(),
    proofUrl: text('proof_url'),
    proofImageKey: text('proof_image_key'),
    submitterHandle: text('submitter_handle'),
    submitterIpHash: text('submitter_ip_hash').notNull(),
    status: text('status').$type<SubmissionStatus>().notNull().default('pending'),
    reviewedBy: text('reviewed_by'),
    reviewNote: text('review_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (table) => [
    index('submissions_status_created_idx').on(table.status, table.createdAt),
    index('submissions_dedupe_idx').on(
      table.seriesId,
      table.serialNumber,
      table.submissionType,
      table.status
    ),
  ]
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorId: text('actor_id').notNull(),
    actorLogin: text('actor_login'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    beforeJson: jsonb('before_json'),
    afterJson: jsonb('after_json'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('audit_logs_entity_idx').on(table.entityType, table.entityId)]
);

export const trackerRoles = pgTable(
  'tracker_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    trackerId: uuid('tracker_id')
      .notNull()
      .references(() => trackers.id, { onDelete: 'cascade' }),
    githubUserId: text('github_user_id'),
    githubLogin: text('github_login'),
    role: text('role').$type<'owner' | 'moderator'>().notNull().default('moderator'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('tracker_roles_tracker_idx').on(table.trackerId)]
);
