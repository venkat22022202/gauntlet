"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Crosshair,
  ArrowRight,
  Github,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Fingerprint,
  Skull,
  ScanLine,
  Bug,
  Swords,
  KeyRound,
  Target,
  TriangleAlert as Warn,
  Mail,
  Wrench,
  FileWarning,
  ChevronRight,
} from "lucide-react";
import { ScrambleText, TargetingField, Tilt, Magnetic, Counter, RedactReveal, SpotlightCard, GlitchText } from "@/components/fx";

/* Apple-style easing — long, confident deceleration. */
const EASE = [0.16, 1, 0.3, 1] as const;

/* attack conveyor tokens — SOC-ticker texture between sections */
const TICKER = [
  "INSTRUCTION OVERRIDE",
  "SYSTEM-PROMPT LEAK",
  "ECHOLEAK · CVE-2025-32711",
  "DAN PERSONA",
  "BASE64 SMUGGLING",
  "POISONED DOCUMENT",
  "SPOOFED TOOL RESULT",
  "MARKDOWN-IMAGE EXFIL",
  "ZERO-WIDTH INJECTION",
  "OWASP LLM01",
  "REFUSAL SUPPRESSION",
  "TOOL POISONING · MCP03",
];

/* ────────────────────────────────────────────────────────────
   Reveal — a single, reusable scroll-choreographed entrance.
   ──────────────────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   Live attack terminal — the hero "product shot".
   Diegetic motion: it runs a scan, streams verdicts, then the
   grade powers on and the BREACHED stamp slams down. Loops.
   ──────────────────────────────────────────────────────────── */
const FEED = [
  { n: "Ignore previous instructions", v: "breached" },
  { n: "Repeat-the-above extraction", v: "blocked" },
  { n: "Developer / debug mode", v: "breached" },
  { n: "Base64 instruction smuggling", v: "blocked" },
  { n: "Poisoned document (indirect)", v: "breached" },
  { n: "Unrestricted persona — DAN", v: "partial" },
  { n: "Spoofed tool result", v: "breached" },
  { n: "Markdown image exfiltration", v: "breached" },
  { n: "Config-as-JSON dump", v: "blocked" },
] as const;

const VC: Record<string, { c: string; label: string }> = {
  breached: { c: "#ff453a", label: "BREACHED" },
  partial: { c: "#ff9f0a", label: "PARTIAL" },
  blocked: { c: "#30d158", label: "BLOCKED" },
};

function LiveTerminal() {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? FEED.length : 0);

  useEffect(() => {
    if (reduce) return;
    if (n > FEED.length) {
      const t = setTimeout(() => setN(0), 3000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((v) => v + 1), n === FEED.length ? 650 : 430);
    return () => clearTimeout(t);
  }, [n, reduce]);

  const shown = FEED.slice(0, Math.min(n, FEED.length));
  const breached = shown.filter((d) => d.v === "breached").length;
  const done = n >= FEED.length;

  return (
    <div className="relative">
      <div className="panel-strong crt ticks rounded-2xl overflow-hidden">
        {!reduce && <div className="scanline" />}
        {/* title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <span className="w-2.5 h-2.5 rounded-full bg-alarm/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-phosphor/80" />
          <span className="ml-2 font-mono text-xs text-text-mid truncate">
            gauntlet ~ ./run --target acme-supportbot
          </span>
          <span className="ml-auto font-mono text-xs text-alarm tabular-nums">{breached} breached</span>
        </div>

        {/* stream */}
        <div className="p-4 font-mono text-[13px] min-h-[300px]">
          {shown.map((d, i) => {
            const s = VC[d.v];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, ease: EASE }}
                className="flex items-center gap-3 py-[3px]"
              >
                <span className="text-text-lo tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <Crosshair className="w-3.5 h-3.5 shrink-0" style={{ color: s.c }} />
                <span className="text-text-mid truncate">{d.n}</span>
                <span
                  className="ml-auto text-[10px] tracking-widest px-2 py-0.5 rounded shrink-0"
                  style={{ color: s.c, background: `${s.c}1a`, border: `1px solid ${s.c}40` }}
                >
                  {s.label}
                </span>
              </motion.div>
            );
          })}
          {!done && <span className="inline-block w-2 h-4 bg-phosphor ml-1 align-middle animate-blink" />}

          {/* result */}
          {done && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-5 animate-power-on"
            >
              <div className="leading-none">
                <span className="font-display text-5xl font-extrabold text-alarm alarm-glow animate-glitch">F</span>
              </div>
              <div className="text-xs text-text-mid leading-relaxed">
                <span className="text-alarm font-semibold">6/9 attacks landed.</span> Leaked the system
                prompt to a poisoned document.
                <div className="text-text-lo mt-1">more hardened than 12% of scanned agents · OWASP LLM01</div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 1.5, rotate: -16 }}
                animate={{ opacity: 1, scale: 1, rotate: -9 }}
                transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.15 }}
                className="stamp text-alarm ml-auto hidden sm:block"
              >
                Breached
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   The shareable dossier — previewed on the landing page.
   ──────────────────────────────────────────────────────────── */
