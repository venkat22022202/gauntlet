import { NextResponse } from "next/server";
import { getLeaderboard } from "@/server/persistence";

export const runtime = "nodejs";

export async function GET() {
  const rows = await getLeaderboard(50);
  return NextResponse.json(
    { entries: rows },
    { headers: { "Cache-Control": "public, max-age=120" } }
  );
}
