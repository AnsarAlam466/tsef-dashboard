import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import Task from "@/models/Task";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const tasks = await Task.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title || !body.department || !body.assignedTo) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectDB();
  const task = await Task.create({
    title: body.title,
    department: body.department,
    assignedTo: body.assignedTo,
    priority: body.priority || "secondary",
    status: body.status || "not_started",
    startDate: body.startDate || "",
    dueDate: body.dueDate || "",
    fallback: body.fallback || "",
    dependencies: body.dependencies || [],
    meetingId: body.meetingId || null,
    createdBy: session.user.id,
  });
  logAudit(session, "create", "task", task._id.toString(), `Created task ${task.title}`);

  return NextResponse.json(task, { status: 201 });
}
