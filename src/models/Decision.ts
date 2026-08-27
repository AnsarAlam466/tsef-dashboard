import { Schema, models, model, Types } from "mongoose";
import { DEPARTMENTS } from "./User";

export const DECISION_STATUSES_ENUM = ["open", "executed", "missed"] as const;

export interface IDecision {
  text: string;
  owner: string;
  deadline: string;
  department: (typeof DEPARTMENTS)[number];
  meetingId?: Types.ObjectId | null;
  status: (typeof DECISION_STATUSES_ENUM)[number];
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const DecisionSchema = new Schema<IDecision>(
  {
    text: { type: String, required: true, trim: true },
    owner: { type: String, required: true },
    deadline: { type: String, required: true },
    department: { type: String, enum: DEPARTMENTS, default: "ops" },
    meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", default: null },
    status: { type: String, enum: DECISION_STATUSES_ENUM, default: "open" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default models.Decision || model<IDecision>("Decision", DecisionSchema);
