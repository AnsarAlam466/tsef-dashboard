import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { uploadToGridFS } from "@/lib/gridfs";
import { logAudit } from "@/lib/audit";
import DocumentModel from "@/models/Document";

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const docs = await DocumentModel.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  const department = (formData.get("department") as string) || null;
  const description = (formData.get("description") as string) || "";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const gridFsId = await uploadToGridFS(buffer, file.name, file.type || "application/octet-stream");

  await connectDB();
  const doc = await DocumentModel.create({
    fileName: gridFsId,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    department,
    description,
    uploadedBy: session.user.id,
    uploadedByName: session.user.name,
  });
  logAudit(session, "create", "document", doc._id.toString(), file.name);

  return NextResponse.json(doc, { status: 201 });
}
