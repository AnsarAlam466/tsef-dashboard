import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import Lead, { ROOM_TYPES_ENUM, LEAD_SOURCES, LEAD_STAGES_ENUM } from "@/models/Lead";

const leadSchema = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  nationality: z.string().optional(),
  university: z.string().optional(),
  budget: z.number().optional(),
  roomType: z.enum(ROOM_TYPES_ENUM).optional(),
  preferredBuildings: z.array(z.string()).optional(),
  moveInDate: z.string().optional(),
  groupSize: z.number().optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  stage: z.enum(LEAD_STAGES_ENUM).optional(),
  assignedTo: z.string().optional(),
  linkedLeadIds: z.array(z.string()).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const leads = await Lead.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = leadSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  await connectDB();
  const lead = await Lead.create({ ...parsed.data, createdBy: session.user.id });
  logAudit(session, "create", "lead", lead._id.toString(), `Created lead ${lead.name}`);

  return NextResponse.json(lead, { status: 201 });
}
