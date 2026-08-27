import { Schema, models, model, Types } from "mongoose";
import { ROOM_TYPES_ENUM } from "./Lead";

export const UNIT_STATUSES_ENUM = ["offered", "shared_with_lead", "viewed", "taken", "expired"] as const;

export interface IUnit {
  agentId: Types.ObjectId;
  building: string;
  roomType?: (typeof ROOM_TYPES_ENUM)[number];
  pricePerPerson?: number;
  totalPrice?: number;
  capacity: number;
  availableFrom?: string;
  photosReceived: boolean;
  description?: string;
  status: (typeof UNIT_STATUSES_ENUM)[number];
  sharedWithLeadIds: string[];
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema = new Schema<IUnit>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "HousingAgent", required: true },
    building: { type: String, required: true, trim: true },
    roomType: { type: String, enum: ROOM_TYPES_ENUM },
    pricePerPerson: { type: Number },
    totalPrice: { type: Number },
    capacity: { type: Number, default: 1 },
    availableFrom: { type: String, default: "" },
    photosReceived: { type: Boolean, default: false },
    description: { type: String, default: "" },
    status: { type: String, enum: UNIT_STATUSES_ENUM, default: "offered" },
    sharedWithLeadIds: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default models.Unit || model<IUnit>("Unit", UnitSchema);
