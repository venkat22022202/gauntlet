/**
 * GAUNTLET — database client (Drizzle + Neon serverless).
 *
 * Lazily constructed. If DATABASE_URL is not set, `db` is null and the app
 * runs in stateless demo mode (scans still work, they just aren't saved).
 * When DATABASE_URL is set, every query below is real.
 */

import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> | null {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export const dbEnabled = () => Boolean(process.env.DATABASE_URL);

export { schema };
