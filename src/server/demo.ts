/**
 * GAUNTLET — server-side demo model config.
 *
 * Powers the no-key "live demo" scan and the "can you break it?" game so a
 * first-time visitor gets a real result with ZERO setup. Uses a dedicated demo
 * key if provided, otherwise falls back to the Gemini key that already powers
 * the suggestion engine (OpenAI-compatible endpoint). Never exposed to clients.
 */

export interface DemoModel {
  endpoint: string;
  apiKey: string;
  model: string;
}

export function demoModel(): DemoModel {
  return {
    endpoint:
      process.env.GAUNTLET_DEMO_ENDPOINT ||
      "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKey: process.env.GAUNTLET_DEMO_KEY || process.env.GAUNTLET_SUGGEST_KEY || "",
    model:
      process.env.GAUNTLET_DEMO_MODEL ||
      process.env.GAUNTLET_SUGGEST_MODEL ||
      "gemini-3.5-flash",
  };
}

/** Whether a server key is available to run no-key demos / the game. */
export function demoConfigured(): boolean {
  return Boolean(process.env.GAUNTLET_DEMO_KEY || process.env.GAUNTLET_SUGGEST_KEY);
}
