import { NextRequest } from "next/server";
import { z } from "zod";
import { prepareScan, buildBuiltinPrepared, type ScanTarget } from "@/lib/runner";
import { createScanStream } from "@/lib/scan-engine";
import { DEMO_AGENT, DEMO_ATTACK_IDS } from "@/lib/demo-agents";
import { demoModel, demoConfigured } from "@/server/demo";
import { rateLimit, clientIp } from "@/server/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  // optional: test the visitor's own prompt with the server key (kept private).
  systemPrompt: z.string().max(8000).optional(),
});

function err(message: string, status: number) {
  return new Response(JSON.stringify({ type: "error", message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/demo-scan — a no-key live scan against a sample agent (or the
 * visitor's pasted prompt), powered by a server key. The frictionless first
 * run: a real breach dossier in ~60s with zero setup. Bounded (a curated attack
 * subset) and rate-limited so it can't be abused.
 */
export async function POST(req: NextRequest) {
  if (!demoConfigured()) {
    return err("The live demo isn't configured on this server. Add your own key on /scan.", 503);
  }

  const rl = await rateLimit("demo", clientIp(req), 5, "1 h");
  if (rl.limited) {
    return err("Demo limit reached for now — paste your own key on /scan to keep going (it's free).", 429);
  }

  let body: z.infer<typeof Body> = {};
  try {
    body = Body.parse(await req.json().catch(() => ({})));
  } catch {
    body = {};
  }

  const cfg = demoModel();
  const custom = body.systemPrompt?.trim();
  const systemPrompt = custom || DEMO_AGENT.systemPrompt;

  const target: ScanTarget = {
    endpoint: cfg.endpoint,
    apiKey: cfg.apiKey,
    model: cfg.model,
    systemPrompt,
  };

  const { canary, wrapped } = prepareScan(target);
  const prepared = buildBuiltinPrepared(canary).filter((p) => DEMO_ATTACK_IDS.includes(p.id));

  const stream = createScanStream({
    target,
    prepared,
    canary,
    wrapped,
    save: true,
    // a custom prompt is the visitor's own — keep it private (no transcripts stored);
    // the canned sample agent is public so its dossier is fully shareable.
    makePublic: !custom,
    label: custom ? "Your agent (demo)" : DEMO_AGENT.label,
    source: "demo",
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
    },
  });
}
