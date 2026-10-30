import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

/*
 * node-postgres returns BIGINT/NUMERIC as strings to protect precision.
 * Every id and counter in Ezzy Fitness fits in a JS number, so normalise both
 * here — otherwise `user.id` arrives as a string and token/session checks fail.
 */
types.setTypeParser(20, (v) => Number(v)); // int8
types.setTypeParser(1700, (v) => parseFloat(v)); // numeric

/**
 * Singleton Postgres pool for Neon.
 * `globalThis` keeps a single pool alive across Next.js dev hot-reloads.
 */
const globalForDb = globalThis as unknown as { __ezzyPool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Create .env.local from .env.example and add your Neon connection string."
    );
  }
  return new Pool({
    connectionString,
    // Neon requires TLS; the driver verifies the server cert opportunistically
    // so it works the same on localhost dev and in production.
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    // Neon free tier pauses after inactivity — retry once on cold start.
    statement_timeout: 20_000,
  });
}

export function getPool(): Pool {
  if (!globalForDb.__ezzyPool) globalForDb.__ezzyPool = createPool();
  return globalForDb.__ezzyPool;
}

/** Run a parameterised query and return every row. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = []
): Promise<T[]> {
  const res = await getPool().query<T>(text, params as unknown[]);
  return res.rows;
}

/** Return the first row or `null`. */
export async function one<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Return a single scalar column from the first row. */
export async function scalar<T = unknown>(
  text: string,
  params: readonly unknown[] = []
): Promise<T | null> {
  const row = await one<Record<string, unknown>>(text, params);
  if (!row) return null;
  const first = Object.values(row)[0];
  return (first ?? null) as T | null;
}

/** Run several statements inside one transaction. */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Lightweight health probe used by the dashboard shell. */
export async function pingDb(): Promise<{ ok: boolean; latencyMs: number }> {
  const t0 = Date.now();
  try {
    await scalar("SELECT 1");
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch {
    return { ok: false, latencyMs: Date.now() - t0 };
  }
}
