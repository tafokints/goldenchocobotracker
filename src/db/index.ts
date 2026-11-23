import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export type AppDb = NeonHttpDatabase<typeof schema>;

let cachedDb: AppDb | null = null;

export function hasDatabaseEnv(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb(): AppDb {
  if (!hasDatabaseEnv()) {
    throw new Error('DATABASE_URL environment variable is not configured');
  }
  if (!cachedDb) {
    const sql = neon(process.env.DATABASE_URL!);
    cachedDb = drizzle(sql, { schema });
  }
  return cachedDb;
}

export * from './schema';
