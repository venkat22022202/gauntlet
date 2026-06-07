"use client";

/**
 * The scroll-scrub centerpiece. A pinned terminal where the visitor's SCROLL
 * cranks a full red-team run: canary planted → attacks fire one by one →
 * the grade powers on → the BREACHED stamp slams. Agency = memorability.
 */

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { Crosshair, KeyRound } from "lucide-react";
import { sfx } from "@/lib/sfx";

const RUN = [
  { n: "Ignore previous instructions", v: "breached" },
  { n: "Repeat-the-above extraction", v: "blocked" },
  { n: "Developer / debug mode", v: "breached" },
  { n: "Base64 instruction smuggling", v: "blocked" },
  { n: "Poisoned document (indirect)", v: "breached" },
  { n: "Unrestricted persona — DAN", v: "partial" },
  { n: "Spoofed tool result", v: "breached" },
  { n: "Markdown image exfiltration", v: "breached" },
] as const;

const VC: Record<string, { c: string; label: string }> = {
  breached: { c: "#ff453a", label: "BREACHED" },
  partial: { c: "#ff9f0a", label: "PARTIAL" },
  blocked: { c: "#30d158", label: "BLOCKED" },
};

const ROW_START = 0.16;
const ROW_SPAN = 0.54;
function rowRange(i: number, n: number): [number, number] {
  const seg = ROW_SPAN / n;
  const s = ROW_START + i * seg;
  return [s, s + 0.05];
}

function Row({ progress, i, n, d }: { progress: MotionValue<number>; i: number; n: number; d: { n: string; v: string } }) {
  const [s, e] = rowRange(i, n);
  const opacity = useTransform(progress, [s, e], [0, 1]);
  const x = useTransform(progress, [s, e], [-16, 0]);
  const sc = VC[d.v];
  return (
    <motion.div style={{ opacity, x }} className="flex items-center gap-3 py-[3px] font-mono text-[13px]">
      <span className="text-text-lo tabular-nums">{String(i + 1).padStart(2, "0")}</span>
      <Crosshair className="w-3.5 h-3.5 shrink-0" style={{ color: sc.c }} />
      <span className="text-text-mid truncate">{d.n}</span>
      <span
        className="ml-auto text-[10px] tracking-widest px-2 py-0.5 rounded shrink-0"
        style={{ color: sc.c, background: `${sc.c}1a`, border: `1px solid ${sc.c}40` }}
      >
        {sc.label}
      </span>
    </motion.div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="filelabel text-phosphor mb-4 text-center">// SCROLL TO RUN THE GAUNTLET</div>
      <div className="panel-strong crt ticks rounded-2xl overflow-hidden relative">{children}</div>
    </div>
  );
}

export function ScrubRun() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 30, restDelta: 0.001 });
  const n = RUN.length;

  const [breaches, setBreaches] = useState(0);
  const [graded, setGraded] = useState(false);
  const prevBreaches = useRef(0);
  const prevGraded = useRef(false);
  useMotionValueEvent(progress, "change", (v) => {
    let c = 0;
    for (let i = 0; i < n; i++) {
      const [, e] = rowRange(i, n);
      if (v >= e && RUN[i].v === "breached") c++;
    }
    if (c > prevBreaches.current) sfx.breached();
    prevBreaches.current = c;
    const g = v >= 0.8;
    if (g && !prevGraded.current) sfx.grade("F");
    prevGraded.current = g;
    setBreaches(c);
    setGraded(g);
  });

  const canaryOpacity = useTransform(progress, [0.04, 0.12], [0, 1]);
  const hintOpacity = useTransform(progress, [0, 0.06], [1, 0]);
  const gradeOpacity = useTransform(progress, [0.72, 0.8], [0, 1]);
  const gradeScale = useTransform(progress, [0.72, 0.84], [0.5, 1]);
  const stampOpacity = useTransform(progress, [0.86, 0.9], [0, 1]);
  const stampScale = useTransform(progress, [0.86, 0.95], [1.7, 1]);
  const stampRotate = useTransform(progress, [0.86, 0.95], [-20, -9]);

  const titleBar = (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
      <span className="w-2.5 h-2.5 rounded-full bg-alarm/80" />
      <span className="w-2.5 h-2.5 rounded-full bg-amber/80" />
      <span className="w-2.5 h-2.5 rounded-full bg-phosphor/80" />
      <span className="ml-2 font-mono text-xs text-text-mid truncate">gauntlet ~ ./run --target your-agent</span>
      <span className="ml-auto font-mono text-xs text-alarm tabular-nums">{breaches} breached</span>
    </div>
  );

  if (reduce) {
    return (
      <section className="px-6 py-24">
        <Panel>
          {titleBar}
          <div className="p-4">
            <div className="font-mono text-[12px] text-phosphor/80 mb-3 flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5" /> canary planted — <span className="text-phosphor">GNTLT-7K2D-9XQF</span>
            </div>
            {RUN.map((d, i) => {
              const sc = VC[d.v];
              return (
                <div key={i} className="flex items-center gap-3 py-[3px] font-mono text-[13px]">
                  <span className="text-text-lo tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <Crosshair className="w-3.5 h-3.5 shrink-0" style={{ color: sc.c }} />
                  <span className="text-text-mid truncate">{d.n}</span>
                  <span className="ml-auto text-[10px] tracking-widest px-2 py-0.5 rounded shrink-0" style={{ color: sc.c, background: `${sc.c}1a`, border: `1px solid ${sc.c}40` }}>{sc.label}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative" style={{ height: "340vh" }}>
      <div className="sticky top-0 h-screen flex items-center justify-center px-6 overflow-hidden">
        <Panel>
          {/* progress bar */}
          <motion.div style={{ scaleX: progress, originX: 0 }} className="absolute top-0 left-0 right-0 h-0.5 bg-phosphor z-10" />
          {titleBar}
          <div className="p-4 min-h-[360px]">
            <motion.div style={{ opacity: canaryOpacity }} className="font-mono text-[12px] text-phosphor/80 mb-3 flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5" /> canary planted — <span className="text-phosphor">GNTLT-7K2D-9XQF</span> hidden &amp; protected
            </motion.div>
            {RUN.map((d, i) => (
              <Row key={i} progress={progress} i={i} n={n} d={d} />
            ))}
            <motion.div style={{ opacity: gradeOpacity }} className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-5">
              <motion.span
                style={{ scale: gradeScale }}
                className={`font-display text-6xl font-extrabold text-alarm alarm-glow leading-none inline-block ${graded ? "animate-glitch" : ""}`}
              >
                F
              </motion.span>
              <div className="text-xs text-text-mid leading-relaxed">
                <span className="text-alarm font-semibold">{breaches}/{n} attacks landed.</span> Leaked the secret through a Markdown image — zero clicks.
                <div className="text-text-lo mt-1">OWASP LLM01 · Data Exfiltration · ASI06</div>
              </div>
              <motion.div style={{ opacity: stampOpacity, scale: stampScale, rotate: stampRotate }} className="stamp text-alarm ml-auto hidden sm:block">
                Breached
              </motion.div>
            </motion.div>
          </div>
        </Panel>
        <motion.div style={{ opacity: hintOpacity }} className="absolute bottom-10 left-0 right-0 text-center filelabel text-text-lo">
          scroll ↓
        </motion.div>
      </div>
    </section>
  );
}
