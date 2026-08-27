import { Schema, models, model } from "mongoose";

export const DEPARTMENTS = ["tech", "marketing", "ops", "finance", "sales", "support"] as const;
export type Department = (typeof DEPARTMENTS)[number];

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  department: Department;
  avatarColor: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "Member" },
  department: { type: String, enum: DEPARTMENTS, default: "ops" },
  avatarColor: { type: String, default: "#C9A06B" },
  createdAt: { type: Date, default: Date.now },
});

export default models.User || model<IUser>("User", UserSchema);
