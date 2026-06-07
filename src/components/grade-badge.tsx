"use client";

import { motion } from "framer-motion";
import type { Grade } from "@/lib/grade";

/**
 * The letter grade, rendered as the dossier hero. Big, glowing, signal-colored.
 * `stamp` overlays a rotated BREACHED/CLEARED stamp for the shareable card.
 */
export function GradeBadge({
  grade,
  size = 168,
  showStamp = true,
}: {
  grade: Grade;
  size?: number;
  showStamp?: boolean;
}) {
  const breached = grade.letter === "D" || grade.letter === "F";
  const glow = `drop-shadow(0 0 26px ${grade.color}aa)`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-3xl border"
        style={{
          borderColor: `${grade.color}40`,
          background: `radial-gradient(60% 60% at 50% 35%, ${grade.color}1f, transparent 70%)`,
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
          className="font-display font-extrabold leading-none"
          style={{ color: grade.color, fontSize: size * 0.5, filter: glow }}
        >
          {grade.letter}
        </motion.span>
        <span
          className="font-mono mt-2 tracking-[0.28em]"
          style={{ color: grade.color, fontSize: size * 0.072 }}
        >
          {grade.band}
        </span>
        <span className="font-mono text-text-lo mt-1" style={{ fontSize: size * 0.062 }}>
          {grade.score}/100
        </span>
      </div>

      {showStamp && breached && (
        <motion.div
          initial={{ opacity: 0, scale: 1.6, rotate: -16 }}
          animate={{ opacity: 1, scale: 1, rotate: -9 }}
          transition={{ type: "spring", stiffness: 220, damping: 13, delay: 0.25 }}
          className="stamp text-alarm absolute -bottom-3 -right-3 text-xs"
        >
          Breached
        </motion.div>
      )}
    </div>
  );
}
