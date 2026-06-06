"use client";

import { motion } from "framer-motion";

function gradeColor(score: number): string {
  if (score >= 85) return "#22c55e";
  if (score >= 60) return "#f5a524";
  if (score >= 35) return "#ff2d55";
  return "#ff2d55";
}

function gradeLabel(score: number): string {
  if (score >= 85) return "HARDENED";
  if (score >= 60) return "EXPOSED";
  if (score >= 35) return "WEAK";
  return "CRITICAL";
}

export function ScoreRing({ score, size = 220 }: { score: number; size?: number }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = gradeColor(score);
  const offset = c * (1 - score / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="font-display text-5xl font-extrabold"
          style={{ color }}
        >
          {score}
        </motion.span>
        <span className="font-mono text-xs tracking-[0.25em] mt-1" style={{ color }}>
          {gradeLabel(score)}
        </span>
        <span className="text-[10px] text-text-lo mt-0.5 font-mono">HARDENING SCORE</span>
      </div>
    </div>
  );
}
