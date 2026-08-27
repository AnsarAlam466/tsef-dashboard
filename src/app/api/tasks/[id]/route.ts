import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import Task from "@/models/Task";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  await connectDB();

  const prev = await Task.findById(id).lean<{ status: string }>();
  const task = await Task.findByIdAndUpdate(id, body, { new: true });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.status && prev && body.status !== prev.status) {
    logAudit(session, "stage_change", "task", id, `status: ${prev.status} → ${body.status}`);
  } else {
    logAudit(session, "update", "task", id, `Updated task ${task.title}`);
  }

  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const task = await Task.findByIdAndDelete(id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  logAudit(session, "delete", "task", id, `Deleted task ${task.title}`);
  return NextResponse.json({ ok: true });
}
