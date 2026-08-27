"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher, apiPatch, apiDelete } from "@/lib/fetcher";
import { Lead, UnitListing, HousingAgent, LEAD_STAGES, ROOM_TYPES, BUILDINGS, UNIT_STATUSES } from "@/lib/constants";
import Drawer, { SectionTitle } from "@/components/Drawer";
import { FormLabel, inputCls } from "@/components/Modal";
import CrmNotes from "@/components/CrmNotes";
import { roomTypeLabel } from "@/components/CrmCard";
import { useToast } from "@/components/Toast";

const PEOPLE = ["Danny", "Marwa", "Ansar"];
const SOURCES: Lead["source"][] = ["whatsapp", "chat_widget", "booking_form", "referral", "direct"];

function buildOutreach(lead: Lead) {
  const room = roomTypeLabel(lead.roomType) || "Room";
  const buildings = lead.preferredBuildings.length ? lead.preferredBuildings.join(" or ") : "any building";
  const budget = lead.budget ?? 0;
  const group = lead.groupSize > 1 ? ` (${lead.groupSize} people, RM${budget * lead.groupSize} total)` : "";
  return `Hi! I'm helping a few friends find rooms for the upcoming semester.\n\nLooking for:\n- ${room} at ${buildings} — budget around RM${budget}/person${group}\n\nCould you send me photos, prices, and availability for anything that matches? Thanks!`;
}

