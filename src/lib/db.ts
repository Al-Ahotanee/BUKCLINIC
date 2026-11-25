import { neon } from "@neondatabase/serverless";

/**
 * Data layer for the BUK Clinic appointment system.
 *
 * Production (Vercel + Neon): when DATABASE_URL is set, every query runs
 * through the Neon serverless HTTP driver — identical behaviour to the
 * original app.
 *
 * Local preview / development: when DATABASE_URL is absent, queries run on
 * an embedded Postgres (PGlite) that speaks the same SQL dialect, is created
 * from the same schema in scripts/migrate.mjs, and is seeded with demo data
 * so the whole product can be explored without a cloud database.
 */

type Row = Record<string, unknown>;

interface SqlClient {
  query<T extends Row = Row>(text: string, params?: unknown[]): Promise<T[]>;
}

declare global {
  var __bukClinicSql: Promise<SqlClient> | undefined;
}
async function initEmbeddedPostgres(): Promise<SqlClient> {
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite("./db/pglite-data");
  const { SCHEMA_SQL, seedDemoData } = await import("./demo-seed");
  await pg.exec(SCHEMA_SQL);
  await seedDemoData(pg);
  return {
    async query<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
      const res = await pg.query(text, params as never[]);
      return res.rows as T[];
    },
  };
}

function neonClient(url: string): SqlClient {
  const sql = neon(url);
  return {
    query<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
      return sql.query(text, params as never[]) as Promise<T[]>;
    },
  };
}

// sql.query(text, params) with $1, $2 placeholders; works over HTTP on Vercel serverless.
export async function query<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const url = process.env.DATABASE_URL || "";
  // Only genuine Postgres connection strings go to Neon; anything else
  // (e.g. a leftover SQLite URL in local env files) falls back to the
  // embedded preview database.
  const isPostgres = /^postgres(ql)?:\/\//i.test(url);
  if (url && isPostgres) {
    return neonClient(url).query<T>(text, params);
  }
  if (!globalThis.__bukClinicSql) {
    globalThis.__bukClinicSql = initEmbeddedPostgres();
  }
  const client = await globalThis.__bukClinicSql;
  return client.query<T>(text, params);
}
