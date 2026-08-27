import { Schema, models, model, Types } from "mongoose";

export interface IMeeting {
  title: string;
  date: string;
  attendees: string[];
  summary: string;
  decisions: string[];
  openQuestions: string[];
  taskIds: Types.ObjectId[];
  status: "logged" | "reviewed";
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    attendees: { type: [String], default: [] },
    summary: { type: String, default: "" },
    decisions: { type: [String], default: [] },
    openQuestions: { type: [String], default: [] },
    taskIds: { type: [Schema.Types.ObjectId], ref: "Task", default: [] },
    status: { type: String, enum: ["logged", "reviewed"], default: "logged" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default models.Meeting || model<IMeeting>("Meeting", MeetingSchema);
