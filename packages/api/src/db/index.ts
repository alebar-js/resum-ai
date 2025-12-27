import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://user:password@localhost:5432/resumai';

type DbCache = {
  client: ReturnType<typeof postgres>;
  db: ReturnType<typeof drizzle<typeof schema>>;
};

const globalForDb = globalThis as unknown as { __appDb?: DbCache };

function createDb(): DbCache {
  const client = postgres(connectionString, {
    max: 1, // serverless-safe
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: 'require',
  });
  const db = drizzle(client, { schema });
  return { client, db };
}

if (!globalForDb.__appDb) {
  globalForDb.__appDb = createDb();
}

export const db = globalForDb.__appDb.db;

