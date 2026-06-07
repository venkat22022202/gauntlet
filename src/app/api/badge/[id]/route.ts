import { getScanSummary } from "@/server/persistence";
import { gradeFromScore } from "@/lib/grade";

export const runtime = "nodejs";

/** A shields-style SVG badge for READMEs: `[GAUNTLET | A 88]`, colored by grade. */
function badge(letter: string, value: string, color: string): string {
  const labelW = 72;
  const valueW = Math.max(34, 14 + value.length * 8);
  const w = labelW + valueW;
  const vMid = labelW + valueW / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="Gauntlet hardening grade: ${letter}">
  <title>Gauntlet hardening grade: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#0b0d0b"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="${color}"/>
    <rect width="${w}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="36" y="15" fill="#010101" fill-opacity=".3">GAUNTLET</text>
    <text x="36" y="14">GAUNTLET</text>
    <text x="${vMid}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${vMid}" y="14">${value}</text>
  </g>
</svg>`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scan = await getScanSummary(id);

  const svg = scan
    ? (() => {
        const g = gradeFromScore(scan.score);
        return badge(g.letter, `${g.letter} ${g.score}`, g.color);
      })()
    : badge("?", "? n/a", "#6e6e73");

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
