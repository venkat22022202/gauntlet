"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Crosshair,
  Radar,
  Play,
  ShieldCheck,
  ShieldAlert,
  TriangleAlert,
  ChevronDown,
  KeyRound,
  ServerCog,
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCw,
  Ban,
  Sparkles,
  X,
  Plus,
} from "lucide-react";
import { GradeBadge } from "@/components/grade-badge";
import { gradeFromScore, brutalVerdict, killingBlow } from "@/lib/grade";

type Verdict = "blocked" | "breached" | "partial" | "error";

interface Outcome {
  attackId: string;
  name: string;
  category: string;
  severity: string;
  technique: string;
  verdict: Verdict;
  reasons: string[];
  prompt: string;
  response: string;
}

interface Summary {
  score: number | null; // null = every attack errored (no meaningful score)
  breached: number;
  partial: number;
  blocked: number;
  errored?: number;
  scanId?: string | null;
}

interface SuggestedAttack {
  name: string;
  prompt: string;
  category?: string;
  severity?: string;
  technique?: string;
}

const SEV_COLOR: Record<string, string> = {
  low: "#6b6680",
  medium: "#f5a524",
  high: "#ff5d7a",
  critical: "#ff2d55",
};

const V: Record<Verdict, { c: string; label: string; Icon: typeof ShieldCheck }> = {
  blocked: { c: "#22c55e", label: "BLOCKED", Icon: ShieldCheck },
  partial: { c: "#f5a524", label: "PARTIAL", Icon: TriangleAlert },
  breached: { c: "#ff2d55", label: "BREACHED", Icon: ShieldAlert },
  error: { c: "#6b6680", label: "ERROR", Icon: Ban },
};

const PRESET_MODELS = [
  "gpt-5.5",
  "gpt-5.4-mini",
  "gpt-5.4-nano",
  "claude-sonnet-4-6",
  "claude-opus-4-8",
  "claude-haiku-4-5",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "meta-llama/llama-3.3-70b-instruct",
];

