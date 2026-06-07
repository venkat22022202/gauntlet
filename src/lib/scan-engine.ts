/**
 * GAUNTLET — shared scan-stream engine.
 * ---------------------------------------------------------------
 * The single source of truth for running a prepared attack list against a
 * target and streaming NDJSON outcomes. Both the real scan (/api/scan, the
 * user's own key) and the no-key live demo (/api/demo-scan, a server key) use
 * this — so there is exactly one streaming/concurrency/scoring/persistence path.
 *
 * Events emitted (one JSON object per line):
 *   { type: "meta",   total, model }
 *   { type: "result", index, outcome }
 *   { type: "done",   score, breached, partial, blocked, errored, scanId }
 *   { type: "error",  message }
 */

import { runPrepared, type ScanTarget, type AttackOutcome, type PreparedAttack } from "./runner";
import { scoreFromResults, type Verdict, type Canary } from "./judge";
import { saveScan } from "@/server/persistence";

export interface ScanStreamInput {
  target: ScanTarget;
  prepared: PreparedAttack[];
  canary: Canary;
  wrapped: string;
  save?: boolean;
  label?: string | null;
  makePublic?: boolean;
  agentName?: string | null;
  source?: string | null;
  /** bounded concurrency so the console fills fast without hammering the provider */
  concurrency?: number;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export function createScanStream(input: ScanStreamInput): ReadableStream<Uint8Array> {
  const { target, prepared, canary, wrapped } = input;
  const save = input.save ?? true;
  const concurrency = input.concurrency ?? 4;
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      send({ type: "meta", total: prepared.length, model: target.model });

      const tally = { breached: 0, partial: 0, blocked: 0, error: 0 };
      const weighted: { verdict: Verdict; severityWeight: number }[] = [];
      const collected: AttackOutcome[] = [];

      let cursor = 0;
      let emitted = 0;

      async function worker() {
        while (cursor < prepared.length) {
          const i = cursor++;
          const outcome = await runPrepared(target, prepared[i], canary, wrapped);
          tally[outcome.verdict]++;
          weighted.push({ verdict: outcome.verdict, severityWeight: outcome.severityWeight });
          collected.push(outcome);
          send({ type: "result", index: emitted++, outcome });
        }
      }

      try {
        await Promise.all(
          Array.from({ length: Math.min(concurrency, prepared.length) }, () => worker())
        );

        const score = scoreFromResults(weighted); // null if every attack errored

        let scanId: string | null = null;
        if (save && score !== null) {
          try {
            scanId = await saveScan({
              label: input.label ?? null,
              model: target.model,
              endpointHost: hostOf(target.endpoint),
              systemPrompt: target.systemPrompt,
              outcomes: collected,
              score,
              breached: tally.breached,
              partial: tally.partial,
              blocked: tally.blocked,
              isPublic: input.makePublic ?? false,
              agentName: input.agentName ?? null,
              source: input.source ?? null,
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
}
