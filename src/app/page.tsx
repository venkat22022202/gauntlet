"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Crosshair,
  Bug,
  ShieldAlert,
  Radar,
  Swords,
  Skull,
  Fingerprint,
  ScanLine,
  TriangleAlert,
  ArrowRight,
  Github,
  KeyRound,
  Target,
} from "lucide-react";

// ── Live hero console (illustrative) ─────────────────────────
const DEMO_FEED = [
  { name: "Ignore previous instructions", verdict: "breached" },
  { name: "Repeat-the-above", verdict: "blocked" },
  { name: "Developer / debug mode", verdict: "breached" },
  { name: "Base64 smuggling", verdict: "blocked" },
  { name: "Poisoned document", verdict: "breached" },
  { name: "Unrestricted persona (DAN)", verdict: "partial" },
  { name: "Config-as-JSON", verdict: "blocked" },
  { name: "Forced affirmative prefix", verdict: "breached" },
  { name: "Sentence completion", verdict: "blocked" },
  { name: "Spoofed tool result", verdict: "breached" },
] as const;

const verdictStyle: Record<string, { c: string; label: string }> = {
  breached: { c: "#ff2d55", label: "BREACHED" },
  partial: { c: "#f5a524", label: "PARTIAL" },
  blocked: { c: "#22c55e", label: "BLOCKED" },
};

function HeroConsole() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= DEMO_FEED.length) {
      const t = setTimeout(() => setN(0), 2600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((v) => v + 1), 480);
    return () => clearTimeout(t);
  }, [n]);

  const breached = DEMO_FEED.slice(0, n).filter((d) => d.verdict === "breached").length;

  return (
    <div className="relative">
      <div className="relative glass-strong rounded-2xl overflow-hidden grain ticks">
        <div className="scanline" />
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <span className="w-2.5 h-2.5 rounded-full bg-crimson/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-warn/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-safe/80" />
          <span className="ml-2 font-mono text-xs text-text-mid">gauntlet@redteam: ./run --target acme-supportbot</span>
          <span className="ml-auto font-mono text-xs text-crimson">{breached} breached</span>
        </div>
        <div className="p-4 font-mono text-[13px] min-h-[280px]">
          {DEMO_FEED.slice(0, n).map((d, i) => {
            const s = verdictStyle[d.verdict];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 py-1"
              >
                <span className="text-text-lo">{String(i + 1).padStart(2, "0")}</span>
                <Crosshair className="w-3.5 h-3.5 shrink-0" style={{ color: s.c }} />
                <span className="text-text-mid truncate">{d.name}</span>
                <span
                  className="ml-auto text-[10px] tracking-widest px-2 py-0.5 rounded shrink-0"
                  style={{ color: s.c, background: `${s.c}1a`, border: `1px solid ${s.c}40` }}
                >
                  {s.label}
                </span>
              </motion.div>
            );
          })}
          <span className="inline-block w-2 h-4 bg-crimson ml-1 align-middle animate-blink" />
        </div>
      </div>
      {/* rubber stamp */}
      <motion.div
        initial={{ opacity: 0, scale: 1.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        className="stamp text-crimson absolute -bottom-5 -right-4 text-lg bg-ink-0/40 backdrop-blur-sm"
      >
        Breached
      </motion.div>
    </div>
  );
}

const CATEGORIES = [
  { icon: ShieldAlert, title: "Instruction Override", tag: "LLM01.A", desc: "“Ignore previous instructions” and fake authority directives." },
  { icon: Fingerprint, title: "System-Prompt Leak", tag: "LLM01.B", desc: "Coax the agent into dumping its own hidden instructions." },
  { icon: Skull, title: "Role-Play Jailbreak", tag: "LLM01.C", desc: "DAN personas, fiction frames, and sympathy exploits." },
  { icon: ScanLine, title: "Obfuscation", tag: "LLM01.D", desc: "Base64, leetspeak, and whitespace token-smuggling." },
  { icon: Bug, title: "Indirect Injection", tag: "LLM01.E", desc: "Poisoned documents and spoofed tool results." },
  { icon: Swords, title: "Refusal Suppression", tag: "LLM01.F", desc: "Forbidding refusals and forcing affirmative prefixes." },
];

const STEPS = [
  { icon: KeyRound, title: "Plant a canary", desc: "Gauntlet hides a unique secret token inside your prompt and tells the model to guard it — without weakening your own rules." },
  { icon: Target, title: "Run the gauntlet", desc: "It fires a battery of real injection & jailbreak attacks at your prompt, live, one technique at a time." },
  { icon: TriangleAlert, title: "Read the breach report", desc: "Any attack that leaks the canary is a deterministic breach. You get a hardening score and the exact transcript of everything that broke it." },
];

