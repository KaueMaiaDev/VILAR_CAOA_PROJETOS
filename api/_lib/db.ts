import { Pool, type PoolClient } from "pg";

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error(
    "Missing DATABASE_URL. Set it to your Supabase Postgres connection string " +
      "(Project Settings -> Database -> Connection string -> Transaction pooler, port 6543). " +
      "See .env.example."
  );
}

// Each serverless invocation may spin up its own process, so a large pool per
// instance would exhaust Supabase's connection limit under concurrent
// requests. Supabase's Transaction pooler (pgbouncer) is designed for exactly
// this fan-out pattern; keep the local pool small and let pgbouncer do the
// heavy multiplexing.
export const pool = new Pool({
  connectionString,
  max: 3,
  idleTimeoutMillis: 10_000,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
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
