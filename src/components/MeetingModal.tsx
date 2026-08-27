"use client";

import { useState } from "react";
import { mutate } from "swr";
import { apiPost } from "@/lib/fetcher";
import { today } from "@/lib/constants";
import Modal, { FormLabel, inputCls } from "@/components/Modal";
import { useToast } from "@/components/Toast";

export default function MeetingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const showToast = useToast();
  const [date, setDate] = useState(today());
  const [attendees, setAttendees] = useState("Danny,Marwa,Ansar");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return showToast("Add a meeting title.");
    setSaving(true);
    try {
      await apiPost("/api/meetings", { title, date, attendees: attendees.split(","), summary, decisions: [], openQuestions: [] });
      await mutate("/api/meetings");
      showToast("Meeting saved");
      setTitle("");
      setSummary("");
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log Meeting">
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Date</FormLabel>
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <FormLabel>Attendees</FormLabel>
          <select className={inputCls} value={attendees} onChange={(e) => setAttendees(e.target.value)}>
            <option value="Danny,Marwa,Ansar">All 3</option>
            <option value="Danny,Ansar">Danny + Ansar</option>
            <option value="Marwa,Ansar">Marwa + Ansar</option>
          </select>
        </div>
      </div>
      <div className="mb-3.5">
        <FormLabel>Meeting Title</FormLabel>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. TSEF Planning Session" />
      </div>
      <div className="mb-3.5">
        <FormLabel>Summary</FormLabel>
        <textarea className={`${inputCls} min-h-[90px] resize-y`} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What was this meeting about?" />
      </div>
      <div className="mt-5 flex justify-end gap-2.5">
        <button onClick={onClose} className="rounded-lg border border-[#2E3A32] bg-[#232D27] px-3.5 py-1.5 text-xs font-semibold text-[#9AAB9F] hover:text-[#F2EFE4]">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B] disabled:opacity-50">
          Save Meeting
        </button>
      </div>
    </Modal>
  );
}
