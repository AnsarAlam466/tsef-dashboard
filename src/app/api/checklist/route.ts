import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { marked } from "marked";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await readFile(path.join(process.cwd(), "content", "official-documents.md"), "utf-8");
  const html = await marked.parse(raw);
  return NextResponse.json({ html });
}
