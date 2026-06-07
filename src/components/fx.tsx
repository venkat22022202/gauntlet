"use client";

/**
 * GAUNTLET — motion FX primitives.
 * Diegetic spectacle: every effect reads as the tool doing its job (decode,
 * scan, lock-on, breach). All honor prefers-reduced-motion and pause offscreen.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

const GLYPHS = "ｦｧｨｩｪﾊﾋﾌﾍ!<>-_\\/[]{}=+*^?#01x";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

/* ── Scramble / decode text ─────────────────────────────────── */
export function ScrambleText({
  text,
  className,
  trigger = "view",
  speed = 1,
}: {
  text: string;
  className?: string;
  trigger?: "mount" | "view" | "hover";
  speed?: number;
}) {
  const reduce = useReducedMotion();
  const elRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const ran = useRef(false);

  const run = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    if (reduce) {
      el.textContent = text;
      return;
    }
    const chars = Array.from(text);
    const q = chars.map(() => {
      const start = Math.floor((Math.random() * 16) / speed);
      return { start, end: start + Math.floor((Math.random() * 18) / speed) + 8, r: "" };
    });
    let frame = 0;
    const tick = () => {
      let done = 0;
      let html = "";
      for (let i = 0; i < chars.length; i++) {
        const it = q[i];
        const ch = chars[i];
        if (frame >= it.end) {
          done++;
          html += ch === " " ? " " : escapeHtml(ch);
        } else if (frame >= it.start) {
          if (!it.r || Math.random() < 0.3) it.r = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          html += `<span style="color:#30d158;opacity:.75">${escapeHtml(it.r)}</span>`;
        } else {
          html += ch === " " ? " " : "";
        }
      }
      el.innerHTML = html;
      frame++;
      if (done < chars.length) rafRef.current = requestAnimationFrame(tick);
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    tick();
  }, [text, reduce, speed]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.textContent = text;
    if (trigger === "mount") {
      run();
    } else if (trigger === "view") {
      const io = new IntersectionObserver(
        (e) => {
          if (e[0].isIntersecting && !ran.current) {
            ran.current = true;
            run();
            io.disconnect();
          }
        },
        { threshold: 0.4 }
      );
      io.observe(el);
      return () => io.disconnect();
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [run, trigger, text]);

  return (
    <span
      ref={elRef}
      className={className}
      aria-label={text}
      onMouseEnter={trigger === "hover" ? () => run() : undefined}
    >
      {text}
    </span>
  );
}

/* ── Reactive targeting field (canvas) + cursor crosshair ───── */
export function TargetingField() {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -9999, y: -9999, inside: false });
  const cx = useSpring(-200, { stiffness: 420, damping: 32 });
  const cy = useSpring(-200, { stiffness: 420, damping: 32 });

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const wrapEl = wrapRef.current;
    if (!canvasEl || !wrapEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;
    // Non-null aliases so TS keeps the narrowing inside the rAF/event closures.
    const canvas = canvasEl;
    const wrap = wrapEl;
    const ctx = context;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const GAP = 34;
    let w = 0, h = 0, cols = 0, rows = 0;

    function resize() {
      const r = wrap.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / GAP);
      rows = Math.ceil(h / GAP);
    }
    resize();
    window.addEventListener("resize", resize);

    type Tracer = { x: number; y: number; tx: number; ty: number; life: number };
    let tracers: Tracer[] = [];
    let flares: { x: number; y: number; life: number }[] = [];
    let running = true;
    let raf = 0;
    let t = 0;
    const eo = (x: number) => 1 - Math.pow(1 - Math.min(1, x), 3);

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const m = mouse.current;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * GAP + GAP / 2;
          const y = j * GAP + GAP / 2;
          const d = m.inside ? Math.hypot(x - m.x, y - m.y) : 99999;
          const near = m.inside ? Math.max(0, 1 - d / 170) : 0;
          const phase = 0.13 + 0.07 * Math.sin(i * 0.5 + j * 0.3 + t * 0.04);
          const a = phase + near * 0.8;
          const s = 1.1 + near * 1.9;
          ctx.fillStyle = `rgba(48,209,88,${a})`;
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }
      const sy = ((t * 0.7) % (h + 80)) - 40;
      const g = ctx.createLinearGradient(0, sy - 24, 0, sy + 24);
      g.addColorStop(0, "rgba(48,209,88,0)");
      g.addColorStop(0.5, "rgba(48,209,88,0.14)");
      g.addColorStop(1, "rgba(48,209,88,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, sy - 24, w, 48);

      if (Math.random() < 0.045 && tracers.length < 6) {
        tracers.push({ x: Math.random() < 0.5 ? 0 : w, y: Math.random() * h, tx: Math.random() * w, ty: Math.random() * h, life: 0 });
      }
      tracers = tracers.filter((tr) => {
        tr.life += 0.045;
        const x = tr.x + (tr.tx - tr.x) * eo(tr.life);
        const y = tr.y + (tr.ty - tr.y) * eo(tr.life);
        ctx.strokeStyle = "rgba(48,209,88,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tr.x, tr.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = "rgba(126,247,166,0.9)";
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        if (tr.life >= 1) {
          flares.push({ x: tr.tx, y: tr.ty, life: 0 });
          return false;
        }
        return true;
      });
      flares = flares.filter((f) => {
        f.life += 0.05;
        const a = Math.max(0, 1 - f.life);
        ctx.strokeStyle = `rgba(255,69,58,${a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 2 + f.life * 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,69,58,${a})`;
        ctx.fillRect(f.x - 2, f.y - 2, 4, 4);
        return f.life < 1;
      });
      if (m.inside) {
        const rg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 130);
        rg.addColorStop(0, "rgba(48,209,88,0.1)");
        rg.addColorStop(1, "rgba(48,209,88,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(m.x - 130, m.y - 130, 260, 260);
      }
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      if (!running) return;
      t++;
      draw();
    }

    const io = new IntersectionObserver((e) => {
      running = e[0].isIntersecting && !document.hidden;
    }, { threshold: 0 });
    io.observe(wrap);
    const onVis = () => {
      running = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    function onMove(e: PointerEvent) {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      mouse.current = { x, y, inside };
      if (inside) {
        cx.set(x);
        cy.set(y);
      }
    }
    function onLeave() {
      mouse.current.inside = false;
    }
    window.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    if (reduce) draw();
    else frame();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce, cx, cy]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden" aria-hidden>
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!reduce && (
        <>
          <motion.div style={{ x: cx }} className="absolute top-0 bottom-0 w-px bg-phosphor/15" />
          <motion.div style={{ y: cy }} className="absolute left-0 right-0 h-px bg-phosphor/15" />
          <motion.div
            style={{ x: cx, y: cy }}
            className="absolute -ml-3 -mt-3 w-6 h-6 border border-phosphor/40 rounded"
          />
        </>
      )}
    </div>
  );
}

