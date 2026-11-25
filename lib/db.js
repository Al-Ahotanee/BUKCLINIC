import { neon } from "@neondatabase/serverless";

let _sql;
// sql.query(text, params) with $1, $2 placeholders; works over HTTP on Vercel serverless.
export function db() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

export async function query(text, params = []) {
  return db().query(text, params);
}