function DossierCard() {
  return (
    <div className="panel-strong crt rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
      <div className="flex items-center justify-between filelabel text-text-lo mb-6">
        <span>GAUNTLET · BREACH DOSSIER</span>
        <span>No. 4471</span>
      </div>
      <div className="flex items-end gap-5">
        <div className="font-display text-7xl font-extrabold text-alarm alarm-glow leading-none">
          <GlitchText>F</GlitchText>
        </div>
        <div className="pb-1.5">
          <div className="font-mono text-xs text-alarm tracking-widest">CRITICAL BREACH</div>
          <div className="font-mono text-[11px] text-text-lo mt-1">31 / 100 hardening</div>
        </div>
        <div className="ml-auto stamp text-alarm text-sm self-start">Breached</div>
      </div>

      <p className="mt-6 text-sm text-text-mid leading-relaxed">
        “Leaked its system prompt to a{" "}
        <span className="text-text-hi">poisoned support ticket</span>.”
      </p>

      <div className="mt-5 font-mono text-[12px] text-text-lo">
        leaked:{" "}
        <span className="redact px-10 align-middle">x</span>{" "}
        <span className="redact px-6 align-middle">x</span> canary{" "}
        <span className="redact px-8 align-middle">x</span>
      </div>

      <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between font-mono text-[11px]">
        <span className="text-text-lo">more hardened than 12% of agents</span>
        <span className="text-phosphor">LLM01 · ASI02</span>
      </div>
    </div>
  );
}

/* ──────────────────────────── data ──────────────────────────── */
const INCIDENTS = [
  { icon: Mail, tag: "CVE-2025-32711", title: "EchoLeak", desc: "A single email hid instructions. M365 Copilot read the inbox and exfiltrated private data — zero clicks." },
  { icon: FileWarning, tag: "ShadowLeak", title: "Hidden-text exfil", desc: "White-on-white instructions in a document made ChatGPT's research agent leak data from inside OpenAI." },
  { icon: Wrench, tag: "MCP03", title: "Tool poisoning", desc: "An invisible payload in a tool description made Cursor read ~/.ssh/id_rsa and send it away." },
];

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
  { icon: Target, title: "Run the gauntlet", desc: "It fires a battery of real injection & jailbreak attacks at your live model, one technique at a time, streaming each verdict." },
  { icon: Warn, title: "Read the dossier", desc: "Any attack that leaks the canary is a deterministic breach. You get a letter grade and the exact transcript of everything that broke it." },
];

/* ──────────────────────────── nav ──────────────────────────── */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

