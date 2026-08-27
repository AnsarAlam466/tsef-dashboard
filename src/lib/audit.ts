import { connectDB } from "@/lib/db";
import AuditLog from "@/models/AuditLog";

type AuditSession = { user?: { id?: string; name?: string | null } | null } | null;

export async function logAudit(
  session: AuditSession,
  action: string,
  entityType: string,
  entityId: string,
  summary: string
) {
  try {
    await connectDB();
    await AuditLog.create({
      actor: session?.user?.name || "",
      actorId: session?.user?.id || null,
      action,
      entityType,
      entityId,
      summary,
    });
  } catch {
    // audit failure must never break the main request
  }
}
