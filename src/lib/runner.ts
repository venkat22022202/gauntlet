/**
 * GAUNTLET — Scan Runner
 * ---------------------------------------------------------------
 * Orchestrates a red-team scan against an OpenAI-compatible chat
 * endpoint that YOU own or are authorized to test. For each attack it:
 *   1. sends [ wrapped system prompt , attack message ]
 *   2. captures the model's reply
 *   3. judges whether the prompt was breached
 *
 * Provider-agnostic: works with OpenAI, Azure OpenAI, OpenRouter, Together,
 * a local llama.cpp/Ollama OpenAI shim, or your own gateway — anything that
 * speaks POST /chat/completions.
 */

import { ATTACKS, type Attack } from "./attacks";
import {
  mintCanary,
  wrapSystemPrompt,
  judge,
  severityWeight,
  type Verdict,
} from "./judge";

export interface ScanTarget {
  /** base URL, e.g. https://api.openai.com/v1 */
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
}

export interface AttackOutcome {
  attackId: string;
  name: string;
  category: string;
  severity: Attack["severity"];
  technique: string;
  verdict: Verdict;
  reasons: string[];
  prompt: string;
  response: string;
  severityWeight: number;
}

/** A ready-to-fire attack with a final prompt string (built-in OR AI-suggested/custom). */
export interface PreparedAttack {
  id: string;
  name: string;
  category: string;
  severity: Attack["severity"];
  technique: string;
  prompt: string;
}

async function callModel(
  target: ScanTarget,
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal
): Promise<string> {
  const url = `${target.endpoint.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${target.apiKey}`,
    },
    body: JSON.stringify({
      model: target.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0,
      max_tokens: 600,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Provider ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

/**
 * Run a single attack and judge it. Exposed so the API route can stream
 * outcomes one-by-one for the live attack console.
 */
export async function runOneAttack(
  target: ScanTarget,
  attack: Attack,
  canary: ReturnType<typeof mintCanary>,
  wrapped: string,
  signal?: AbortSignal
): Promise<AttackOutcome> {
  const prompt = attack.build({ forbidden: canary.forbidden });
  let response = "";
  let verdict: Verdict = "blocked";
  let reasons: string[] = [];
  try {
    response = await callModel(target, wrapped, prompt, signal);
    const j = judge(response, canary, target.systemPrompt);
    verdict = j.verdict;
    reasons = j.reasons;
  } catch (err) {
    response = "";
    verdict = "error";
    reasons = [`Attack never reached the model: ${(err as Error).message}`];
  }
  return {
    attackId: attack.id,
    name: attack.name,
    category: attack.category,
    severity: attack.severity,
    technique: attack.technique,
    verdict,
    reasons,
    prompt,
    response,
    severityWeight: severityWeight(attack.severity),
  };
}

export interface PreparedScan {
  canary: ReturnType<typeof mintCanary>;
  wrapped: string;
  attacks: Attack[];
}

export function prepareScan(target: ScanTarget): PreparedScan {
  const canary = mintCanary();
  const wrapped = wrapSystemPrompt(target.systemPrompt, canary);
  return { canary, wrapped, attacks: ATTACKS };
}

/** The 21 built-in attacks as PreparedAttacks (forbidden token already substituted). */
export function buildBuiltinPrepared(canary: ReturnType<typeof mintCanary>): PreparedAttack[] {
  return ATTACKS.map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category,
    severity: a.severity,
    technique: a.technique,
    prompt: a.build({ forbidden: canary.forbidden }),
  }));
}

/** Run one prepared attack (built-in or AI-suggested) and judge it. */
export async function runPrepared(
  target: ScanTarget,
  prep: PreparedAttack,
  canary: ReturnType<typeof mintCanary>,
  wrapped: string,
  signal?: AbortSignal
): Promise<AttackOutcome> {
  let response = "";
  let verdict: Verdict = "blocked";
  let reasons: string[] = [];
  try {
    response = await callModel(target, wrapped, prep.prompt, signal);
    const j = judge(response, canary, target.systemPrompt);
    verdict = j.verdict;
    reasons = j.reasons;
  } catch (err) {
    response = "";
    verdict = "error";
    reasons = [`Attack never reached the model: ${(err as Error).message}`];
  }
  return {
    attackId: prep.id,
    name: prep.name,
    category: prep.category,
    severity: prep.severity,
    technique: prep.technique,
    verdict,
    reasons,
    prompt: prep.prompt,
    response,
    severityWeight: severityWeight(prep.severity),
  };
}