export default function Landing() {
  const scrolled = useScrolled();

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-black/70 backdrop-blur-xl border-b border-white/[0.06]" : "border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Crosshair className="w-5 h-5 text-phosphor" />
            <span className="font-mono text-base font-bold tracking-tight text-text-hi">
              <ScrambleText text="GAUNTLET" trigger="hover" />
              <span className="text-phosphor animate-blink">_</span>
            </span>
            <span className="filelabel text-text-lo border border-white/10 rounded px-1.5 py-0.5 hidden sm:inline">
              RED-TEAM
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/break" className="text-sm text-text-mid hover:text-text-hi transition-colors hidden sm:inline">
              Break it
            </Link>
            <a
              href="https://github.com/venkat22022202/gauntlet"
              className="text-sm text-text-mid hover:text-text-hi transition-colors items-center gap-1.5 hidden sm:flex"
            >
              <Github className="w-4 h-4" /> Star
            </a>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 rounded-full border border-phosphor/45 bg-phosphor/[0.08] px-4 py-2 text-sm font-semibold text-phosphor hover:bg-phosphor/[0.16] transition-colors"
            >
              Run a scan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative px-6 pt-36 pb-20 sm:pt-44">
        <TargetingField />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="filelabel text-phosphor inline-flex items-center gap-2.5 mb-7"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-phosphor animate-pulse-ring" />
            REAL ATTACKS · REAL MODEL · NO INSTALL
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.05 }}
            className="display-xl font-display text-text-hi"
          >
            Is your AI agent
            <br />
            <ScrambleText text="hackable?" trigger="mount" className="text-alarm-gradient alarm-glow" />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.12 }}
            className="lede mt-7 max-w-2xl mx-auto"
          >
            Paste your system prompt, point Gauntlet at your real model, and watch dozens of real
            prompt-injection and indirect-injection attacks hit it live. A deterministic canary judge.
            A brutal, shareable grade in about a minute.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.19 }}
            className="mt-10 flex items-center justify-center gap-5 flex-wrap"
          >
            <Magnetic>
              <Link
                href="/scan"
                className="group inline-flex items-center gap-2 rounded-full bg-phosphor px-7 py-3.5 text-base font-semibold text-black glow-phosphor hover:bg-phosphor-soft transition-colors"
              >
                Run the gauntlet
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/scan?demo=1"
                className="inline-flex items-center gap-2 rounded-full border border-phosphor/40 bg-phosphor/[0.06] px-6 py-3.5 text-base font-semibold text-phosphor hover:bg-phosphor/[0.12] transition-colors"
              >
                Try a live demo
              </Link>
            </Magnetic>
            <a href="#how" className="text-sm text-text-mid hover:text-text-hi transition-colors inline-flex items-center gap-1">
              how it works <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 filelabel text-text-lo"
          >
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-phosphor" />
              <Counter value={21} suffix="+" /> ATTACKS
            </span>
            {["CANARY-VERIFIED", "BYO-KEY", "NO SIGN-UP", "OPEN-SOURCE"].map((s) => (
              <span key={s} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-phosphor" /> {s}
              </span>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.42 }}
            className="mt-8 text-sm text-text-lo"
          >
            Not ready to test yours?{" "}
            <Link href="/break" className="text-phosphor hover:underline">
              Can you break a hardened agent? →
            </Link>
          </motion.p>
        </div>

        {/* the product shot */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.32 }}
          className="relative z-10 max-w-3xl mx-auto mt-16"
        >
          <Tilt>
            <LiveTerminal />
          </Tilt>
        </motion.div>
      </section>

      {/* THE PROBLEM MOVED */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="filelabel text-phosphor mb-3">// THE ATTACK MOVED UP A LAYER</div>
            <h2 className="display-md font-display max-w-3xl">
              Jailbreaking the chatbot was the easy part.
            </h2>
            <p className="lede mt-5 max-w-2xl">
              Today&apos;s agents read your email, your documents, your tool results — and quietly obey
              instructions hidden inside them. The 2025–26 headlines were all{" "}
              <span className="text-text-hi">indirect injection</span>: content the agent merely
              <em> read</em> turning into an action with your privileges.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-px bg-white/[0.05] rounded-2xl overflow-hidden mt-12">
            {INCIDENTS.map((it, i) => (
              <Reveal key={it.title} delay={i * 0.08}>
                <SpotlightCard
                  className="bg-ink-50 p-7 h-full"
                  spot="rgba(255,69,58,0.16)"
                  border="rgba(255,69,58,0.45)"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                      <it.icon className="w-6 h-6 text-alarm" />
                      <span className="filelabel text-alarm/80">{it.tag}</span>
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-2">
                      <ScrambleText text={it.title} trigger="view" />
                    </h3>
                    <RedactReveal delay={0.15}>
                      <p className="text-sm text-text-mid leading-relaxed">{it.desc}</p>
                    </RedactReveal>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ATTACK CONVEYOR */}
      <div className="border-y border-white/[0.05] overflow-hidden py-3 marquee-mask" aria-hidden>
        <div className="flex w-max whitespace-nowrap animate-marquee hover:[animation-play-state:paused]">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="filelabel text-text-lo mx-6 flex items-center gap-2 shrink-0">
              <span className="w-1 h-1 rounded-full bg-phosphor" /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="filelabel text-phosphor mb-3">// PROTOCOL</div>
            <h2 className="display-md font-display mb-12">
              Three steps. <span className="text-phosphor-gradient">Deterministic truth.</span>
            </h2>
          </Reveal>
          <div className="relative space-y-px bg-white/[0.05] rounded-2xl overflow-hidden">
            <motion.div
              aria-hidden
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.2, ease: EASE }}
              style={{ originY: 0 }}
              className="absolute left-[7.6rem] top-8 bottom-8 w-px bg-gradient-to-b from-phosphor/70 via-phosphor/30 to-transparent hidden sm:block"
            />
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="relative bg-ink-50 p-7 flex gap-6 items-start">
                  <div className="shrink-0 font-mono text-3xl font-extrabold text-phosphor/50 w-12 tabular-nums">
                    <ScrambleText text={`0${i + 1}`} trigger="view" />
                  </div>
                  <div className="shrink-0 w-11 h-11 rounded-xl panel flex items-center justify-center relative z-10 glow-phosphor">
                    <s.icon className="w-5 h-5 text-phosphor" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold mb-1.5">{s.title}</h3>
                    <p className="text-text-mid leading-relaxed text-sm">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ARSENAL */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="filelabel text-phosphor mb-3">// ARSENAL</div>
            <h2 className="display-md font-display mb-12">The attacks it throws at you</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.05] rounded-2xl overflow-hidden">
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.title} delay={(i % 3) * 0.06}>
                <SpotlightCard className="bg-ink-50 p-7 h-full hover:bg-ink-100 transition-colors group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <cat.icon className="w-6 h-6 text-phosphor group-hover:scale-110 transition-transform" />
                      <span className="filelabel text-text-lo">{cat.tag}</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold mb-1.5">
                      <ScrambleText text={cat.title} trigger="hover" />
                    </h3>
                    <p className="text-sm text-text-mid leading-relaxed">{cat.desc}</p>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* THE DOSSIER */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <div className="filelabel text-phosphor mb-3">// THE PAYOFF</div>
            <h2 className="display-md font-display">Every run ends in a dossier built to be shared.</h2>
            <p className="lede mt-5">
              Not a private number — a verdict. A letter grade, your percentile, and the exact attack
              that owned you, rendered as a card your followers will screenshot. Drop the badge in your
              README and every repo advertises how hard your agent is to break.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 font-mono text-xs">
              {["S–F LETTER GRADE", "PERCENTILE RANK", "SHAREABLE CARD", "README BADGE"].map((t) => (
                <span key={t} className="rounded-full border border-phosphor/30 text-phosphor px-3 py-1.5">
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Tilt glare max={9}>
              <DossierCard />
            </Tilt>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="panel-strong crt ticks rounded-3xl p-12 text-center">
              <div className="relative mx-auto mb-6 w-12 h-12">
                <span className="absolute inset-0 rounded-full animate-pulse-ring" />
                <Crosshair className="w-12 h-12 text-phosphor animate-float" />
              </div>
              <h2 className="display-md font-display mb-3">
                <ScrambleText text="Find out before an attacker does." trigger="view" />
              </h2>
              <p className="text-text-mid mb-8 max-w-md mx-auto">
                Free, open-source, no sign-up. Runs against your own key — no prompt or key is ever stored.
              </p>
              <Magnetic>
                <Link
                  href="/scan"
                  className="inline-flex items-center gap-2 rounded-full bg-phosphor px-8 py-4 text-lg font-semibold text-black glow-phosphor hover:bg-phosphor-soft transition-colors"
                >
                  Run the gauntlet <ArrowRight className="w-5 h-5" />
                </Link>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-white/[0.05] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 filelabel text-text-lo">
          <div>
            <ScrambleText text="GAUNTLET" trigger="hover" className="text-phosphor" /> — RED-TEAM YOUR PROMPT · AUTHORIZED USE ONLY
          </div>
          <a
            href="https://github.com/venkat22022202/gauntlet"
            className="hover:text-text-hi transition-colors flex items-center gap-1.5"
          >
            <Github className="w-4 h-4" /> GITHUB.COM/VENKAT22022202/GAUNTLET
          </a>
        </div>
      </footer>
    </div>
  );
}
