"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link2, Megaphone, Code2, Check } from "lucide-react";

/**
 * Turns a dossier into the unit of sharing: copy the link, copy a pre-written
 * caption (so nobody has to write the tweet), or copy the README badge snippet
 * (the SSL-Labs-A+ compounding-distribution pattern).
 */
export function ShareBar({ id, grade, score }: { id: string; grade: string; score: number }) {
  const [done, setDone] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const reportUrl = `${origin}/report/${id}`;
  const caption = `My AI agent scored ${grade} (${score}/100) against Gauntlet's prompt-injection red-team. Can yours beat it? ${reportUrl}`;
  const badgeMd = `[![Gauntlet: ${grade}](${origin}/api/badge/${id})](${reportUrl})`;

  function copy(text: string, key: string, label: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setDone(key);
        toast.success(`${label} copied`);
        setTimeout(() => setDone((d) => (d === key ? null : d)), 1600);
      })
      .catch(() => toast.error("Couldn't copy"));
  }

  const Btn = ({
    k,
    onClick,
    icon,
    children,
  }: {
    k: string;
    onClick: () => void;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-text-mid hover:text-text-hi hover:border-phosphor/40 transition-colors"
    >
      {done === k ? <Check className="w-3.5 h-3.5 text-phosphor" /> : icon}
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="filelabel text-text-lo mr-1">SHARE THE DOSSIER</span>
      <Btn k="link" onClick={() => copy(reportUrl, "link", "Link")} icon={<Link2 className="w-3.5 h-3.5" />}>
        Copy link
      </Btn>
      <Btn k="cap" onClick={() => copy(caption, "cap", "Caption")} icon={<Megaphone className="w-3.5 h-3.5" />}>
        Copy caption
      </Btn>
      <Btn k="badge" onClick={() => copy(badgeMd, "badge", "Badge")} icon={<Code2 className="w-3.5 h-3.5" />}>
        Copy README badge
      </Btn>
    </div>
  );
}
