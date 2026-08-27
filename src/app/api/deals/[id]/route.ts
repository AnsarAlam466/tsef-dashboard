import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import Deal, { DEAL_STATUSES_ENUM } from "@/models/Deal";

const patchSchema = z.object({
  leadId: z.string().min(1).optional(),
  unitId: z.string().optional(),
  agentId: z.string().optional(),
  value: z.number().optional(),
  feePercent: z.number().optional(),
  status: z.enum(DEAL_STATUSES_ENUM).optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  await connectDB();
  const deal = await Deal.findById(id);
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prevStatus = deal.status;
  Object.assign(deal, parsed.data);

  if (parsed.data.value !== undefined || parsed.data.feePercent !== undefined) {
    deal.feeAmount = ((deal.value ?? 0) * deal.feePercent) / 100;
  }
  if ((deal.status === "confirmed" || deal.status === "paid") && !deal.closedAt) {
    deal.closedAt = new Date();
    deal.closedBy = session.user.name || "";
  }
  await deal.save();

  if (parsed.data.status && parsed.data.status !== prevStatus) {
    logAudit(session, "stage_change", "deal", id, `status: ${prevStatus} → ${parsed.data.status}`);
  } else {
    logAudit(session, "update", "deal", id, `Updated deal`);
  }

  return NextResponse.json(deal);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const deal = await Deal.findByIdAndDelete(id);
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  logAudit(session, "delete", "deal", id, "Deleted deal");
  return NextResponse.json({ ok: true });
}
