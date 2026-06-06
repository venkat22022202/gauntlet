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
  Zap,
  Target,
  Fingerprint,
  ScanLine,
  TriangleAlert,
  ArrowRight,
  Github,
  KeyRound,
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
    const t = setTimeout(() => setN((v) => v + 1), 520);
    return () => clearTimeout(t);
  }, [n]);

  const breached = DEMO_FEED.slice(0, n).filter((d) => d.verdict === "breached").length;

  return (
    <div className="relative w-full max-w-2xl mx-auto glass-strong rounded-2xl overflow-hidden">
      <div className="scanline" />
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <Radar className="w-4 h-4 text-violet animate-spin-slow" />
        <span className="font-mono text-xs text-text-mid">gauntlet · live red-team</span>
        <span className="ml-auto font-mono text-xs text-crimson">{breached} breached</span>
      </div>
      <div className="p-4 font-mono text-[13px] min-h-[260px]">
        {DEMO_FEED.slice(0, n).map((d, i) => {
          const s = verdictStyle[d.verdict];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 py-1"
            >
              <Crosshair className="w-3.5 h-3.5 shrink-0" style={{ color: s.c }} />
              <span className="text-text-mid truncate">{d.name}</span>
              <span
                className="ml-auto text-[10px] tracking-widest px-2 py-0.5 rounded-full shrink-0"
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
  );
}

const CATEGORIES = [
  { icon: ShieldAlert, title: "Instruction Override", desc: "“Ignore previous instructions…” and fake authority directives." },
  { icon: Fingerprint, title: "System-Prompt Leak", desc: "Coax the agent into dumping its own hidden instructions." },
  { icon: Skull, title: "Role-Play Jailbreak", desc: "DAN personas, fiction frames, and sympathy exploits." },
  { icon: ScanLine, title: "Obfuscation", desc: "Base64, leetspeak, and whitespace token-smuggling." },
  { icon: Bug, title: "Indirect Injection", desc: "Poisoned documents and spoofed tool results." },
  { icon: Swords, title: "Refusal Suppression", desc: "Forbidding refusals and forcing affirmative prefixes." },
];

const STEPS = [
  { icon: KeyRound, title: "Plant a canary", desc: "Gauntlet hides a unique secret token inside your system prompt and tells the model to guard it — without weakening your own rules." },
  { icon: Target, title: "Run the gauntlet", desc: "It fires a battery of real injection & jailbreak attacks at your prompt, live, one technique at a time." },
  { icon: TriangleAlert, title: "Get the breach report", desc: "Any attack that leaks the canary is a deterministic breach. You get a hardening score and the exact transcript of everything that broke it." },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
            <Crosshair className="w-5 h-5 text-crimson" />
            <span className="text-gradient">GAUNTLET</span>
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
      </nav>

      {/* HERO */}
      <section className="relative pt-36 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-violet-soft">
              <Zap className="w-3.5 h-3.5" /> Open-source · OWASP LLM01 red-team · BYO-key
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 font-display text-5xl md:text-7xl font-extrabold tracking-tight leading-[0.95]"
          >
            Is your AI agent
            <br />
            <span className="text-gradient">hackable?</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-text-mid max-w-2xl mx-auto"
          >
            Paste your system prompt. Gauntlet runs it through a barrage of real
            prompt-injection and jailbreak attacks and shows you, line by line,
            exactly how it breaks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/scan"
              className="group inline-flex items-center gap-2 rounded-xl bg-crimson px-8 py-3.5 text-base font-semibold text-white glow-crimson hover:bg-crimson-soft transition-all"
            >
              Run the gauntlet
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-xl glass glass-hover px-8 py-3.5 text-base font-medium text-text-mid"
            >
              <Radar className="w-4 h-4" /> How it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16"
          >
            <HeroConsole />
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-3">
            The attacks it throws at you
          </h2>
          <p className="text-center text-text-mid mb-12">
            A curated corpus of real techniques — the same ones attackers use in the wild.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="glass glass-hover rounded-2xl p-6"
              >
                <cat.icon className="w-7 h-7 text-crimson mb-4" />
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
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">
            Three steps. <span className="text-gradient-violet">Total clarity.</span>
          </h2>
          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="glass rounded-2xl p-6 flex gap-5 items-start"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl glass-strong flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-violet" />
                </div>
                <div>
                  <div className="font-mono text-xs text-text-lo mb-1">0{i + 1}</div>
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
          <div className="relative glass-strong rounded-3xl p-12 text-center overflow-hidden">
            <div className="scanline" />
            <Crosshair className="w-12 h-12 text-crimson mx-auto mb-6 animate-float" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Find out before an attacker does.
            </h2>
            <p className="text-text-mid mb-8 max-w-md mx-auto">
              Free, open-source, and runs against your own key. No prompt or key is ever stored.
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
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-lo">
          <div className="font-mono">
            <span className="text-crimson">GAUNTLET</span> — red-team your prompt. Authorized use only.
          </div>
          <a href="https://github.com/venkat22022202/gauntlet" className="hover:text-text-hi transition-colors flex items-center gap-1.5">
            <Github className="w-4 h-4" /> github.com/venkat22022202/gauntlet
          </a>
        </div>
      </footer>
    </div>
  );
}
