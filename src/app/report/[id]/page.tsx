import type { Metadata } from "next";
import Link from "next/link";
import { Crosshair, ShieldAlert, ShieldCheck, TriangleAlert, ArrowLeft, ArrowRight, Ban, Radiation } from "lucide-react";
import { getScanReport, getScorePercentile } from "@/server/persistence";
import { gradeFromScore, brutalVerdict, killingBlow } from "@/lib/grade";
import { owaspForCategory } from "@/lib/attacks";
import { GradeBadge } from "@/components/grade-badge";
import { ShareBar } from "@/components/share-bar";
import { Tilt, ScrambleText, SpotlightCard } from "@/components/fx";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const report = await getScanReport(id);
  if (!report) return { title: "Gauntlet — breach dossier" };
  const g = gradeFromScore(report.scan.score);
  const verdict = brutalVerdict({
    breached: report.scan.breached,
    partial: report.scan.partial,
    blocked: report.scan.blocked,
    worst: killingBlow(report.results),
  });
  const title = `Gauntlet: ${g.letter} — ${report.scan.label ?? "an AI agent"} scored ${g.score}/100`;
  const ogUrl = `/api/og/${id}`;
  return {
    title,
    description: verdict,
    openGraph: { title, description: verdict, type: "website", images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description: verdict, images: [ogUrl] },
  };
}

const V: Record<string, { c: string; label: string }> = {
  blocked: { c: "#30d158", label: "BLOCKED" },
  partial: { c: "#ff9f0a", label: "PARTIAL" },
  breached: { c: "#ff453a", label: "BREACHED" },
  error: { c: "#6e6e73", label: "ERROR" },
};

