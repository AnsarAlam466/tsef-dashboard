import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import Decision, { DECISION_STATUSES_ENUM } from "@/models/Decision";

const statusSchema = z.object({ status: z.enum(DECISION_STATUSES_ENUM) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const extraKeys = Object.keys(body).filter((k) => k !== "status");
  if (extraKeys.length > 0) {
    return NextResponse.json({ error: "Decisions are immutable — only status can change" }, { status: 400 });
  }
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  await connectDB();
  const before = await Decision.findById(id);
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prevStatus = before.status;
  before.status = parsed.data.status;
  await before.save();
  logAudit(session, "stage_change", "decision", id, `decision status: ${prevStatus} → ${parsed.data.status}`);

  return NextResponse.json(before);
}

export async function DELETE() {
  return NextResponse.json({ error: "Decisions cannot be deleted (compliance)" }, { status: 405 });
}
