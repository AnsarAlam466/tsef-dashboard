import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import Deal, { DEAL_STATUSES_ENUM } from "@/models/Deal";

const dealSchema = z.object({
  leadId: z.string().min(1),
  unitId: z.string().optional(),
  agentId: z.string().optional(),
  value: z.number().optional(),
  feePercent: z.number().optional(),
  status: z.enum(DEAL_STATUSES_ENUM).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const deals = await Deal.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = dealSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const data = parsed.data;
  const value = data.value ?? 0;
  const feePercent = data.feePercent ?? 10;

  await connectDB();
  const deal = await Deal.create({
    ...data,
    feePercent,
    feeAmount: (value * feePercent) / 100,
    ...(data.status === "confirmed" || data.status === "paid"
      ? { closedAt: new Date(), closedBy: session.user.name || "" }
      : {}),
  });
  logAudit(session, "create", "deal", deal._id.toString(), `Created deal (RM ${value})`);

  return NextResponse.json(deal, { status: 201 });
}
