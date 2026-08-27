import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { downloadFromGridFS } from "@/lib/gridfs";
import DocumentModel from "@/models/Document";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const doc = await DocumentModel.findById(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let buffer: Buffer;
  try {
    buffer = await downloadFromGridFS(doc.fileName);
  } catch {
    return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
  }
  logAudit(session, "download", "document", id, doc.originalName);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.originalName)}"`,
    },
  });
}