function iconFor(verdict: string) {
  if (verdict === "breached") return ShieldAlert;
  if (verdict === "partial") return TriangleAlert;
  if (verdict === "error") return Ban;
  return ShieldCheck;
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getScanReport(id);

  // Derive the dossier (pure) + percentile (DB) only when we actually have a report.
  const grade = report ? gradeFromScore(report.scan.score) : null;
  const results = report?.results ?? [];
  const worst = killingBlow(results);
  const verdict = report
    ? brutalVerdict({
        breached: report.scan.breached,
        partial: report.scan.partial,
        blocked: report.scan.blocked,
        worst,
      })
    : "";
  const pct = report ? await getScorePercentile(report.scan.score) : null;
  const isExfil = (r: { reasons: unknown }) =>
    Array.isArray(r.reasons) && r.reasons.some((x) => typeof x === "string" && /exfiltrat/i.test(x));

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono text-base font-bold">
            <Crosshair className="w-5 h-5 text-phosphor" />
            <span className="text-text-hi">GAUNTLET</span>
          </Link>
          <Link href="/scan" className="text-sm text-text-mid hover:text-text-hi flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Run your own
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        {!report || !grade ? (
          <div className="panel-strong rounded-2xl p-12 text-center">
            <TriangleAlert className="w-10 h-10 text-amber mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Report unavailable</h1>
            <p className="text-text-mid">
              This report doesn&apos;t exist, or persistence isn&apos;t configured on this deployment
              (no <code className="font-mono">DATABASE_URL</code>).
            </p>
          </div>
        ) : (
          <>
            {/* DOSSIER */}
            <Tilt glare max={5} className="mb-6 rounded-2xl">
            <div className="panel-strong crt ticks rounded-2xl p-7 sm:p-9">
              <div className="flex items-center justify-between filelabel text-text-lo mb-7">
                <span>GAUNTLET · BREACH DOSSIER</span>
                <span>No. {id.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <GradeBadge grade={grade} />

                <div className="flex-1 w-full">
                  <h1 className="font-display text-2xl font-bold mb-1">
                    {report.scan.label ?? "Breach dossier"}
                  </h1>
                  <p className="font-mono text-xs text-text-lo mb-5">
                    model {report.scan.model} · {report.scan.totalAttacks} attacks ·{" "}
                    {new Date(report.scan.createdAt).toISOString().slice(0, 10)}
                  </p>

                  <p className="text-[15px] leading-relaxed text-text-hi mb-5" style={{ maxWidth: "46ch" }}>
                    <ScrambleText text={verdict} trigger="view" />
                  </p>

                  {worst && (
                    <div className="mb-5 font-mono text-xs flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="text-text-lo">KILLING BLOW</span>
                      <span className="text-alarm"><ScrambleText text={worst.name} trigger="view" /></span>
                      <span className="text-text-lo">·</span>
                      <span className="text-phosphor">{owaspForCategory(worst.category)}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    {(["breached", "partial", "blocked"] as const).map((k) => (
                      <div key={k} className="panel rounded-xl p-4 text-center">
                        <div className="font-display text-3xl font-extrabold tabular-nums" style={{ color: V[k].c }}>
                          {report.scan[k]}
                        </div>
                        <div className="text-[10px] tracking-widest font-mono mt-1" style={{ color: V[k].c }}>
                          {V[k].label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {pct && pct.sample >= 5 && (
                    <p className="mt-4 font-mono text-[11px] text-text-lo">
                      more hardened than <span className="text-phosphor">{pct.percentile}%</span> of{" "}
                      {pct.sample} scanned agents
                    </p>
                  )}
                </div>
              </div>

              <div className="hairline my-7" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <ShareBar id={id} grade={grade.letter} score={grade.score} />
                <Link
                  href="/scan"
                  className="inline-flex items-center gap-2 rounded-full bg-phosphor px-5 py-2.5 text-sm font-semibold text-black glow-phosphor hover:bg-phosphor-soft transition-colors shrink-0"
                >
                  Scan your own agent <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            </Tilt>

            {/* ATTACK-BY-ATTACK */}
            <div className="panel-strong rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06] font-mono text-xs text-text-mid">
                attack-by-attack
              </div>
              <div className="p-3">
                {results.map((r) => {
                  const s = V[r.verdict] ?? V.blocked;
                  const Icon = iconFor(r.verdict);
                  const exfil = isExfil(r);
                  const reason = Array.isArray(r.reasons) && typeof r.reasons[0] === "string" ? (r.reasons[0] as string) : null;
                  return (
                    <SpotlightCard
                      key={r.id}
                      className="panel rounded-xl mb-1.5 px-4 py-3"
                      spot={r.verdict === "breached" ? "rgba(255,69,58,0.14)" : "rgba(48,209,88,0.13)"}
                      border={r.verdict === "breached" ? "rgba(255,69,58,0.4)" : "rgba(48,209,88,0.35)"}
                    >
                      <div className="relative z-10">
                      <div className="flex items-center gap-3">
                        {exfil ? (
                          <Radiation className="w-4 h-4 shrink-0 text-alarm" />
                        ) : (
                          <Icon className="w-4 h-4 shrink-0" style={{ color: s.c }} />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{r.name}</div>
                          <div className="text-[11px] text-text-lo font-mono truncate">
                            {r.technique} · {owaspForCategory(r.category)}
                          </div>
                        </div>
                        <span
                          className="ml-auto text-[10px] tracking-widest px-2 py-0.5 rounded-full shrink-0 font-mono"
                          style={{ color: s.c, background: `${s.c}1a`, border: `1px solid ${s.c}40` }}
                        >
                          {s.label}
                        </span>
                      </div>
                      {reason && (
                        <p className="mt-2.5 text-xs" style={{ color: r.verdict === "breached" ? "#ff8a82" : "var(--color-text-mid)" }}>
                          {reason}
                        </p>
                      )}
                      {r.response && (
                        <pre className="mt-2.5 text-xs font-mono whitespace-pre-wrap panel rounded-lg p-3 text-text-mid">
                          {r.response}
                        </pre>
                      )}
                      </div>
                    </SpotlightCard>
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
