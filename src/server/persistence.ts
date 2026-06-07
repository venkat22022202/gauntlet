/**
 * GAUNTLET — persistence (real Drizzle queries).
 * No-ops gracefully when the DB is not configured.
 */

import { eq, desc, and, lt, count } from "drizzle-orm";
import { getDb } from "./db";
import { scans, scanResults, leaderboard } from "./db/schema";
import type { AttackOutcome } from "@/lib/runner";

export interface SaveScanInput {
  userId?: string | null;
  label?: string | null;
  model: string;
  endpointHost?: string | null;
  systemPrompt: string;
  outcomes: AttackOutcome[];
  score: number;
  breached: number;
  partial: number;
  blocked: number;
  isPublic?: boolean;
  agentName?: string | null;
  source?: string | null;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Persist a completed scan. Returns the scan id, or null if DB disabled. */
export async function saveScan(input: SaveScanInput): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  const isPublic = Boolean(input.isPublic);
  const promptHash = await sha256(input.systemPrompt);

  const [scan] = await db
    .insert(scans)
    .values({
      userId: input.userId ?? null,
      label: input.label ?? null,
      model: input.model,
      endpointHost: input.endpointHost ?? null,
      promptHash,
      promptText: isPublic ? input.systemPrompt : null,
      score: input.score,
      totalAttacks: input.outcomes.length,
      breached: input.breached,
      partial: input.partial,
      blocked: input.blocked,
      isPublic,
    })
    .returning({ id: scans.id });

  const scanId = scan.id;

  if (input.outcomes.length > 0) {
    await db.insert(scanResults).values(
      input.outcomes.map((o) => ({
        scanId,
        attackId: o.attackId,
        name: o.name,
        technique: o.technique,
        category: o.category,
        severity: o.severity,
        verdict: o.verdict,
        reasons: o.reasons,
        // only retain transcripts for public submissions
        response: isPublic ? o.response : null,
      }))
    );
  }

  if (isPublic && input.agentName) {
    await db.insert(leaderboard).values({
      agentName: input.agentName,
      source: input.source ?? null,
      model: input.model,
      score: input.score,
      breached: input.breached,
      scanId,
    });
  }

  return scanId;
}

export interface ScanReport {
  scan: typeof scans.$inferSelect;
  results: (typeof scanResults.$inferSelect)[];
}

export async function getScanReport(id: string): Promise<ScanReport | null> {
  const db = getDb();
  if (!db) return null;
  const [scan] = await db.select().from(scans).where(eq(scans.id, id)).limit(1);
  if (!scan) return null;
  const results = await db
    .select()
    .from(scanResults)
    .where(eq(scanResults.scanId, id))
    .orderBy(scanResults.createdAt);
  return { scan, results };
}

export async function getLeaderboard(limit = 50) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(leaderboard)
    .orderBy(desc(leaderboard.breached), desc(leaderboard.createdAt))
    .limit(limit);
}

/**
 * Percentile rank of a score among all saved scans: the share of past scans
 * that were *less hardened* (a strictly lower score). Returns the percentile
 * and the sample size (so the UI can stay honest at small N), or null when the
 * DB is disabled or empty.
 */
export async function getScorePercentile(
  score: number
): Promise<{ percentile: number; sample: number } | null> {
  const db = getDb();
  if (!db) return null;
  const totalRow = await db.select({ n: count() }).from(scans);
  const total = Number(totalRow[0]?.n ?? 0);
  if (total < 1) return null;
  const belowRow = await db.select({ n: count() }).from(scans).where(lt(scans.score, score));
  const below = Number(belowRow[0]?.n ?? 0);
  return { percentile: Math.round((below / total) * 100), sample: total };
}

export async function getRecentPublicScans(limit = 20) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(scans)
    .where(and(eq(scans.isPublic, true)))
    .orderBy(desc(scans.createdAt))
    .limit(limit);
}
