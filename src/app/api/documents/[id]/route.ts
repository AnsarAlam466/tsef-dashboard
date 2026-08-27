import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { deleteFromGridFS } from "@/lib/gridfs";
import DocumentModel from "@/models/Document";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const doc = await DocumentModel.findByIdAndDelete(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFromGridFS(doc.fileName);

  logAudit(session, "delete", "document", id, `Deleted document ${doc.originalName}`);
  return NextResponse.json({ ok: true });
}
