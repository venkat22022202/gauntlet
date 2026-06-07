"use client";

/**
 * GAUNTLET — ⌘K command bar.
 *
 * Built to Emil Kowalski's spec:
 * - Keyboard-initiated toggle is used often → it opens essentially INSTANTLY
 *   (no scale/slide; only a 110ms backdrop fade so it isn't jarring). Raycast
 *   has no open animation; that's the optimal feel for a 100×/day action.
 * - The ONE animated thing is decorative + alive: a spring-glided "lock-on"
 *   reticle that slides between rows (interruptible, keeps velocity on fast
 *   arrow-key nav). transform/opacity only; reduced-motion safe.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Play,
  Sparkles,
  Swords,
  Trophy,
  Github,
  Home,
  CornerDownLeft,
  Search,
} from "lucide-react";

const ROW_H = 48;

interface Cmd {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  run: (router: ReturnType<typeof useRouter>) => void;
}

const COMMANDS: Cmd[] = [
  { id: "scan", label: "Run a scan", hint: "red-team your prompt", keywords: "scan run gauntlet test attack", icon: Play, run: (r) => r.push("/scan") },
  { id: "demo", label: "Try a live demo", hint: "no key needed", keywords: "demo sample try free", icon: Sparkles, run: (r) => r.push("/scan?demo=1") },
  { id: "break", label: "Break the agent", hint: "offense game", keywords: "break game offense gandalf play hack", icon: Swords, run: (r) => r.push("/break") },
  { id: "leaderboard", label: "Leaderboard", hint: "most-hardened agents", keywords: "leaderboard rank top hall of shame", icon: Trophy, run: (r) => r.push("/leaderboard") },
  { id: "home", label: "Home", hint: "back to the top", keywords: "home landing start", icon: Home, run: (r) => r.push("/") },
  { id: "github", label: "View on GitHub", hint: "star the repo", keywords: "github source code star open", icon: Github, run: () => window.open("https://github.com/venkat22022202/gauntlet", "_blank") },
];

export function CommandPalette() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return COMMANDS;
    return COMMANDS.filter((c) => (c.label + " " + c.keywords).toLowerCase().includes(needle));
  }, [q]);

  const close = useCallback(() => setOpen(false), []);
  const openIt = useCallback(() => {
    setQ("");
    setSel(0);
    setOpen(true);
  }, []);

  // ⌘K / Ctrl+K toggle, plus a custom event so any "⌘K" chip can open it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQ("");
        setSel(0);
      }
    };
    const onOpen = () => openIt();
    window.addEventListener("keydown", onKey);
    window.addEventListener("gauntlet:cmdk", onOpen as EventListener);
    // deep-link / demo aid: /path?cmdk opens it
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("cmdk")) {
      openIt();
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("gauntlet:cmdk", onOpen as EventListener);
    };
  }, [openIt]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (sel >= results.length) setSel(Math.max(0, results.length - 1));
  }, [results.length, sel]);

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(results.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = results[sel];
      if (cmd) {
        close();
        cmd.run(router);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          // backdrop — fast fade only (the toggle itself stays instant)
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.11, ease: [0.23, 1, 0.32, 1] }}
          onMouseDown={close}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 pt-[18vh]"
        >
          <motion.div
            // panel — appears near-instant; tiny scale so it isn't "from nothing"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ transformOrigin: "top center" }}
            className="w-full max-w-lg panel-strong crt rounded-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
          >
            {/* input */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.06]">
              <span className="font-mono text-phosphor text-sm">&gt;</span>
              <Search className="w-4 h-4 text-text-lo" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Type a command…"
                className="flex-1 bg-transparent outline-none text-[15px] font-mono text-text-hi placeholder:text-text-lo"
              />
              <kbd className="filelabel text-text-lo border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            {/* results */}
            <div className="relative p-2" style={{ minHeight: results.length ? results.length * ROW_H + 8 : 64 }}>
              {/* spring lock-on reticle */}
              {results.length > 0 && (
                <motion.div
                  aria-hidden
                  animate={{ y: sel * ROW_H }}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 700, damping: 40, mass: 0.6 }}
                  className="absolute left-2 right-2 rounded-lg bg-phosphor/[0.10] border border-phosphor/35 pointer-events-none"
                  style={{ height: ROW_H, top: 8, boxShadow: "0 0 24px -8px rgba(48,209,88,0.5)" }}
                />
              )}

              {results.length === 0 && (
                <div className="h-16 flex items-center justify-center font-mono text-sm text-text-lo">
                  no command matches “{q}”
                </div>
              )}

              {results.map((c, i) => {
                const active = i === sel;
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    onMouseMove={() => setSel(i)}
                    onClick={() => {
                      close();
                      c.run(router);
                    }}
                    style={{ height: ROW_H }}
                    className="relative z-10 w-full flex items-center gap-3 px-3 rounded-lg text-left"
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-phosphor" : "text-text-lo"}`} />
                    <span className={`text-sm font-medium ${active ? "text-text-hi" : "text-text-mid"}`}>{c.label}</span>
                    <span className="ml-auto font-mono text-[11px] text-text-lo">{c.hint}</span>
                    {active && <CornerDownLeft className="w-3.5 h-3.5 text-phosphor shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* footer */}
            <div className="flex items-center gap-4 px-4 h-9 border-t border-white/[0.06] filelabel text-text-lo">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span className="ml-auto">GAUNTLET ⌘K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
