import { Schema, models, model, Types } from "mongoose";
import { DEPARTMENTS } from "./User";

export const PRIORITIES = ["primary", "secondary", "parallel"] as const;
export const STATUSES = ["not_started", "in_progress", "done", "blocked"] as const;

export interface ITask {
  title: string;
  department: (typeof DEPARTMENTS)[number];
  assignedTo: string;
  priority: (typeof PRIORITIES)[number];
  status: (typeof STATUSES)[number];
  startDate?: string;
  dueDate?: string;
  fallback?: string;
  dependencies: string[];
  meetingId?: Types.ObjectId | null;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, enum: DEPARTMENTS, required: true },
    assignedTo: { type: String, required: true },
    priority: { type: String, enum: PRIORITIES, default: "secondary" },
    status: { type: String, enum: STATUSES, default: "not_started" },
    startDate: { type: String },
    dueDate: { type: String },
    fallback: { type: String, default: "" },
    dependencies: { type: [String], default: [] },
    meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default models.Task || model<ITask>("Task", TaskSchema);
