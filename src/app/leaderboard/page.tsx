import Link from "next/link";
import { Crosshair, Trophy, ArrowLeft, ShieldAlert } from "lucide-react";
import { getLeaderboard } from "@/server/persistence";

export const dynamic = "force-dynamic";

function grade(score: number) {
  if (score >= 85) return { c: "#22c55e", label: "HARDENED" };
  if (score >= 60) return { c: "#f5a524", label: "EXPOSED" };
  return { c: "#ff2d55", label: "CRITICAL" };
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboard(50);

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 inset-x-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
            <Crosshair className="w-5 h-5 text-crimson" />
            <span className="text-gradient">GAUNTLET</span>
          </Link>
          <Link href="/scan" className="text-sm text-text-mid hover:text-text-hi flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Run a scan
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <div className="text-center mb-10">
          <Trophy className="w-10 h-10 text-warn mx-auto mb-3" />
          <h1 className="font-display text-3xl md:text-4xl font-bold">Agent Leaderboard</h1>
          <p className="text-text-mid mt-2">Public red-team results — who breaks easiest under the gauntlet.</p>
        </div>

        {entries.length === 0 ? (
          <div className="glass-strong rounded-2xl p-12 text-center text-text-mid">
            No public submissions yet. Run a scan, opt in to publish, and claim the top spot.
          </div>
        ) : (
          <div className="glass-strong rounded-2xl overflow-hidden">
            {entries.map((e, i) => {
              const g = grade(e.score);
              return (
                <div key={e.id} className="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0">
                  <div className="font-display text-lg font-bold text-text-lo w-8">{i + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{e.agentName}</div>
                    <div className="font-mono text-[11px] text-text-lo truncate">{e.model}{e.source ? ` · ${e.source}` : ""}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-crimson font-mono text-sm">
                    <ShieldAlert className="w-4 h-4" /> {e.breached}
                  </div>
                  <div
                    className="text-xs font-mono px-2.5 py-1 rounded-full w-24 text-center"
                    style={{ color: g.c, background: `${g.c}1a`, border: `1px solid ${g.c}40` }}
                  >
                    {e.score} · {g.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
