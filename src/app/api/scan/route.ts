import { NextRequest } from "next/server";
import { z } from "zod";
import {
  prepareScan,
  buildBuiltinPrepared,
  type ScanTarget,
  type PreparedAttack,
} from "@/lib/runner";
import { createScanStream } from "@/lib/scan-engine";
import { rateLimit, clientIp } from "@/server/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const SEVERITY = z.enum(["low", "medium", "high", "critical"]);

const BodySchema = z.object({
  endpoint: z.string().url().default("https://api.openai.com/v1"),
  apiKey: z.string().min(1),
  model: z.string().min(1).default("gpt-5.4-mini"),
  systemPrompt: z.string().default(""),
  includeBuiltins: z.boolean().default(true),
  customAttacks: z
    .array(
      z.object({
        name: z.string().max(120).optional(),
        prompt: z.string().min(1).max(8000),
        category: z.string().max(60).optional(),
        severity: SEVERITY.optional(),
        technique: z.string().max(160).optional(),
      })
    )
    .max(40)
    .optional(),
  save: z.boolean().default(true),
  label: z.string().max(120).optional(),
  makePublic: z.boolean().default(false),
  agentName: z.string().max(80).optional(),
});

function err(message: string, status: number) {
  return new Response(JSON.stringify({ type: "error", message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/scan — streams NDJSON outcomes (see scan-engine for the event shape).
 * The endpoint + key you provide must be for a system you own or are authorized
 * to test. Light per-IP rate limit guards our infra (the model cost is yours).
 */
export async function POST(req: NextRequest) {
  // Generous limit — the user is spending their own key; this only stops abuse.
  const rl = await rateLimit("scan", clientIp(req), 40, "10 m");
  if (rl.limited) return err("Too many scans from this IP — give it a minute.", 429);

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return err(`Invalid request: ${(e as Error).message}`, 400);
  }

  const target: ScanTarget = {
    endpoint: body.endpoint,
    apiKey: body.apiKey,
    model: body.model,
    systemPrompt: body.systemPrompt,
  };

  const { canary, wrapped } = prepareScan(target);

  const prepared: PreparedAttack[] = [];
  if (body.includeBuiltins) prepared.push(...buildBuiltinPrepared(canary));
  if (body.customAttacks?.length) {
    body.customAttacks.forEach((c, i) => {
      prepared.push({
        id: `custom-${i}`,
        name: c.name?.trim() || `Custom ${i + 1}`,
        category: c.category || "instruction_override",
        severity: c.severity || "high",
        technique: c.technique || "AI-suggested / custom",
        prompt: c.prompt.replace(/\{\{\s*forbidden\s*\}\}/gi, canary.forbidden),
      });
    });
  }

  if (prepared.length === 0) {
    return err("No attacks selected — enable built-ins or add suggested injections.", 400);
  }

  const stream = createScanStream({
    target,
    prepared,
    canary,
    wrapped,
    save: body.save,
    label: body.label ?? null,
    makePublic: body.makePublic,
    agentName: body.agentName ?? null,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
    },
  });
}
