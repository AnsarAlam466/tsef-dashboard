import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import HousingAgent, { AGENT_STAGES_ENUM } from "@/models/HousingAgent";

const agentSchema = z.object({
  name: z.string().min(1),
  alias: z.string().optional(),
  whatsapp: z.string().optional(),
  buildingsCovered: z.array(z.string()).optional(),
  stage: z.enum(AGENT_STAGES_ENUM).optional(),
  feeAgreed: z.boolean().optional(),
  lastContactedAt: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const agents = await HousingAgent.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = agentSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  await connectDB();
  const agent = await HousingAgent.create({ ...parsed.data, createdBy: session.user.id });
  logAudit(session, "create", "agent", agent._id.toString(), `Created agent ${agent.name}`);

  return NextResponse.json(agent, { status: 201 });
}
