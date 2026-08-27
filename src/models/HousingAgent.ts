import { Schema, models, model, Types } from "mongoose";
import { NoteSchema, INote } from "./Lead";

export const AGENT_STAGES_ENUM = ["to_contact", "contacted", "responsive", "active", "inactive"] as const;

export interface IHousingAgent {
  name: string;
  alias?: string;
  whatsapp?: string;
  buildingsCovered: string[];
  stage: (typeof AGENT_STAGES_ENUM)[number];
  feeAgreed: boolean;
  lastContactedAt?: Date | null;
  notes: INote[];
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const HousingAgentSchema = new Schema<IHousingAgent>(
  {
    name: { type: String, required: true, trim: true },
    alias: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    buildingsCovered: { type: [String], default: [] },
    stage: { type: String, enum: AGENT_STAGES_ENUM, default: "to_contact" },
    feeAgreed: { type: Boolean, default: false },
    lastContactedAt: { type: Date, default: null },
    notes: { type: [NoteSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default models.HousingAgent || model<IHousingAgent>("HousingAgent", HousingAgentSchema);
