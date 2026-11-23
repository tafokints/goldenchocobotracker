import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export type AppDb = NeonHttpDatabase<typeof schema>;

let cachedDb: AppDb | null = null;

function resolveDatabaseUrl(): string | undefined {
  return (process.env.DATABASE_URL || process.env.POSTGRES_URL)?.trim() || undefined;
}

export function hasDatabaseEnv(): boolean {
  return Boolean(resolveDatabaseUrl());
}

export function getDb(): AppDb {
  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not configured');
  }
  if (!cachedDb) {
    const sql = neon(url);
    cachedDb = drizzle(sql, { schema });
  }
  return cachedDb;
}

export * from './schema';
