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
  category: Attack["category"];
  severity: Attack["severity"];
  technique: string;
  verdict: Verdict;
  reasons: string[];
  prompt: string;
  response: string;
  severityWeight: number;
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
    verdict = "blocked";
    reasons = [`Attack errored (counted as blocked): ${(err as Error).message}`];
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
