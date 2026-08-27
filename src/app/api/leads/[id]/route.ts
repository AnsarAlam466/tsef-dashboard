import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import Lead, { ROOM_TYPES_ENUM, LEAD_SOURCES, LEAD_STAGES_ENUM } from "@/models/Lead";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
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
  addNote: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { addNote, ...updates } = parsed.data;
  await connectDB();

  const existing = await Lead.findById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prevStage = existing.stage;
  Object.assign(existing, updates);
  if (addNote) existing.notes.push({ text: addNote, author: session.user.name || "", at: new Date() });
  await existing.save();

  if (updates.stage && updates.stage !== prevStage) {
    logAudit(session, "stage_change", "lead", id, `stage: ${prevStage} → ${updates.stage}`);
  } else {
    logAudit(session, "update", "lead", id, `Updated lead ${existing.name}`);
  }

  return NextResponse.json(existing);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const lead = await Lead.findByIdAndDelete(id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  logAudit(session, "delete", "lead", id, `Deleted lead ${lead.name}`);
  return NextResponse.json({ ok: true });
}
