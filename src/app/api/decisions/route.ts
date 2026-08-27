import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import Decision from "@/models/Decision";
import { DEPARTMENTS } from "@/models/User";

const decisionSchema = z.object({
  text: z.string().min(1),
  owner: z.string().min(1),
  deadline: z.string().min(1),
  department: z.enum(DEPARTMENTS).optional(),
  meetingId: z.string().nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const decisions = await Decision.find().sort({ deadline: 1, createdAt: -1 }).lean();
  return NextResponse.json(decisions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = decisionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  await connectDB();
  const decision = await Decision.create({
    ...parsed.data,
    meetingId: parsed.data.meetingId || null,
    createdBy: session.user.id,
  });
  logAudit(session, "create", "decision", decision._id.toString(), `Created decision: ${decision.text}`);

  return NextResponse.json(decision, { status: 201 });
}