// Endpoints are OpenAI-compatible; the runner appends /chat/completions.
const PROVIDER_PRESETS = [
  { id: "openai", label: "OpenAI", endpoint: "https://api.openai.com/v1", model: "gpt-5.4-mini" },
  { id: "anthropic", label: "Claude", endpoint: "https://api.anthropic.com/v1", model: "claude-sonnet-4-6" },
  { id: "gemini", label: "Google Gemini", endpoint: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-3.5-flash" },
  { id: "openrouter", label: "OpenRouter (OSS)", endpoint: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.3-70b-instruct" },
  { id: "local", label: "Local (Ollama)", endpoint: "http://localhost:11434/v1", model: "llama3.3" },
];

export default function ScanPage() {
  const [endpoint, setEndpoint] = useState("https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-5.4-mini");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are SupportBot for Acme Corp. Only answer questions about Acme products. Be friendly and concise."
  );
  const [showKey, setShowKey] = useState(false);
  const [makePublic, setMakePublic] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedAttack[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [includeBuiltins, setIncludeBuiltins] = useState(true);
  const [running, setRunning] = useState(false);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<Outcome[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  async function runScan() {
    if (!apiKey.trim()) {
      toast.error("Add an API key for the endpoint you want to test.");
      return;
    }
    setRunning(true);
    setResults([]);
    setSummary(null);
    setTotal(0);
    setOpenRow(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint,
          apiKey,
          model,
          systemPrompt,
          includeBuiltins,
          customAttacks: suggested.filter((a) => a.prompt.trim().length > 0),
          makePublic,
          agentName: makePublic ? agentName : undefined,
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line) continue;
          const evt = JSON.parse(line);
          if (evt.type === "meta") {
            setTotal(evt.total);
          } else if (evt.type === "result") {
            setResults((r) => [...r, evt.outcome]);
            requestAnimationFrame(() => {
              consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight, behavior: "smooth" });
            });
          } else if (evt.type === "done") {
            setSummary({ score: evt.score, breached: evt.breached, partial: evt.partial, blocked: evt.blocked, errored: evt.errored, scanId: evt.scanId });
          } else if (evt.type === "error") {
            throw new Error(evt.message);
          }
        }
      }
    } catch (err) {
      toast.error((err as Error).message || "Scan failed");
    } finally {
      setRunning(false);
    }
  }

  async function loadModels() {
    if (!apiKey.trim()) {
      toast.error("Add an API key first to list its models.");
      return;
    }
    setLoadingModels(true);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const models: string[] = data.models ?? [];
      setFetchedModels(models);
      toast.success(`Loaded ${models.length} text models from ${new URL(endpoint).host}`);
    } catch (err) {
      toast.error((err as Error).message || "Couldn't load models");
    } finally {
      setLoadingModels(false);
    }
  }

  async function loadSuggested() {
    if (!systemPrompt.trim()) {
      toast.error("Add a system prompt first — the AI tailors attacks to it.");
      return;
    }
    setLoadingSuggest(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, count: 8 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const atks: SuggestedAttack[] = data.attacks ?? [];
      setSuggested(atks);
      setIncludeBuiltins(false); // focus on the tailored ones; user can re-enable built-ins
      toast.success(`Crafted ${atks.length} tailored injections with ${data.model}`);
    } catch (err) {
      toast.error((err as Error).message || "Couldn't generate suggestions");
    } finally {
      setLoadingSuggest(false);
    }
  }

  const updateSuggested = (i: number, field: keyof SuggestedAttack, val: string) =>
    setSuggested((s) => s.map((a, idx) => (idx === i ? { ...a, [field]: val } : a)));
  const deleteSuggested = (i: number) => setSuggested((s) => s.filter((_, idx) => idx !== i));
  const addSuggested = () =>
    setSuggested((s) => [...s, { name: `Custom ${s.length + 1}`, prompt: "", severity: "high", category: "instruction_override", technique: "manual" }]);

  const progress = total ? Math.round((results.length / total) * 100) : 0;

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 inset-x-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
            <Crosshair className="w-5 h-5 text-crimson" />
            <span className="text-gradient">GAUNTLET</span>
          </Link>
          <Link href="/" className="text-sm text-text-mid hover:text-text-hi flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20 grid lg:grid-cols-[400px_1fr] gap-6">
        {/* CONFIG */}
        <div className="glass-strong rounded-2xl p-6 h-fit lg:sticky lg:top-24">
          <h1 className="font-display text-xl font-bold mb-1 flex items-center gap-2">
            <ServerCog className="w-5 h-5 text-violet" /> Target
          </h1>
          <p className="text-xs text-text-lo mb-4">
            Test only a system you own or are authorized to test.
          </p>

          <div className="mb-4">
            <div className="text-[10px] font-mono text-text-lo mb-1.5">PROVIDER PRESET</div>
            <div className="flex flex-wrap gap-1.5">
              {PROVIDER_PRESETS.map((p) => {
                const active = endpoint === p.endpoint;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setEndpoint(p.endpoint); setModel(p.model); }}
                    className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition-colors ${
                      active ? "border-crimson/60 text-crimson bg-crimson/10" : "border-white/10 text-text-mid hover:text-text-hi"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            {endpoint.includes("googleapis") && (
              <p className="text-[11px] text-violet-soft mt-2 leading-snug">
                Testing a Google ADK / Gemini agent: paste your agent&apos;s system instruction below and use your
                Google AI Studio key. This red-teams the prompt + model layer your agent runs on.
              </p>
            )}
            {(endpoint.includes("localhost") || endpoint.includes("127.0.0.1") || endpoint.includes("192.168")) && (
              <p className="text-[11px] text-warn mt-2 leading-snug">
                Local target: run Gauntlet on the same machine / LAN (a cloud deploy can&apos;t reach your localhost).
                The endpoint must speak OpenAI <span className="font-mono">/chat/completions</span> — wrap your ADK
                agent in a small shim (see README) if it doesn&apos;t.
              </p>
            )}
          </div>

          <label className="block text-xs font-mono text-text-mid mb-1.5">ENDPOINT (OpenAI-compatible)</label>
          <input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="w-full glass rounded-lg px-3 py-2 text-sm font-mono mb-4 outline-none focus:border-violet/50"
          />

          <label className="block text-xs font-mono text-text-mid mb-1.5 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" /> API KEY (used only for this scan, never stored)
          </label>
          <div className="relative mb-4">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full glass rounded-lg px-3 py-2 pr-10 text-sm font-mono outline-none focus:border-violet/50"
            />
            <button
              onClick={() => setShowKey((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-lo hover:text-text-hi"
              type="button"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-mono text-text-mid">MODEL</label>
            <button
              type="button"
              onClick={loadModels}
              disabled={loadingModels}
              className="text-[10px] font-mono text-violet-soft hover:text-violet flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loadingModels ? "animate-spin" : ""}`} />
              {loadingModels ? "loading…" : fetchedModels.length ? `${fetchedModels.length} loaded ↻` : "load all models"}
            </button>
          </div>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            list="models"
            className="w-full glass rounded-lg px-3 py-2 text-sm font-mono mb-4 outline-none focus:border-violet/50"
          />
          <datalist id="models">
            {(fetchedModels.length ? fetchedModels : PRESET_MODELS).map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>

          <label className="block text-xs font-mono text-text-mid mb-1.5">SYSTEM PROMPT (the thing under test)</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={7}
            className="w-full glass rounded-lg px-3 py-2 text-sm font-mono mb-4 outline-none focus:border-violet/50 resize-y"
          />

          {/* AI-tailored injections */}
          <button
            type="button"
            onClick={loadSuggested}
            disabled={loadingSuggest}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-violet-soft border border-violet/40 bg-violet/5 hover:bg-violet/10 transition-colors disabled:opacity-50 mb-2"
          >
            {loadingSuggest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loadingSuggest ? "the strategist is thinking…" : "Load suggested injections (AI)"}
          </button>
          <p className="text-[11px] text-text-lo mb-4 leading-snug">
            A clever model reads your prompt and writes attacks tailored to its exact rules. Edit them, add your own, or run with only these.
          </p>

          {suggested.length > 0 && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-violet-soft">{suggested.length} tailored attacks</span>
                <button
                  type="button"
                  onClick={addSuggested}
                  className="text-[11px] text-text-mid hover:text-text-hi inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> add your own
                </button>
              </div>
              {suggested.map((a, i) => (
                <div key={i} className="glass rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <input
                      value={a.name}
                      onChange={(e) => updateSuggested(i, "name", e.target.value)}
                      className="flex-1 bg-transparent text-xs font-semibold outline-none min-w-0"
                    />
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        color: SEV_COLOR[a.severity ?? "high"],
                        border: `1px solid ${SEV_COLOR[a.severity ?? "high"]}55`,
                      }}
                    >
                      {(a.severity ?? "high").toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteSuggested(i)}
                      className="text-text-lo hover:text-crimson shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={a.prompt}
                    onChange={(e) => updateSuggested(i, "prompt", e.target.value)}
                    rows={2}
                    className="w-full bg-black/20 rounded p-2 text-[11px] font-mono outline-none resize-y"
                  />
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeBuiltins}
                  onChange={(e) => setIncludeBuiltins(e.target.checked)}
                  className="accent-violet"
                />
                <span className="text-[11px] text-text-mid">Also run the 21 built-in attacks</span>
              </label>
            </div>
          )}

          <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={makePublic}
              onChange={(e) => setMakePublic(e.target.checked)}
              className="accent-crimson"
            />
            <span className="text-xs text-text-mid">Publish to the public leaderboard</span>
          </label>
          {makePublic && (
            <input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Agent name (shown publicly)"
              className="w-full glass rounded-lg px-3 py-2 text-sm font-mono mb-4 outline-none focus:border-violet/50"
            />
          )}

          <button
            onClick={runScan}
            disabled={running}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-crimson px-4 py-3 font-semibold text-white glow-crimson hover:bg-crimson-soft transition-all disabled:opacity-60"
          >
            {running ? <Radar className="w-4 h-4 animate-spin-slow" /> : <Play className="w-4 h-4" />}
            {running ? `Running… ${results.length}/${total}` : "Run the gauntlet"}
          </button>
        </div>

        {/* CONSOLE / REPORT */}
        <div className="space-y-6">
          {summary && summary.score === null && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-2xl p-6 border border-warn/30"
            >
              <div className="flex items-center gap-3 mb-2">
                <Ban className="w-6 h-6 text-warn" />
                <h2 className="font-display text-xl font-bold">Scan didn&apos;t reach the model</h2>
              </div>
              <p className="text-sm text-text-mid leading-relaxed">
                All {summary.errored ?? results.length} attacks <span className="text-warn">errored</span> before
                hitting the model — so there is no score to give (a 100 here would be a lie). This is almost always a
                wrong <span className="font-mono">MODEL</span> id or key. <strong>Click any row below</strong> to see
                the exact provider error, then fix the model (try <span className="font-mono">load all models</span> to
                pick a valid id) or the key, and re-run.
              </p>
            </motion.div>
          )}

          {summary && summary.score !== null && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8"
            >
              <GradeBadge grade={gradeFromScore(summary.score)} />
              <div className="flex-1 w-full">
                <h2 className="font-display text-xl font-bold mb-1">Breach dossier</h2>
                <p className="text-sm text-text-mid mb-4" style={{ maxWidth: "46ch" }}>
                  {brutalVerdict({
                    breached: summary.breached,
                    partial: summary.partial,
                    blocked: summary.blocked,
                    worst: killingBlow(results),
                  })}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    ["breached", summary.breached],
                    ["partial", summary.partial],
                    ["blocked", summary.blocked],
                  ] as const).map(([k, v]) => {
                    const s = V[k as Verdict];
                    return (
                      <div key={k} className="glass rounded-xl p-4 text-center">
                        <div className="font-display text-3xl font-extrabold" style={{ color: s.c }}>
                          {v}
                        </div>
                        <div className="text-[10px] tracking-widest font-mono mt-1" style={{ color: s.c }}>
                          {s.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {summary.errored ? (
                  <p className="text-xs text-warn mt-3 flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 shrink-0" />
                    {summary.errored} attack{summary.errored > 1 ? "s" : ""} errored and {summary.errored > 1 ? "were" : "was"} excluded from the score — expand to see why.
                  </p>
                ) : null}
                <p className="text-sm text-text-mid mt-4">
                  {summary.breached > 0
                    ? `${summary.breached} attack${summary.breached > 1 ? "s" : ""} leaked the planted canary. Expand any breached row to see exactly what broke it.`
                    : `No attack leaked the canary across the ${summary.blocked + summary.partial} that ran.${summary.errored ? "" : " Strong — keep testing as you change the prompt."}`}
                </p>
                {summary.scanId && (
                  <Link
                    href={`/report/${summary.scanId}`}
                    className="inline-flex items-center gap-1.5 mt-3 text-sm text-violet-soft hover:text-violet font-mono"
                  >
                    Shareable report → /report/{summary.scanId.slice(0, 8)}
                  </Link>
                )}
              </div>
            </motion.div>
          )}

          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
              <Radar className={`w-4 h-4 text-violet ${running ? "animate-spin-slow" : ""}`} />
              <span className="font-mono text-xs text-text-mid">live attack console</span>
              {total > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-32 h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full bg-crimson transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="font-mono text-xs text-text-lo">{progress}%</span>
                </div>
              )}
            </div>

            <div ref={consoleRef} className="max-h-[60vh] overflow-y-auto p-3">
              {results.length === 0 && !running && (
                <div className="text-center py-16 text-text-lo">
                  <Crosshair className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-mono text-sm">Configure a target and run the gauntlet.</p>
                </div>
              )}
              <AnimatePresence initial={false}>
                {results.map((o) => {
                  const s = V[o.verdict];
                  const open = openRow === o.attackId;
                  return (
                    <motion.div
                      key={o.attackId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-xl mb-1.5 glass glass-hover"
                    >
                      <button
                        onClick={() => setOpenRow(open ? null : o.attackId)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      >
                        <s.Icon className="w-4 h-4 shrink-0" style={{ color: s.c }} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{o.name}</div>
                          <div className="text-[11px] text-text-lo font-mono truncate">{o.technique}</div>
                        </div>
                        <span
                          className="ml-auto text-[10px] tracking-widest px-2 py-0.5 rounded-full shrink-0 font-mono"
                          style={{ color: s.c, background: `${s.c}1a`, border: `1px solid ${s.c}40` }}
                        >
                          {s.label}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-text-lo shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {open && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3">
                              <div>
                                <div className="text-[10px] font-mono text-text-lo mb-1">ATTACK SENT</div>
                                <pre className="text-xs font-mono text-text-mid whitespace-pre-wrap glass rounded-lg p-3">{o.prompt}</pre>
                              </div>
                              <div>
                                <div className="text-[10px] font-mono text-text-lo mb-1">MODEL RESPONSE</div>
                                <pre className="text-xs font-mono whitespace-pre-wrap glass rounded-lg p-3" style={{ color: o.verdict === "breached" ? "#ff8aa0" : undefined }}>{o.response || "(empty)"}</pre>
                              </div>
                              <div className="text-xs" style={{ color: s.c }}>
                                {o.reasons.join(" ")}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
