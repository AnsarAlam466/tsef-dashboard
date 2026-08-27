import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import Unit, { UNIT_STATUSES_ENUM } from "@/models/Unit";
import { ROOM_TYPES_ENUM } from "@/models/Lead";

const unitSchema = z.object({
  agentId: z.string().min(1),
  building: z.string().min(1),
  roomType: z.enum(ROOM_TYPES_ENUM).optional(),
  pricePerPerson: z.number().optional(),
  totalPrice: z.number().optional(),
  capacity: z.number().optional(),
  availableFrom: z.string().optional(),
  photosReceived: z.boolean().optional(),
  description: z.string().optional(),
  status: z.enum(UNIT_STATUSES_ENUM).optional(),
  sharedWithLeadIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const agentId = req.nextUrl.searchParams.get("agentId");
  const filter = agentId ? { agentId } : {};
  const units = await Unit.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json(units);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = unitSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  await connectDB();
  const unit = await Unit.create({ ...parsed.data, createdBy: session.user.id });
  logAudit(session, "create", "unit", unit._id.toString(), `Created unit at ${unit.building}`);

  return NextResponse.json(unit, { status: 201 });
}
