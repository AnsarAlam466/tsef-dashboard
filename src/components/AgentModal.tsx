"use client";

import { useState } from "react";
import { mutate } from "swr";
import { apiPost } from "@/lib/fetcher";
import { HousingAgent, AGENT_STAGES, BUILDINGS } from "@/lib/constants";
import Modal, { FormLabel, inputCls } from "@/components/Modal";
import { useToast } from "@/components/Toast";

export default function AgentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="New Agent">
      {open && <AgentForm onClose={onClose} />}
    </Modal>
  );
}

function AgentForm({ onClose }: { onClose: () => void }) {
  const showToast = useToast();
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [buildingsCovered, setBuildingsCovered] = useState<string[]>([]);
  const [stage, setStage] = useState<HousingAgent["stage"]>("to_contact");
  const [feeAgreed, setFeeAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return showToast("Add an agent name.");
    setSaving(true);
    try {
      await apiPost("/api/agents", {
        name,
        alias: alias || undefined,
        whatsapp: whatsapp || undefined,
        buildingsCovered,
        stage,
        feeAgreed,
      });
      await mutate("/api/agents");
      showToast("Agent added");
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
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mr Tan" />
        </div>
        <div>
          <FormLabel>Alias</FormLabel>
          <input className={inputCls} value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="e.g. DK Tan" />
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>WhatsApp</FormLabel>
          <input className={inputCls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+60…" />
        </div>
        <div>
          <FormLabel>Stage</FormLabel>
          <select className={inputCls} value={stage} onChange={(e) => setStage(e.target.value as HousingAgent["stage"])}>
            {AGENT_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-3.5">
        <FormLabel>Buildings Covered</FormLabel>
        <div className="flex flex-wrap gap-2">
          {BUILDINGS.map((b) => (
            <label key={b} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#2E3A32] bg-[#232D27] px-2.5 py-1.5 text-[12px] hover:bg-[#2C3830]">
              <input
                type="checkbox"
                className="accent-[#B8954A]"
                checked={buildingsCovered.includes(b)}
                onChange={() => setBuildingsCovered((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]))}
              />
              {b}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-3.5">
        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#9AAB9F]">
          <input type="checkbox" className="accent-[#B8954A]" checked={feeAgreed} onChange={(e) => setFeeAgreed(e.target.checked)} />
          10% fee agreed
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2.5">
        <button onClick={onClose} className="rounded-lg border border-[#2E3A32] bg-[#232D27] px-3.5 py-1.5 text-xs font-semibold text-[#9AAB9F] hover:text-[#F2EFE4]">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B] disabled:opacity-50">
          Add Agent
        </button>
      </div>
    </>
  );
}
