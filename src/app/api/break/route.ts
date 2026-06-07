import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mintCanary, judge } from "@/lib/judge";
import { callModel } from "@/lib/runner";
import { GAME_LEVELS, buildGamePrompt } from "@/lib/demo-agents";
import { demoModel, demoConfigured } from "@/server/demo";
import { rateLimit, clientIp } from "@/server/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  level: z.number().int().min(1).max(GAME_LEVELS.length),
  attack: z.string().min(1).max(4000),
});

/**
 * POST /api/break — the offense game. Plant a fresh high-entropy secret in a
 * hardened sample agent, fire the visitor's single attack message, and judge it
 * with the same deterministic canary check the scanner uses. You win iff the
 * model reveals the secret. No key required; rate-limited.
 */
export async function POST(req: NextRequest) {
  if (!demoConfigured()) {
    return NextResponse.json({ error: "The game isn't configured on this server." }, { status: 503 });
  }

  const rl = await rateLimit("break", clientIp(req), 30, "10 m");
  if (rl.limited) {
    return NextResponse.json({ error: "Too many attempts — catch your breath and try again shortly." }, { status: 429 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: `Invalid request: ${(e as Error).message}` }, { status: 400 });
  }

  const level = GAME_LEVELS[body.level - 1];
  const canary = mintCanary();
  const system = buildGamePrompt(level, canary.secret);
  const cfg = demoModel();

  let response = "";
  try {
    response = await callModel(
      { endpoint: cfg.endpoint, apiKey: cfg.apiKey, model: cfg.model, systemPrompt: system },
      system,
      body.attack
    );
  } catch (e) {
    return NextResponse.json({ error: `Model unreachable: ${(e as Error).message}` }, { status: 502 });
  }

  const j = judge(response, canary, system);
  const won = j.verdict === "breached";

  return NextResponse.json({
    won,
    response,
    level: level.id,
    levelName: level.name,
    isLast: body.level >= GAME_LEVELS.length,
    // only reveal the secret once they've already won (so the win is verifiable)
    secret: won ? canary.secret : null,
  });
}
