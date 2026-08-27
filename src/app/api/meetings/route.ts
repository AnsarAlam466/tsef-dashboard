import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import Meeting from "@/models/Meeting";
import Task from "@/models/Task";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const meetings = await Meeting.find().sort({ date: -1, createdAt: -1 }).lean();
  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title || !body.date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectDB();

  const meeting = await Meeting.create({
    title: body.title,
    date: body.date,
    attendees: body.attendees || [],
    summary: body.summary || "",
    decisions: body.decisions || [],
    openQuestions: body.openQuestions || [],
    taskIds: [],
    createdBy: session.user.id,
  });

  // If parsed tasks were passed along, create them and link to this meeting
  if (Array.isArray(body.tasks) && body.tasks.length) {
    const created = await Task.insertMany(
      body.tasks.map((t: Record<string, unknown>) => ({
        ...t,
        status: "not_started",
        meetingId: meeting._id,
        createdBy: session.user.id,
      }))
    );
    meeting.taskIds = created.map((t) => t._id);
    await meeting.save();
  }

  logAudit(session, "create", "meeting", meeting._id.toString(), `Created meeting ${meeting.title}`);
  return NextResponse.json(meeting, { status: 201 });
}
