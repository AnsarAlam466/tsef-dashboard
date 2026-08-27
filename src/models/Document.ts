import { Schema, models, model, Types } from "mongoose";
import { DEPARTMENTS } from "./User";

export interface IDocument {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  department?: (typeof DEPARTMENTS)[number] | null;
  description?: string;
  uploadedBy?: Types.ObjectId | null;
  uploadedByName: string;
  createdAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  department: { type: String, enum: DEPARTMENTS, default: null },
  description: { type: String, default: "" },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  uploadedByName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default models.Document || model<IDocument>("Document", DocumentSchema);
