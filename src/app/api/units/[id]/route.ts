import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import Unit, { UNIT_STATUSES_ENUM } from "@/models/Unit";
import { ROOM_TYPES_ENUM } from "@/models/Lead";

const patchSchema = z.object({
  agentId: z.string().min(1).optional(),
  building: z.string().min(1).optional(),
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  await connectDB();
  const unit = await Unit.findById(id);
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prevStatus = unit.status;
  Object.assign(unit, parsed.data);
  await unit.save();

  if (parsed.data.status && parsed.data.status !== prevStatus) {
    logAudit(session, "stage_change", "unit", id, `status: ${prevStatus} → ${parsed.data.status}`);
  } else {
    logAudit(session, "update", "unit", id, `Updated unit at ${unit.building}`);
  }

  return NextResponse.json(unit);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const unit = await Unit.findByIdAndDelete(id);
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  logAudit(session, "delete", "unit", id, `Deleted unit at ${unit.building}`);
  return NextResponse.json({ ok: true });
}