/* ── 3D mouse-parallax tilt (+ optional holographic glare) ──── */
export function Tilt({
  children,
  className,
  max = 6,
  glare = false,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 180, damping: 18 });
  const gx = useTransform(px, [0, 1], [12, 88]);
  const gy = useTransform(py, [0, 1], [12, 88]);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.16), transparent 55%)`;

  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100, transformStyle: "preserve-3d" }}
      className={`${glare ? "relative" : ""} ${className ?? ""}`}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden
          style={{ background: glareBg }}
          className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-overlay"
        />
      )}
    </motion.div>
  );
}

/* ── Declassify wipe — redaction recedes to reveal text ─────── */
export function RedactReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={`relative ${className ?? ""}`}>
      {children}
      {!reduce && (
        <motion.div
          aria-hidden
          initial={{ scaleX: 1 }}
          whileInView={{ scaleX: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay }}
          style={{ originX: 1, boxShadow: "-3px 0 16px rgba(48,209,88,0.5)" }}
          className="absolute -inset-x-1 inset-y-0 bg-ink-100 border-l-2 border-phosphor"
        />
      )}
    </div>
  );
}

/* ── Cursor-spotlight card ──────────────────────────────────── */
export function SpotlightCard({
  children,
  className,
  spot = "rgba(48,209,88,0.16)",
  border = "rgba(48,209,88,0.4)",
}: {
  children: React.ReactNode;
  className?: string;
  spot?: string;
  border?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--x", `${e.clientX - r.left}px`);
        el.style.setProperty("--y", `${e.clientY - r.top}px`);
      }}
      style={{ "--spot": spot, "--spot-border": border } as React.CSSProperties}
      className={`spotlight-card ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/* ── Periodic chromatic glitch (ambient, for the grade) ─────── */
export function GlitchText({
  children,
  className,
  every = 4200,
}: {
  children: React.ReactNode;
  className?: string;
  every?: number;
}) {
  const reduce = useReducedMotion();
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setOn(true);
      setTimeout(() => setOn(false), 520);
    }, every);
    return () => clearInterval(id);
  }, [reduce, every]);
  return <span className={`${className ?? ""} ${on ? "animate-glitch" : ""}`}>{children}</span>;
}

/* ── Magnetic wrapper for CTAs ──────────────────────────────── */
export function Magnetic({
  children,
  className,
  radius = 110,
  strength = 0.4,
}: {
  children: React.ReactNode;
  className?: string;
  radius?: number;
  strength?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });

  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        if (Math.hypot(mx, my) < radius) {
          x.set(mx * strength);
          y.set(my * strength);
        }
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x: sx, y: sy, display: "inline-flex" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Odometer number ticker ─────────────────────────────────── */
export function Counter({
  value,
  suffix = "",
  className,
  duration = 1100,
}: {
  value: number;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setN(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduce, duration]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {n}
      {suffix}
    </span>
  );
}