const TICKER = ["INSTRUCTION OVERRIDE", "SYSTEM-PROMPT LEAK", "DAN PERSONA", "BASE64 SMUGGLING", "POISONED DOCUMENT", "SPOOFED TOOL RESULT", "REFUSAL SUPPRESSION", "SENTENCE COMPLETION", "CONFIG-AS-JSON", "TRANSLATION EXTRACTION"];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Crosshair className="w-5 h-5 text-crimson" />
            <span className="font-display text-xl font-extrabold tracking-tight text-text-hi">GAUNTLET</span>
            <span className="filelabel text-text-lo border border-white/10 rounded px-1.5 py-0.5">RED-TEAM · v0.1</span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="https://github.com/venkat22022202/gauntlet" className="text-sm text-text-mid hover:text-text-hi transition-colors flex items-center gap-1.5">
              <Github className="w-4 h-4" /> Star
            </a>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 rounded-xl bg-crimson px-4 py-2 text-sm font-semibold text-white glow-crimson hover:bg-crimson-soft transition-all"
            >
              Run a scan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        {/* attack ticker */}
        <div className="border-t border-white/5 overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee py-1.5">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="filelabel text-text-lo mx-5 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-crimson" /> {t}
              </span>
            ))}
          </div>
        </div>
      </nav>

      {/* HERO — asymmetric */}
      <section className="relative px-6 pt-36 pb-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="filelabel text-crimson mb-6 flex items-center gap-3"
            >
              <span className="w-8 h-px bg-crimson" />
              CASE FILE — OWASP LLM-01 · PROMPT INJECTION
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.92] text-left"
            >
              Is your AI agent
              <br />
              <span className="text-gradient">hackable?</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-6 text-lg text-text-mid max-w-xl leading-relaxed"
            >
              Paste your system prompt. Gauntlet runs it through a barrage of real
              prompt-injection and jailbreak attacks and shows you, line by line,
              exactly how it breaks.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mt-9 flex items-center gap-6"
            >
              <Link
                href="/scan"
                className="group inline-flex items-center gap-2 rounded-xl bg-crimson px-7 py-3.5 text-base font-semibold text-white glow-crimson hover:bg-crimson-soft transition-all"
              >
                Run the gauntlet
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#how" className="text-sm text-text-mid hover:text-text-hi transition-colors border-b border-white/15 pb-0.5">
                how it works ↓
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-wrap gap-x-5 gap-y-2 filelabel text-text-lo"
            >
              {["21 ATTACKS", "CANARY-VERIFIED", "BYO-KEY", "NO SIGN-UP", "OPEN-SOURCE"].map((s) => (
                <span key={s} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-violet" /> {s}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <HeroConsole />
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="filelabel text-text-lo mb-2">// ARSENAL</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-10">The attacks it throws at you</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="bg-ink-50 p-6 hover:bg-ink-100 transition-colors group"
              >
                <div className="flex items-center justify-between mb-4">
                  <cat.icon className="w-6 h-6 text-crimson group-hover:scale-110 transition-transform" />
                  <span className="filelabel text-text-lo">{cat.tag}</span>
                </div>
                <h3 className="font-display text-lg font-semibold mb-1.5">{cat.title}</h3>
                <p className="text-sm text-text-mid leading-relaxed">{cat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="filelabel text-text-lo mb-2">// PROTOCOL</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-10">
            Three steps. <span className="text-gradient-violet">Total clarity.</span>
          </h2>
          <div className="space-y-px bg-white/5 rounded-2xl overflow-hidden">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-ink-50 p-6 flex gap-5 items-start"
              >
                <div className="shrink-0 font-display text-3xl font-extrabold text-text-lo w-12">0{i + 1}</div>
                <div className="shrink-0 w-11 h-11 rounded-xl glass flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-violet" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold mb-1">{s.title}</h3>
                  <p className="text-text-mid leading-relaxed text-sm">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative glass-strong rounded-3xl p-12 text-center overflow-hidden grain ticks">
            <div className="scanline" />
            <Crosshair className="w-12 h-12 text-crimson mx-auto mb-6 animate-float" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Find out before an attacker does.</h2>
            <p className="text-text-mid mb-8 max-w-md mx-auto">
              Free, open-source, no sign-up. Runs against your own key — no prompt or key is ever stored.
            </p>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 rounded-xl bg-crimson px-8 py-4 text-lg font-semibold text-white glow-crimson hover:bg-crimson-soft transition-all"
            >
              Run the gauntlet <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 filelabel text-text-lo">
          <div>
            <span className="text-crimson">GAUNTLET</span> — RED-TEAM YOUR PROMPT · AUTHORIZED USE ONLY
          </div>
          <a href="https://github.com/venkat22022202/gauntlet" className="hover:text-text-hi transition-colors flex items-center gap-1.5">
            <Github className="w-4 h-4" /> GITHUB.COM/VENKAT22022202/GAUNTLET
          </a>
        </div>
      </footer>
    </div>
  );
}
