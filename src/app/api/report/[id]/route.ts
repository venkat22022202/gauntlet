import { NextRequest, NextResponse } from "next/server";
import { getScanReport } from "@/server/persistence";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = await getScanReport(id);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  return NextResponse.json(report, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
