"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher, apiPost } from "@/lib/fetcher";
import { DEPTS, Meeting, today } from "@/lib/constants";
import Modal, { FormLabel, inputCls } from "@/components/Modal";
import { useToast } from "@/components/Toast";

export default function DecisionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const showToast = useToast();
  const { data: meetings = [] } = useSWR<Meeting[]>(open ? "/api/meetings" : null, fetcher);
  const [text, setText] = useState("");
  const [owner, setOwner] = useState("Danny");
  const [deadline, setDeadline] = useState(today());
  const [department, setDepartment] = useState("ops");
  const [meetingId, setMeetingId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!text.trim()) return showToast("Describe the decision.");
    if (!deadline) return showToast("Set a deadline.");
    setSaving(true);
    try {
      await apiPost("/api/decisions", { text, owner, deadline, department, meetingId: meetingId || null });
      await mutate("/api/decisions");
      showToast("Decision saved");
      setText("");
      setMeetingId("");
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Decision">
      <div className="mb-3.5">
        <FormLabel>Decision</FormLabel>
        <textarea className={`${inputCls} min-h-[80px] resize-y`} value={text} onChange={(e) => setText(e.target.value)} placeholder="What was decided?" />
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Owner</FormLabel>
          <select className={inputCls} value={owner} onChange={(e) => setOwner(e.target.value)}>
            {["Danny", "Marwa", "Ansar"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <FormLabel>Deadline</FormLabel>
          <input type="date" className={inputCls} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Department</FormLabel>
          <select className={inputCls} value={department} onChange={(e) => setDepartment(e.target.value)}>
            {Object.entries(DEPTS).map(([key, d]) => (
              <option key={key} value={key}>{d.icon} {d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <FormLabel>Linked Meeting (optional)</FormLabel>
          <select className={inputCls} value={meetingId} onChange={(e) => setMeetingId(e.target.value)}>
            <option value="">None</option>
            {meetings.map((m) => (
              <option key={m._id} value={m._id}>{m.title}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-2.5">
        <div className="text-[11px] text-[#6E7E72]">🔒 Once saved, a decision&apos;s text, owner, and deadline cannot be changed.</div>
        <div className="flex flex-shrink-0 gap-2.5">
          <button onClick={onClose} className="rounded-lg border border-[#2E3A32] bg-[#232D27] px-3.5 py-1.5 text-xs font-semibold text-[#9AAB9F] hover:text-[#F2EFE4]">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B] disabled:opacity-50">
            Save Decision
          </button>
        </div>
      </div>
    </Modal>
  );
}
