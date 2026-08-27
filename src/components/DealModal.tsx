"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher, apiPost } from "@/lib/fetcher";
import { Lead, HousingAgent, UnitListing, Deal, DEAL_STATUSES } from "@/lib/constants";
import Modal, { FormLabel, inputCls } from "@/components/Modal";
import { roomTypeLabel } from "@/components/CrmCard";
import { useToast } from "@/components/Toast";

export default function DealModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="New Deal">
      {open && <DealForm onClose={onClose} />}
    </Modal>
  );
}

function DealForm({ onClose }: { onClose: () => void }) {
  const showToast = useToast();
  const { data: leads = [] } = useSWR<Lead[]>("/api/leads", fetcher);
  const { data: agents = [] } = useSWR<HousingAgent[]>("/api/agents", fetcher);
  const { data: units = [] } = useSWR<UnitListing[]>("/api/units", fetcher);

  const [leadId, setLeadId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [value, setValue] = useState("");
  const [feePercent, setFeePercent] = useState("10");
  const [status, setStatus] = useState<Deal["status"]>("negotiating");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredUnits = agentId ? units.filter((u) => u.agentId === agentId) : units;
  const feePreview = ((Number(value) || 0) * (Number(feePercent) || 0)) / 100;

  async function handleSave() {
    if (!leadId) return showToast("Select a lead.");
    setSaving(true);
    try {
      await apiPost("/api/deals", {
        leadId,
        agentId: agentId || undefined,
        unitId: unitId || undefined,
        value: value ? Number(value) : undefined,
        feePercent: Number(feePercent) || 10,
        status,
        notes: notes || undefined,
      });
      await mutate("/api/deals");
      showToast("Deal created");
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-3.5">
        <FormLabel>Lead</FormLabel>
        <select className={inputCls} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
          <option value="">Select lead…</option>
          {leads.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
        </select>
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Agent (optional)</FormLabel>
          <select className={inputCls} value={agentId} onChange={(e) => { setAgentId(e.target.value); setUnitId(""); }}>
            <option value="">—</option>
            {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <FormLabel>Unit (optional)</FormLabel>
          <select className={inputCls} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            <option value="">—</option>
            {filteredUnits.map((u) => (
              <option key={u._id} value={u._id}>
                {u.building}{u.roomType ? ` · ${roomTypeLabel(u.roomType)}` : ""}{u.pricePerPerson != null ? ` · RM${u.pricePerPerson}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-3 gap-3">
        <div>
          <FormLabel>Value (RM/month)</FormLabel>
          <input type="number" className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div>
          <FormLabel>Fee %</FormLabel>
          <input type="number" className={inputCls} value={feePercent} onChange={(e) => setFeePercent(e.target.value)} />
        </div>
        <div>
          <FormLabel>Status</FormLabel>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as Deal["status"])}>
            {DEAL_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-3.5">
        <FormLabel>Notes</FormLabel>
        <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional context…" />
      </div>
      <div className="mb-3.5 rounded-lg border border-[#2E3A32] bg-[#232D27] px-3.5 py-2.5 text-[12px] text-[#9AAB9F]">
        Fee preview: <span className="font-mono font-bold text-[#B8954A]">RM{feePreview.toFixed(2)}</span>
      </div>
      <div className="mt-5 flex justify-end gap-2.5">
        <button onClick={onClose} className="rounded-lg border border-[#2E3A32] bg-[#232D27] px-3.5 py-1.5 text-xs font-semibold text-[#9AAB9F] hover:text-[#F2EFE4]">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B] disabled:opacity-50">
          Add Deal
        </button>
      </div>
    </>
  );
}
