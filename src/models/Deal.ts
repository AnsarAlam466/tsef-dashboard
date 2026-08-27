import { Schema, models, model, Types } from "mongoose";

export const DEAL_STATUSES_ENUM = ["negotiating", "confirmed", "paid", "cancelled"] as const;

export interface IDeal {
  leadId: Types.ObjectId;
  unitId?: Types.ObjectId | null;
  agentId?: Types.ObjectId | null;
  value?: number;
  feePercent: number;
  feeAmount?: number;
  status: (typeof DEAL_STATUSES_ENUM)[number];
  closedBy?: string;
  closedAt?: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit", default: null },
    agentId: { type: Schema.Types.ObjectId, ref: "HousingAgent", default: null },
    value: { type: Number },
    feePercent: { type: Number, default: 10 },
    feeAmount: { type: Number },
    status: { type: String, enum: DEAL_STATUSES_ENUM, default: "negotiating" },
    closedBy: { type: String, default: "" },
    closedAt: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.Deal || model<IDeal>("Deal", DealSchema);
