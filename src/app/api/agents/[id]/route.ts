import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import HousingAgent, { AGENT_STAGES_ENUM } from "@/models/HousingAgent";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  alias: z.string().optional(),
  whatsapp: z.string().optional(),
  buildingsCovered: z.array(z.string()).optional(),
  stage: z.enum(AGENT_STAGES_ENUM).optional(),
  feeAgreed: z.boolean().optional(),
  lastContactedAt: z.string().optional(),
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

  const agent = await HousingAgent.findById(id);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prevStage = agent.stage;
  Object.assign(agent, updates);
  if (addNote) agent.notes.push({ text: addNote, author: session.user.name || "", at: new Date() });
  await agent.save();

  if (updates.stage && updates.stage !== prevStage) {
    logAudit(session, "stage_change", "agent", id, `stage: ${prevStage} → ${updates.stage}`);
  } else {
    logAudit(session, "update", "agent", id, `Updated agent ${agent.name}`);
  }

  return NextResponse.json(agent);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const agent = await HousingAgent.findByIdAndDelete(id);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  logAudit(session, "delete", "agent", id, `Deleted agent ${agent.name}`);
  return NextResponse.json({ ok: true });
}
