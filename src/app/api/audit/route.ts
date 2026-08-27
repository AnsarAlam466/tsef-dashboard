import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import AuditLog from "@/models/AuditLog";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const logs = await AuditLog.find().sort({ at: -1 }).limit(200).lean();
  return NextResponse.json(logs);
}
