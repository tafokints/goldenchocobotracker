import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb, hasDatabaseEnv } from '@/db';
import { hasRedisEnv } from '@/lib/redis-cards';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();

  if (hasDatabaseEnv()) {
    const start = Date.now();
    try {
      const db = getDb();
      await db.execute(sql`SELECT 1`);
      return NextResponse.json(
        {
          status: 'ok',
          store: 'postgres',
          dbLatencyMs: Date.now() - start,
          timestamp,
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        }
      );
    } catch {
      return NextResponse.json(
        {
          status: 'degraded',
          store: 'postgres',
          dbLatencyMs: Date.now() - start,
          timestamp,
        },
        {
          status: 503,
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        }
      );
    }
  }

  return NextResponse.json(
    {
      status: 'ok',
      store: hasRedisEnv() ? 'redis' : 'fallback',
      dbLatencyMs: null,
      timestamp,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    }
  );
}
