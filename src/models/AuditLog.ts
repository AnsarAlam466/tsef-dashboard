import { Schema, models, model, Types } from "mongoose";

export interface IAuditLog {
  actor: string;
  actorId?: Types.ObjectId | null;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  at: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  actor: { type: String, default: "" },
  actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  action: { type: String, required: true },
  entityType: { type: String, default: "" },
  entityId: { type: String, default: "" },
  summary: { type: String, default: "" },
  at: { type: Date, default: Date.now },
});

export default models.AuditLog || model<IAuditLog>("AuditLog", AuditLogSchema);
