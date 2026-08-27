import { Schema, models, model, Types } from "mongoose";

export const ROOM_TYPES_ENUM = ["master", "medium", "private_studio", "whole_unit"] as const;
export const LEAD_SOURCES = ["whatsapp", "chat_widget", "booking_form", "referral", "direct"] as const;
export const LEAD_STAGES_ENUM = ["new", "contacted", "matching", "viewing", "closing", "won", "lost"] as const;

export interface INote {
  text: string;
  author: string;
  at: Date;
}

export const NoteSchema = new Schema<INote>(
  {
    text: { type: String, required: true },
    author: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

export interface ILead {
  name: string;
  contact?: string;
  nationality?: string;
  university?: string;
  budget?: number;
  roomType?: (typeof ROOM_TYPES_ENUM)[number];
  preferredBuildings: string[];
  moveInDate?: string;
  groupSize: number;
  source: (typeof LEAD_SOURCES)[number];
  stage: (typeof LEAD_STAGES_ENUM)[number];
  assignedTo?: string;
  notes: INote[];
  linkedLeadIds: string[];
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, default: "" },
    nationality: { type: String, default: "" },
    university: { type: String, default: "" },
    budget: { type: Number },
    roomType: { type: String, enum: ROOM_TYPES_ENUM },
    preferredBuildings: { type: [String], default: [] },
    moveInDate: { type: String, default: "" },
    groupSize: { type: Number, default: 1 },
    source: { type: String, enum: LEAD_SOURCES, default: "whatsapp" },
    stage: { type: String, enum: LEAD_STAGES_ENUM, default: "new" },
    assignedTo: { type: String, default: "" },
    notes: { type: [NoteSchema], default: [] },
    linkedLeadIds: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default models.Lead || model<ILead>("Lead", LeadSchema);
