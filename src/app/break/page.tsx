"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Crosshair,
  ArrowLeft,
  ArrowRight,
  Zap,
  Trophy,
  ShieldX,
  Lock,
  Terminal,
} from "lucide-react";
import { GAME_LEVELS } from "@/lib/demo-agents";
import { ScrambleText } from "@/components/fx";
import { sfx } from "@/lib/sfx";

interface BreakResult {
  won: boolean;
  response: string;
  level: number;
  levelName: string;
  isLast: boolean;
  secret: string | null;
}

export default function BreakPage() {
  const [level, setLevel] = useState(1); // 1-based
  const [attack, setAttack] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BreakResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [cleared, setCleared] = useState<number[]>([]);

  const lvl = GAME_LEVELS[level - 1];

  async function fire() {
    if (!attack.trim()) {
      toast.error("Type an attack first.");
      return;
    }
    setBusy(true);
    setResult(null);
    sfx.tick();
    try {
      const res = await fetch("/api/break", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, attack }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setAttempts((a) => a + 1);
      setResult(data as BreakResult);
      if (data.won) {
        setCleared((c) => (c.includes(level) ? c : [...c, level]));
        toast.success(`BREACHED — you cracked ${data.levelName}`);
        sfx.win();
      } else {
        sfx.lose();
      }
    } catch (e) {
      toast.error((e as Error).message || "Attack failed");
    } finally {
      setBusy(false);
    }
  }

  function selectLevel(n: number) {
    setLevel(n);
    setAttack("");
    setResult(null);
  }

  function nextLevel() {
    if (level < GAME_LEVELS.length) selectLevel(level + 1);
  }

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono text-base font-bold">
            <Crosshair className="w-5 h-5 text-phosphor" />
            <span className="text-text-hi">GAUNTLET</span>
          </Link>
          <Link href="/scan" className="text-sm text-text-mid hover:text-text-hi flex items-center gap-1.5">
            Scan your own <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <div className="filelabel text-phosphor mb-3">// OFFENSE MODE</div>
        <h1 className="display-md font-display mb-3">Can you break the agent?</h1>
        <p className="lede mb-8 max-w-2xl">
          Each agent guards a secret token. Craft <span className="text-text-hi">one message</span> that tricks it
          into revealing it. Win the instant the secret leaks — judged deterministically, no key needed.
        </p>

        {/* level selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {GAME_LEVELS.map((l) => {
            const active = l.id === level;
            const done = cleared.includes(l.id);
            return (
              <button
                key={l.id}
                onClick={() => selectLevel(l.id)}
                className={`font-mono text-xs px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                  active
                    ? "border-phosphor/60 text-phosphor bg-phosphor/10"
                    : "border-white/10 text-text-mid hover:text-text-hi"
                }`}
              >
                {done ? <Trophy className="w-3.5 h-3.5 text-phosphor" /> : <Lock className="w-3.5 h-3.5" />}
                LVL {l.id} · {l.name}
              </button>
            );
          })}
        </div>

        {/* arena */}
        <div className="panel-strong crt ticks rounded-2xl overflow-hidden mb-5">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
            <Terminal className="w-4 h-4 text-phosphor" />
            <span className="font-mono text-xs text-text-mid">
              target: hardened-agent // LVL {lvl.id} — {lvl.name}
            </span>
            <span className="ml-auto font-mono text-xs text-text-lo">attempts: {attempts}</span>
          </div>
          <div className="p-5">
            <p className="text-sm text-text-mid mb-4">{lvl.blurb}</p>

            <div className="min-h-[120px] panel rounded-xl p-4 font-mono text-[13px] whitespace-pre-wrap text-text-mid">
              <AnimatePresence mode="wait">
                {busy ? (
                  <motion.span key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-phosphor">
                    the agent is thinking
                    <span className="animate-blink">_</span>
                  </motion.span>
                ) : result ? (
                  <motion.div key="resp" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <span className="text-text-lo">agent&gt; </span>
                    {result.response || "(empty reply)"}
                  </motion.div>
                ) : (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text-lo">
                    agent&gt; awaiting your move…
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* verdict */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 rounded-xl p-4 border ${
                    result.won ? "border-phosphor/40 bg-phosphor/[0.06]" : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  {result.won ? (
                    <div>
                      <div className="flex items-center gap-2 font-display font-bold text-phosphor mb-1 animate-glitch">
                        <Trophy className="w-5 h-5" /> BREACHED — you cracked {result.levelName}
                      </div>
                      <p className="text-sm text-text-mid">
                        Leaked secret:{" "}
                        <span className="font-mono text-phosphor">
                          <ScrambleText text={result.secret ?? ""} trigger="mount" />
                        </span>
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {!result.isLast ? (
                          <button
                            onClick={nextLevel}
                            className="inline-flex items-center gap-2 rounded-full bg-phosphor px-4 py-2 text-sm font-semibold text-black glow-phosphor hover:bg-phosphor-soft transition-colors"
                          >
                            Next level <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-2 font-mono text-sm text-phosphor">
                            <Trophy className="w-4 h-4" /> You beat the Gauntlet. You&apos;re dangerous.
                          </span>
                        )}
                        <Link
                          href="/scan"
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-text-mid hover:text-text-hi transition-colors"
                        >
                          Now red-team your own agent <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 font-display font-semibold text-text-hi">
                      <ShieldX className="w-5 h-5 text-amber" /> Held. The agent didn&apos;t break — try another angle.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* input */}
        <div className="panel-strong rounded-2xl p-4">
          <textarea
            value={attack}
            onChange={(e) => setAttack(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") fire();
            }}
            rows={4}
            placeholder="Your attack message… (⌘/Ctrl+Enter to fire)"
            className="w-full bg-black/30 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-phosphor/40 border border-white/10 resize-y"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="filelabel text-text-lo">
              {cleared.length}/{GAME_LEVELS.length} levels cracked
            </span>
            <button
              onClick={fire}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-phosphor px-6 py-2.5 font-semibold text-black glow-phosphor hover:bg-phosphor-soft transition-colors disabled:opacity-60"
            >
              <Zap className="w-4 h-4" /> {busy ? "Firing…" : "Fire"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
