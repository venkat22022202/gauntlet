import { NextRequest } from "next/server";
import { z } from "zod";
import {
  prepareScan,
  runPrepared,
  buildBuiltinPrepared,
  type ScanTarget,
  type AttackOutcome,
  type PreparedAttack,
} from "@/lib/runner";
import { scoreFromResults, type Verdict } from "@/lib/judge";
import { saveScan } from "@/server/persistence";

export const runtime = "nodejs";
export const maxDuration = 60;

const SEVERITY = z.enum(["low", "medium", "high", "critical"]);

const BodySchema = z.object({
  endpoint: z.string().url().default("https://api.openai.com/v1"),
  apiKey: z.string().min(1),
  model: z.string().min(1).default("gpt-5.4-mini"),
  systemPrompt: z.string().default(""),
  // attack selection
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
  // optional persistence
  save: z.boolean().default(true),
  label: z.string().max(120).optional(),
  makePublic: z.boolean().default(false),
  agentName: z.string().max(80).optional(),
});

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * POST /api/scan
 * Streams newline-delimited JSON (NDJSON), one object per event:
 *   { type: "meta",    total, model }
 *   { type: "result",  index, outcome }
 *   { type: "done",    score, breached, partial, blocked }
 *   { type: "error",   message }
 *
 * Authorized-use only: the endpoint + key you provide must be for a
 * system you own or have permission to test.
 */
export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return new Response(
      JSON.stringify({ type: "error", message: `Invalid request: ${(err as Error).message}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const target: ScanTarget = {
    endpoint: body.endpoint,
    apiKey: body.apiKey,
    model: body.model,
    systemPrompt: body.systemPrompt,
  };

  const { canary, wrapped } = prepareScan(target);

  // Build the run list: built-in attacks (optional) + AI-suggested / custom attacks.
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
    return new Response(
      JSON.stringify({ type: "error", message: "No attacks selected — enable built-ins or add suggested injections." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      send({ type: "meta", total: prepared.length, model: target.model });

      const tally = { breached: 0, partial: 0, blocked: 0, error: 0 };
      const weighted: { verdict: Verdict; severityWeight: number }[] = [];
      const collected: AttackOutcome[] = [];

      // bounded concurrency so the console fills quickly without hammering
      const CONCURRENCY = 4;
      let cursor = 0;
      let emitted = 0;

      async function worker() {
        while (cursor < prepared.length) {
          const myIndex = cursor++;
          const outcome = await runPrepared(target, prepared[myIndex], canary, wrapped);
          tally[outcome.verdict]++;
          weighted.push({ verdict: outcome.verdict, severityWeight: outcome.severityWeight });
          collected.push(outcome);
          send({ type: "result", index: emitted++, outcome });
        }
      }

      try {
        await Promise.all(
          Array.from({ length: Math.min(CONCURRENCY, prepared.length) }, () => worker())
        );

        const score = scoreFromResults(weighted); // null if every attack errored

        // Persist only meaningful scans (at least one attack actually ran).
        let scanId: string | null = null;
        if (body.save && score !== null) {
          try {
            scanId = await saveScan({
              label: body.label ?? null,
              model: target.model,
              endpointHost: hostOf(target.endpoint),
              systemPrompt: target.systemPrompt,
              outcomes: collected,
              score,
              breached: tally.breached,
              partial: tally.partial,
              blocked: tally.blocked,
              isPublic: body.makePublic,
              agentName: body.agentName ?? null,
            });
          } catch {
            // persistence is best-effort; never fail the scan because of it
            scanId = null;
          }
        }

        send({
          type: "done",
          score, // number, or null when nothing reached the model
          breached: tally.breached,
          partial: tally.partial,
          blocked: tally.blocked,
          errored: tally.error,
          scanId,
        });
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
    },
  });
}
