import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import Meeting from "@/models/Meeting";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  await connectDB();

  const meeting = await Meeting.findByIdAndUpdate(id, body, { new: true });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  logAudit(session, "update", "meeting", id, `Updated meeting ${meeting.title}`);
  return NextResponse.json(meeting);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const meeting = await Meeting.findByIdAndDelete(id);
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  logAudit(session, "delete", "meeting", id, `Deleted meeting ${meeting.title}`);
  return NextResponse.json({ ok: true });
}