export default function LeadDrawer({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  return (
    <Drawer open={!!lead} onClose={onClose} title={lead?.name || ""}>
      {lead && <LeadDetail key={lead._id} lead={lead} onClose={onClose} />}
    </Drawer>
  );
}

function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const showToast = useToast();
  const { data: units = [] } = useSWR<UnitListing[]>("/api/units", fetcher);
  const { data: agents = [] } = useSWR<HousingAgent[]>("/api/agents", fetcher);

  const [form, setForm] = useState({
    name: lead.name,
    contact: lead.contact || "",
    nationality: lead.nationality || "",
    university: lead.university || "",
    budget: lead.budget != null ? String(lead.budget) : "",
    roomType: lead.roomType || "",
    preferredBuildings: lead.preferredBuildings,
    moveInDate: lead.moveInDate || "",
    groupSize: String(lead.groupSize || 1),
    source: lead.source,
    stage: lead.stage,
    assignedTo: lead.assignedTo || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const linkedUnits = units.filter((u) => u.sharedWithLeadIds.includes(lead._id));
  const matches = units.filter((u) => {
    if (u.sharedWithLeadIds.includes(lead._id)) return false;
    if (u.status !== "offered" && u.status !== "shared_with_lead") return false;
    if (lead.preferredBuildings.length && !lead.preferredBuildings.includes(u.building)) return false;
    if (u.roomType && lead.roomType && u.roomType !== lead.roomType) return false;
    if (u.pricePerPerson != null && lead.budget != null && u.pricePerPerson > lead.budget * 1.1) return false;
    return true;
  });

  async function handleSave() {
    if (!form.name.trim()) return showToast("Name is required.");
    setSaving(true);
    try {
      await apiPatch(`/api/leads/${lead._id}`, {
        name: form.name,
        contact: form.contact,
        nationality: form.nationality,
        university: form.university,
        budget: form.budget ? Number(form.budget) : undefined,
        roomType: form.roomType || undefined,
        preferredBuildings: form.preferredBuildings,
        moveInDate: form.moveInDate || undefined,
        groupSize: Number(form.groupSize) || 1,
        source: form.source,
        stage: form.stage,
        assignedTo: form.assignedTo,
      });
      await mutate("/api/leads");
      showToast("Lead updated");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete lead "${lead.name}"?`)) return;
    try {
      await apiDelete(`/api/leads/${lead._id}`);
      await mutate("/api/leads");
      showToast("Lead deleted");
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function addNote(text: string) {
    try {
      await apiPatch(`/api/leads/${lead._id}`, { addNote: text });
      await mutate("/api/leads");
      showToast("Note added");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function shareUnit(u: UnitListing) {
    try {
      await apiPatch(`/api/units/${u._id}`, { sharedWithLeadIds: [...u.sharedWithLeadIds, lead._id], status: "shared_with_lead" });
      await mutate("/api/units");
      showToast(`Shared ${u.building} unit with ${lead.name}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function copyOutreach() {
    navigator.clipboard.writeText(buildOutreach(lead)).then(
      () => showToast("Outreach message copied"),
      () => showToast("Could not copy to clipboard")
    );
  }

  const waDigits = (lead.contact || "").replace(/\D/g, "");
  const agentName = (id: string) => agents.find((a) => a._id === id)?.name || "—";
  const unitStatusLabel = (s: string) => UNIT_STATUSES.find((x) => x.key === s)?.label || s;

  return (
    <>
      <div className="mb-4 flex gap-2">
        <button onClick={copyOutreach} className="flex-1 rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B]">
          Copy outreach message
        </button>
        {waDigits && (
          <a
            href={`https://wa.me/${waDigits}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg border border-[#2E3A32] bg-[#232D27] px-3.5 py-1.5 text-center text-xs font-semibold text-[#10B981] hover:bg-[#2C3830]"
          >
            Open WhatsApp
          </a>
        )}
      </div>

      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Name</FormLabel>
          <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <FormLabel>Contact</FormLabel>
          <input className={inputCls} value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="+60…" />
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Nationality</FormLabel>
          <input className={inputCls} value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
        </div>
        <div>
          <FormLabel>University</FormLabel>
          <input className={inputCls} value={form.university} onChange={(e) => set("university", e.target.value)} />
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Budget (RM/person)</FormLabel>
          <input type="number" className={inputCls} value={form.budget} onChange={(e) => set("budget", e.target.value)} />
        </div>
        <div>
          <FormLabel>Room Type</FormLabel>
          <select className={inputCls} value={form.roomType} onChange={(e) => set("roomType", e.target.value)}>
            <option value="">—</option>
            {ROOM_TYPES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-3.5">
        <FormLabel>Preferred Buildings</FormLabel>
        <div className="flex flex-wrap gap-2">
          {BUILDINGS.map((b) => (
            <label key={b} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#2E3A32] bg-[#232D27] px-2.5 py-1.5 text-[12px] hover:bg-[#2C3830]">
              <input
                type="checkbox"
                className="accent-[#B8954A]"
                checked={form.preferredBuildings.includes(b)}
                onChange={() =>
                  set("preferredBuildings", form.preferredBuildings.includes(b) ? form.preferredBuildings.filter((x) => x !== b) : [...form.preferredBuildings, b])
                }
              />
              {b}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Move-in Date</FormLabel>
          <input type="date" className={inputCls} value={form.moveInDate} onChange={(e) => set("moveInDate", e.target.value)} />
        </div>
        <div>
          <FormLabel>Group Size</FormLabel>
          <input type="number" min={1} className={inputCls} value={form.groupSize} onChange={(e) => set("groupSize", e.target.value)} />
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-3 gap-3">
        <div>
          <FormLabel>Source</FormLabel>
          <select className={inputCls} value={form.source} onChange={(e) => set("source", e.target.value)}>
            {SOURCES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <FormLabel>Stage</FormLabel>
          <select className={inputCls} value={form.stage} onChange={(e) => set("stage", e.target.value)}>
            {LEAD_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <FormLabel>Assigned To</FormLabel>
          <select className={inputCls} value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)}>
            <option value="">—</option>
            {PEOPLE.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2.5">
        <button onClick={handleDelete} className="mr-auto rounded-lg border border-[#2E3A32] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[#ff6666] hover:border-[#ff4444]">
          Delete
        </button>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B] disabled:opacity-50">
          Save
        </button>
      </div>

      <SectionTitle>Matches ({matches.length})</SectionTitle>
      {matches.length === 0 && <div className="py-2 text-center text-[11px] text-[#5C6C60]">No matching units right now</div>}
      {matches.map((u) => (
        <div key={u._id} className="mb-2 flex items-center gap-2.5 rounded-lg border border-[#2E3A32] bg-[#232D27] p-2.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-[#F2EFE4]">
              {u.building}{u.roomType ? ` · ${roomTypeLabel(u.roomType)}` : ""}
            </div>
            <div className="text-[10px] text-[#9AAB9F]">
              {u.pricePerPerson != null ? `RM${u.pricePerPerson}/person · ` : ""}via {agentName(u.agentId)}
            </div>
          </div>
          <button onClick={() => shareUnit(u)} className="flex-shrink-0 rounded-lg bg-[#B8954A] px-3 py-1 text-[11px] font-semibold text-[#1C2420] hover:bg-[#C9A06B]">
            Share
          </button>
        </div>
      ))}

      <SectionTitle>Linked Units ({linkedUnits.length})</SectionTitle>
      {linkedUnits.length === 0 && <div className="py-2 text-center text-[11px] text-[#5C6C60]">No units shared with this lead yet</div>}
      {linkedUnits.map((u) => (
        <div key={u._id} className="mb-2 flex items-center gap-2.5 rounded-lg border border-[#2E3A32] bg-[#232D27] p-2.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-[#F2EFE4]">
              {u.building}{u.roomType ? ` · ${roomTypeLabel(u.roomType)}` : ""}
            </div>
            <div className="text-[10px] text-[#9AAB9F]">
              {u.pricePerPerson != null ? `RM${u.pricePerPerson}/person · ` : ""}via {agentName(u.agentId)}
            </div>
          </div>
          <span className="flex-shrink-0 rounded bg-[#2C3830] px-1.5 py-0.5 text-[9px] font-semibold text-[#9AAB9F]">{unitStatusLabel(u.status)}</span>
        </div>
      ))}

      <SectionTitle>Notes</SectionTitle>
      <CrmNotes notes={lead.notes} onAdd={addNote} />
    </>
  );
}
