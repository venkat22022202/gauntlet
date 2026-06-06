import { NextRequest } from "next/server";
import { z } from "zod";
import { prepareScan, runOneAttack, type ScanTarget, type AttackOutcome } from "@/lib/runner";
import { scoreFromResults, type Verdict } from "@/lib/judge";
import { saveScan } from "@/server/persistence";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  endpoint: z.string().url().default("https://api.openai.com/v1"),
  apiKey: z.string().min(1),
  model: z.string().min(1).default("gpt-5.4-mini"),
  systemPrompt: z.string().default(""),
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

  const { canary, wrapped, attacks } = prepareScan(target);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      send({ type: "meta", total: attacks.length, model: target.model });

      const tally = { breached: 0, partial: 0, blocked: 0 };
      const weighted: { verdict: Verdict; severityWeight: number }[] = [];
      const collected: AttackOutcome[] = [];

      // bounded concurrency so the console fills quickly without hammering
      const CONCURRENCY = 4;
      let cursor = 0;
      let emitted = 0;

      async function worker() {
        while (cursor < attacks.length) {
          const myIndex = cursor++;
          const outcome = await runOneAttack(target, attacks[myIndex], canary, wrapped);
          tally[outcome.verdict]++;
          weighted.push({ verdict: outcome.verdict, severityWeight: outcome.severityWeight });
          collected.push(outcome);
          send({ type: "result", index: emitted++, outcome });
        }
      }

      try {
        await Promise.all(
          Array.from({ length: Math.min(CONCURRENCY, attacks.length) }, () => worker())
        );

        const score = scoreFromResults(weighted);

        // Persist the scan if a DB is configured (returns null otherwise).
        let scanId: string | null = null;
        if (body.save) {
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
          score,
          breached: tally.breached,
          partial: tally.partial,
          blocked: tally.blocked,
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
