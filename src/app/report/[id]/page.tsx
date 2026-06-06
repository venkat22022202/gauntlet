import Link from "next/link";
import { Crosshair, ShieldAlert, ShieldCheck, TriangleAlert, ArrowLeft } from "lucide-react";
import { getScanReport } from "@/server/persistence";
import { ScoreRing } from "@/components/score-ring";

export const dynamic = "force-dynamic";

const V: Record<string, { c: string; label: string }> = {
  blocked: { c: "#22c55e", label: "BLOCKED" },
  partial: { c: "#f5a524", label: "PARTIAL" },
  breached: { c: "#ff2d55", label: "BREACHED" },
};

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getScanReport(id);

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 inset-x-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
            <Crosshair className="w-5 h-5 text-crimson" />
            <span className="text-gradient">GAUNTLET</span>
          </Link>
          <Link href="/scan" className="text-sm text-text-mid hover:text-text-hi flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Run your own
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        {!report ? (
          <div className="glass-strong rounded-2xl p-12 text-center">
            <TriangleAlert className="w-10 h-10 text-warn mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Report unavailable</h1>
            <p className="text-text-mid">
              This report doesn&apos;t exist, or persistence isn&apos;t configured on this
              deployment (no <code className="font-mono">DATABASE_URL</code>).
            </p>
          </div>
        ) : (
          <>
            <div className="glass-strong rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 mb-6">
              <ScoreRing score={report.scan.score} />
              <div className="flex-1 w-full">
                <h1 className="font-display text-2xl font-bold mb-1">
                  {report.scan.label ?? "Breach report"}
                </h1>
                <p className="font-mono text-xs text-text-lo mb-4">
                  model {report.scan.model} · {report.scan.totalAttacks} attacks ·{" "}
                  {new Date(report.scan.createdAt).toISOString().slice(0, 10)}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(["breached", "partial", "blocked"] as const).map((k) => (
                    <div key={k} className="glass rounded-xl p-4 text-center">
                      <div className="font-display text-3xl font-extrabold" style={{ color: V[k].c }}>
                        {report.scan[k]}
                      </div>
                      <div className="text-[10px] tracking-widest font-mono mt-1" style={{ color: V[k].c }}>
                        {V[k].label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-strong rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 font-mono text-xs text-text-mid">
                attack-by-attack
              </div>
              <div className="p-3">
                {report.results.map((r) => {
                  const s = V[r.verdict] ?? V.blocked;
                  const Icon = r.verdict === "breached" ? ShieldAlert : r.verdict === "partial" ? TriangleAlert : ShieldCheck;
                  return (
                    <div key={r.id} className="glass rounded-xl mb-1.5 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" style={{ color: s.c }} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{r.name}</div>
                          <div className="text-[11px] text-text-lo font-mono truncate">{r.technique}</div>
                        </div>
                        <span
                          className="ml-auto text-[10px] tracking-widest px-2 py-0.5 rounded-full shrink-0 font-mono"
                          style={{ color: s.c, background: `${s.c}1a`, border: `1px solid ${s.c}40` }}
                        >
                          {s.label}
                        </span>
                      </div>
                      {r.response && (
                        <pre className="mt-3 text-xs font-mono whitespace-pre-wrap glass rounded-lg p-3 text-text-mid">
                          {r.response}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
