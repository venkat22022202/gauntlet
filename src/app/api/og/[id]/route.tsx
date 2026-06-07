import { ImageResponse } from "next/og";
import { getScanReport } from "@/server/persistence";
import { gradeFromScore, brutalVerdict, killingBlow } from "@/lib/grade";
import { owaspForCategory } from "@/lib/attacks";

export const runtime = "nodejs";

const BG = "#000000";
const HI = "#f5f5f7";
const MID = "#a1a1a6";
const LO = "#6e6e73";
const PHOSPHOR = "#30d158";

const FONT_400 = "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.18/files/jetbrains-mono-latin-400-normal.woff";
const FONT_700 = "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.18/files/jetbrains-mono-latin-700-normal.woff";

async function loadFonts() {
  try {
    const [r400, r700] = await Promise.all([
      fetch(FONT_400).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject())),
      fetch(FONT_700).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject())),
    ]);
    return [
      { name: "JetBrains Mono", data: r400, weight: 400 as const, style: "normal" as const },
      { name: "JetBrains Mono", data: r700, weight: 700 as const, style: "normal" as const },
    ];
  } catch {
    return undefined; // fall back to the bundled default font
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getScanReport(id);
  const fonts = await loadFonts();

  // Graceful fallback card when the report can't be loaded.
  if (!report) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: BG, color: HI, fontFamily: "JetBrains Mono", fontSize: 56, fontWeight: 700 }}>
          <div style={{ display: "flex", color: PHOSPHOR }}>GAUNTLET</div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 28, color: MID }}>Is your AI agent hackable?</div>
        </div>
      ),
      { width: 1200, height: 630, fonts }
    );
  }

  const g = gradeFromScore(report.scan.score);
  const worst = killingBlow(report.results);
  const verdictRaw = brutalVerdict({
    breached: report.scan.breached,
    partial: report.scan.partial,
    blocked: report.scan.blocked,
    worst,
  });
  const verdict = verdictRaw.length > 116 ? verdictRaw.slice(0, 113) + "…" : verdictRaw;
  const breached = g.letter === "D" || g.letter === "F";

  const counts: [string, number, string][] = [
    ["BREACHED", report.scan.breached, "#ff453a"],
    ["PARTIAL", report.scan.partial, "#ff9f0a"],
    ["BLOCKED", report.scan.blocked, PHOSPHOR],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          color: HI,
          fontFamily: "JetBrains Mono",
          padding: 64,
          position: "relative",
        }}
      >
        {/* top accent */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: g.color }} />

        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22 }}>
          <div style={{ display: "flex", color: PHOSPHOR, fontWeight: 700, letterSpacing: 2 }}>GAUNTLET</div>
          <div style={{ display: "flex", color: LO, letterSpacing: 3 }}>BREACH DOSSIER · No. {id.slice(0, 8).toUpperCase()}</div>
        </div>

        {/* body */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", marginTop: 8 }}>
          {/* grade */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 300 }}>
            <div style={{ display: "flex", fontSize: 240, fontWeight: 700, color: g.color, lineHeight: 1 }}>{g.letter}</div>
            <div style={{ display: "flex", fontSize: 28, color: g.color, letterSpacing: 6, marginTop: 8 }}>{g.band}</div>
            <div style={{ display: "flex", fontSize: 22, color: LO, marginTop: 6 }}>{g.score}/100</div>
          </div>

          {/* right */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: 56 }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: HI }}>{report.scan.label ?? "AI agent"}</div>
            <div style={{ display: "flex", fontSize: 20, color: LO, marginTop: 6 }}>model {report.scan.model} · {report.scan.totalAttacks} attacks</div>
            <div style={{ display: "flex", fontSize: 33, color: HI, marginTop: 22, lineHeight: 1.25 }}>{verdict}</div>
            {worst && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", fontSize: 18, marginTop: 20 }}>
                <span style={{ display: "flex", color: LO, letterSpacing: 2 }}>KILLING BLOW</span>
                <span style={{ display: "flex", color: LO, marginLeft: 12, marginRight: 12 }}>—</span>
                <span style={{ display: "flex", color: "#ff453a" }}>{worst.name}</span>
                <span style={{ display: "flex", color: LO, marginLeft: 12, marginRight: 12 }}>·</span>
                <span style={{ display: "flex", color: PHOSPHOR }}>{owaspForCategory(worst.category)}</span>
              </div>
            )}
            <div style={{ display: "flex", marginTop: 26 }}>
              {counts.map(([label, n, c]) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 40 }}>
                  <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: c }}>{n}</div>
                  <div style={{ display: "flex", fontSize: 15, color: c, letterSpacing: 3, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 19, color: LO }}>
          <div style={{ display: "flex" }}>gauntlet-indol.vercel.app</div>
          <div style={{ display: "flex", color: PHOSPHOR }}>&gt; run your own</div>
        </div>

        {breached && (
          <div
            style={{
              position: "absolute",
              top: 96,
              right: 72,
              display: "flex",
              transform: "rotate(-9deg)",
              border: "4px solid #ff453a",
              color: "#ff453a",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: 6,
              padding: "8px 18px",
              borderRadius: 8,
            }}
          >
            BREACHED
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630, fonts }
  );
}
