/**
 * GAUNTLET — optional persistence layer (Drizzle + Neon Postgres).
 *
 * The core scan demo does NOT require this. These tables power the
 * roadmap features: saved scan history, the public agent leaderboard,
 * and shareable report permalinks. Run `npx drizzle-kit push` with a
 * DATABASE_URL set to enable them.
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  // null = anonymous one-off scan; set when accounts (Clerk) are wired
  userId: text("user_id"),
  label: text("label"),
  model: text("model").notNull(),
  endpointHost: text("endpoint_host"), // host only — never the key
  // we store a SHA-256 hash of the system prompt, not the prompt itself,
  // unless the user explicitly opts in to a public leaderboard entry
  promptHash: text("prompt_hash").notNull(),
  promptText: text("prompt_text"), // populated only for public submissions
  score: integer("score").notNull(),
  totalAttacks: integer("total_attacks").notNull(),
  breached: integer("breached").notNull(),
  partial: integer("partial").notNull(),
  blocked: integer("blocked").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scanResults = pgTable("scan_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  scanId: uuid("scan_id")
    .references(() => scans.id, { onDelete: "cascade" })
    .notNull(),
  attackId: text("attack_id").notNull(),
  name: text("name").notNull(),
  technique: text("technique"),
  category: text("category").notNull(),
  severity: text("severity").notNull(),
  verdict: text("verdict").notNull(), // blocked | partial | breached
  reasons: jsonb("reasons").default([]),
  // model response is stored ONLY for public leaderboard submissions
  response: text("response"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Lightweight, privacy-respecting page-view log.
 * Stores a salted hash of the IP (never the raw IP). Distinct ip_hash per
 * day ≈ unique visitors; row count ≈ pageviews.
 */
export const visits = pgTable("visits", {
  id: uuid("id").primaryKey().defaultRandom(),
  ipHash: text("ip_hash").notNull(),
  path: text("path").notNull(),
  referrer: text("referrer"),
  country: text("country"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Public leaderboard of red-teamed, opted-in agent prompts. */
export const leaderboard = pgTable("leaderboard", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentName: text("agent_name").notNull(),
  source: text("source"), // where the prompt came from (with permission)
  model: text("model").notNull(),
  score: integer("score").notNull(),
  breached: integer("breached").notNull(),
  scanId: uuid("scan_id").references(() => scans.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
