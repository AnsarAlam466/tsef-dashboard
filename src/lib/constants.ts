export const DEPTS: Record<string, { name: string; icon: string; color: string; owner: string }> = {
  tech: { name: "Product & Technology", icon: "💻", color: "#8FB6A8", owner: "Danny" },
  marketing: { name: "Marketing & Growth", icon: "📣", color: "#C98B8B", owner: "Marwa" },
  ops: { name: "Operations & Admin", icon: "🛠", color: "#C9A06B", owner: "Ansar" },
  finance: { name: "Finance & Strategy", icon: "💰", color: "#10B981", owner: "TBD" },
  sales: { name: "Sales & Biz Dev", icon: "💼", color: "#B8954A", owner: "TBD" },
  support: { name: "Technical Support", icon: "🔧", color: "#A395C9", owner: "TBD" },
};

export const TIMELINE_DEPTS = ["tech", "marketing", "ops", "finance"];

export const PEOPLE_COLORS: Record<string, string> = {
  Danny: "#8FB6A8",
  Marwa: "#C98B8B",
  Ansar: "#C9A06B",
};

export const PRIORITY_LABEL: Record<string, string> = {
  primary: "🔴 Primary",
  secondary: "🟡 Secondary",
  parallel: "🟢 Parallel",
};

export const STATUS_LABEL: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
};

export type Task = {
  _id: string;
  title: string;
  department: string;
  assignedTo: string;
  priority: "primary" | "secondary" | "parallel";
  status: "not_started" | "in_progress" | "done" | "blocked";
  startDate?: string;
  dueDate?: string;
  fallback?: string;
  dependencies?: string[];
  meetingId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Meeting = {
  _id: string;
  title: string;
  date: string;
  attendees: string[];
  summary: string;
  decisions: string[];
  openQuestions: string[];
  taskIds: string[];
  status: string;
  createdAt: string;
};

export type Doc = {
  _id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  department?: string | null;
  description?: string;
  uploadedByName: string;
  createdAt: string;
};

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(task: Task) {
  return !!task.dueDate && task.dueDate < today() && task.status !== "done";
}

export function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---- CRM (Ten&See marketplace) ----

export type CrmNote = { text: string; author: string; at: string };

export type Lead = {
  _id: string;
  name: string;
  contact?: string;
  nationality?: string;
  university?: string;
  budget?: number;
  roomType?: "master" | "medium" | "private_studio" | "whole_unit";
  preferredBuildings: string[];
  moveInDate?: string;
  groupSize: number;
  source: "whatsapp" | "chat_widget" | "booking_form" | "referral" | "direct";
  stage: "new" | "contacted" | "matching" | "viewing" | "closing" | "won" | "lost";
  assignedTo?: string;
  notes: CrmNote[];
  linkedLeadIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type HousingAgent = {
  _id: string;
  name: string;
  alias?: string;
  whatsapp?: string;
  buildingsCovered: string[];
  stage: "to_contact" | "contacted" | "responsive" | "active" | "inactive";
  feeAgreed: boolean;
  lastContactedAt?: string | null;
  notes: CrmNote[];
  createdAt: string;
  updatedAt: string;
};

export type UnitListing = {
  _id: string;
  agentId: string;
  building: string;
  roomType?: "master" | "medium" | "private_studio" | "whole_unit";
  pricePerPerson?: number;
  totalPrice?: number;
  capacity: number;
  availableFrom?: string;
  photosReceived: boolean;
  description?: string;
  status: "offered" | "shared_with_lead" | "viewed" | "taken" | "expired";
  sharedWithLeadIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type Deal = {
  _id: string;
  leadId: string;
  unitId?: string | null;
  agentId?: string | null;
  value?: number;
  feePercent: number;
  feeAmount?: number;
  status: "negotiating" | "confirmed" | "paid" | "cancelled";
  closedBy?: string;
  closedAt?: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditEntry = {
  _id: string;
  actor: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  at: string;
};

export const LEAD_STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "matching", label: "Matching" },
  { key: "viewing", label: "Viewing" },
  { key: "closing", label: "Closing" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
] as const;

export const AGENT_STAGES = [
  { key: "to_contact", label: "To Contact" },
  { key: "contacted", label: "Contacted" },
  { key: "responsive", label: "Responsive" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
] as const;

export const ROOM_TYPES = [
  { key: "master", label: "Master Room" },
  { key: "medium", label: "Medium Room" },
  { key: "private_studio", label: "Private/Studio" },
  { key: "whole_unit", label: "Whole Unit" },
] as const;

export const UNIT_STATUSES = [
  { key: "offered", label: "Offered" },
  { key: "shared_with_lead", label: "Shared with Lead" },
  { key: "viewed", label: "Viewed" },
  { key: "taken", label: "Taken" },
  { key: "expired", label: "Expired" },
] as const;

export const DEAL_STATUSES = [
  { key: "negotiating", label: "Negotiating" },
  { key: "confirmed", label: "Confirmed" },
  { key: "paid", label: "Paid" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export const BUILDINGS = ["D'Latour", "DK"] as const;

export type Decision = {
  _id: string;
  text: string;
  owner: string;
  deadline: string;
  department: string;
  meetingId?: string | null;
  status: "open" | "executed" | "missed";
  createdAt: string;
};

export const DECISION_STATUSES = [
  { key: "open", label: "Open" },
  { key: "executed", label: "Executed" },
  { key: "missed", label: "Missed" },
] as const;
