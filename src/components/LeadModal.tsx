"use client";

import { useState } from "react";
import { mutate } from "swr";
import { apiPost } from "@/lib/fetcher";
import { Lead, ROOM_TYPES, BUILDINGS } from "@/lib/constants";
import Modal, { FormLabel, inputCls } from "@/components/Modal";
import { useToast } from "@/components/Toast";

const PEOPLE = ["Danny", "Marwa", "Ansar"];
const SOURCES: Lead["source"][] = ["whatsapp", "chat_widget", "booking_form", "referral", "direct"];

export default function LeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="New Lead">
      {open && <LeadForm onClose={onClose} />}
    </Modal>
  );
}

function LeadForm({ onClose }: { onClose: () => void }) {
  const showToast = useToast();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [nationality, setNationality] = useState("");
  const [university, setUniversity] = useState("");
  const [budget, setBudget] = useState("");
  const [roomType, setRoomType] = useState("");
  const [preferredBuildings, setPreferredBuildings] = useState<string[]>([]);
  const [moveInDate, setMoveInDate] = useState("");
  const [groupSize, setGroupSize] = useState("1");
  const [source, setSource] = useState<Lead["source"]>("whatsapp");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return showToast("Add a lead name.");
    setSaving(true);
    try {
      await apiPost("/api/leads", {
        name,
        contact: contact || undefined,
        nationality: nationality || undefined,
        university: university || undefined,
        budget: budget ? Number(budget) : undefined,
        roomType: roomType || undefined,
        preferredBuildings,
        moveInDate: moveInDate || undefined,
        groupSize: Number(groupSize) || 1,
        source,
        assignedTo: assignedTo || undefined,
      });
      await mutate("/api/leads");
      showToast("Lead added");
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Name</FormLabel>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aisha K." />
        </div>
        <div>
          <FormLabel>Contact (WhatsApp)</FormLabel>
          <input className={inputCls} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+60…" />
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Nationality</FormLabel>
          <input className={inputCls} value={nationality} onChange={(e) => setNationality(e.target.value)} />
        </div>
        <div>
          <FormLabel>University</FormLabel>
          <input className={inputCls} value={university} onChange={(e) => setUniversity(e.target.value)} />
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-3 gap-3">
        <div>
          <FormLabel>Budget (RM)</FormLabel>
          <input type="number" className={inputCls} value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
        <div>
          <FormLabel>Room Type</FormLabel>
          <select className={inputCls} value={roomType} onChange={(e) => setRoomType(e.target.value)}>
            <option value="">—</option>
            {ROOM_TYPES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <FormLabel>Group Size</FormLabel>
          <input type="number" min={1} className={inputCls} value={groupSize} onChange={(e) => setGroupSize(e.target.value)} />
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
                checked={preferredBuildings.includes(b)}
                onChange={() => setPreferredBuildings((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]))}
              />
              {b}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-3 gap-3">
        <div>
          <FormLabel>Move-in Date</FormLabel>
          <input type="date" className={inputCls} value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
        </div>
        <div>
          <FormLabel>Source</FormLabel>
          <select className={inputCls} value={source} onChange={(e) => setSource(e.target.value as Lead["source"])}>
            {SOURCES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <FormLabel>Assigned To</FormLabel>
          <select className={inputCls} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">—</option>
            {PEOPLE.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2.5">
        <button onClick={onClose} className="rounded-lg border border-[#2E3A32] bg-[#232D27] px-3.5 py-1.5 text-xs font-semibold text-[#9AAB9F] hover:text-[#F2EFE4]">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B] disabled:opacity-50">
          Add Lead
        </button>
      </div>
    </>
  );
}
