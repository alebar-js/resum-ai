import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema.js';

type DbCache = {
  sql: ReturnType<typeof postgres>;
  db: ReturnType<typeof drizzle<typeof schema>>;
};

const globalForDb = globalThis as unknown as { __vercelDb?: DbCache };

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function createDb(): DbCache {
  const url = requiredEnv('DATABASE_URL');
  const sql = postgres(url, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: 'require',
  });
  const db = drizzle(sql, { schema });
  return { sql, db };
}

export function getDb() {
  if (!globalForDb.__vercelDb) {
    globalForDb.__vercelDb = createDb();
  }
  return globalForDb.__vercelDb.db;
}

