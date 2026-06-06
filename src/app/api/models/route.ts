import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  endpoint: z.string().url(),
  apiKey: z.string().min(1),
});

/**
 * POST /api/models — list the models available to the given key.
 * Works for any OpenAI-compatible provider (OpenAI, Anthropic OpenAI-compat,
 * Google Gemini OpenAI-compat, OpenRouter, local Ollama) via GET {endpoint}/models.
 */
export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: `Invalid request: ${(err as Error).message}` }, { status: 400 });
  }

  const url = `${body.endpoint.replace(/\/$/, "")}/models`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${body.apiKey}` } });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return NextResponse.json({ error: `Provider ${res.status}: ${t.slice(0, 200)}` }, { status: res.status });
    }
    const data = await res.json();
    // OpenAI/compat: { data: [{ id }] } · some return { models: [{ id|name }] }
    const raw: unknown[] = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.models)
        ? data.models
        : [];
    const models = raw
      .map((m) => (m as { id?: string; name?: string }).id ?? (m as { name?: string }).name)
      .filter((x): x is string => Boolean(x))
      // hide obvious non-text models (embeddings, image, audio, tts, whisper, moderation)
      .filter((id) => !/embedding|whisper|tts|dall-e|moderation|image|audio|rerank|guard/i.test(id))
      .sort();
    return NextResponse.json({ models: Array.from(new Set(models)) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
