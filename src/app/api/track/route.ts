import { NextRequest } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { getDb } from "@/server/db";
import { visits } from "@/server/db/schema";

export const runtime = "nodejs";

const Body = z.object({
  path: z.string().max(300).default("/"),
  ref: z.string().max(300).optional(),
});

const SALT = process.env.GAUNTLET_VISIT_SALT || "gauntlet-visit-v1";

/**
 * POST /api/track — fire-and-forget page-view beacon.
 * Records a SALTED HASH of the IP (never the raw IP) + path + country.
 * Always returns 204; never blocks or errors the client.
 */
export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return new Response(null, { status: 204 });
  }

  const db = getDb();
  if (!db) return new Response(null, { status: 204 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ipHash = createHash("sha256").update(`${ip}:${SALT}`).digest("hex").slice(0, 32);
  const country = req.headers.get("x-vercel-ip-country") ?? null;
  const ua = req.headers.get("user-agent")?.slice(0, 300) ?? null;

  db.insert(visits)
    .values({ ipHash, path: body.path, referrer: body.ref ?? null, country, userAgent: ua })
    .then(() => {})
    .catch(() => {});

  return new Response(null, { status: 204 });
}
