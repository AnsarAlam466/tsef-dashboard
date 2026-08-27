"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher, apiPatch, apiPost, apiDelete } from "@/lib/fetcher";
import { HousingAgent, UnitListing, AGENT_STAGES, ROOM_TYPES, BUILDINGS, UNIT_STATUSES } from "@/lib/constants";
import Drawer, { SectionTitle } from "@/components/Drawer";
import { FormLabel, inputCls } from "@/components/Modal";
import CrmNotes from "@/components/CrmNotes";
import { roomTypeLabel } from "@/components/CrmCard";
import { useToast } from "@/components/Toast";

export default function AgentDrawer({ agent, onClose }: { agent: HousingAgent | null; onClose: () => void }) {
  return (
    <Drawer open={!!agent} onClose={onClose} title={agent?.name || ""}>
      {agent && <AgentDetail key={agent._id} agent={agent} onClose={onClose} />}
    </Drawer>
  );
}

function AgentDetail({ agent, onClose }: { agent: HousingAgent; onClose: () => void }) {
  const showToast = useToast();
  const unitsKey = `/api/units?agentId=${agent._id}`;
  const { data: units = [] } = useSWR<UnitListing[]>(unitsKey, fetcher);

  const [form, setForm] = useState({
    name: agent.name,
    alias: agent.alias || "",
    whatsapp: agent.whatsapp || "",
    buildingsCovered: agent.buildingsCovered,
    stage: agent.stage,
    feeAgreed: agent.feeAgreed,
    lastContactedAt: agent.lastContactedAt ? agent.lastContactedAt.slice(0, 10) : "",
  });
  const [saving, setSaving] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.name.trim()) return showToast("Name is required.");
    setSaving(true);
    try {
      await apiPatch(`/api/agents/${agent._id}`, {
        name: form.name,
        alias: form.alias,
        whatsapp: form.whatsapp,
        buildingsCovered: form.buildingsCovered,
        stage: form.stage,
        feeAgreed: form.feeAgreed,
        lastContactedAt: form.lastContactedAt || undefined,
      });
      await mutate("/api/agents");
      showToast("Agent updated");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete agent "${agent.name}"?`)) return;
    try {
      await apiDelete(`/api/agents/${agent._id}`);
      await mutate("/api/agents");
      showToast("Agent deleted");
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function addNote(text: string) {
    try {
      await apiPatch(`/api/agents/${agent._id}`, { addNote: text });
      await mutate("/api/agents");
      showToast("Note added");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function setUnitStatus(u: UnitListing, status: UnitListing["status"]) {
    await mutate(unitsKey, units.map((x) => (x._id === u._id ? { ...x, status } : x)), false);
    try {
      await apiPatch(`/api/units/${u._id}`, { status });
      showToast("Unit status updated");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      await mutate(unitsKey);
      await mutate("/api/units");
    }
  }

  const waDigits = (agent.whatsapp || "").replace(/\D/g, "");

  return (
    <>
      <div className="mb-4 flex gap-2">
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
        <button onClick={() => setShowUnitForm((v) => !v)} className="flex-1 rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B]">
          {showUnitForm ? "Close unit form" : "Log Unit"}
        </button>
      </div>

      {showUnitForm && <UnitForm agentId={agent._id} unitsKey={unitsKey} onDone={() => setShowUnitForm(false)} />}

      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Name</FormLabel>
          <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <FormLabel>Alias</FormLabel>
          <input className={inputCls} value={form.alias} onChange={(e) => set("alias", e.target.value)} />
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>WhatsApp</FormLabel>
          <input className={inputCls} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+60…" />
        </div>
        <div>
          <FormLabel>Last Contacted</FormLabel>
          <input type="date" className={inputCls} value={form.lastContactedAt} onChange={(e) => set("lastContactedAt", e.target.value)} />
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
                checked={form.buildingsCovered.includes(b)}
                onChange={() =>
                  set("buildingsCovered", form.buildingsCovered.includes(b) ? form.buildingsCovered.filter((x) => x !== b) : [...form.buildingsCovered, b])
                }
              />
              {b}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Stage</FormLabel>
          <select className={inputCls} value={form.stage} onChange={(e) => set("stage", e.target.value)}>
            {AGENT_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <FormLabel>Fee</FormLabel>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#2E3A32] bg-[#232D27] px-3 py-2.5 text-[13px]">
            <input type="checkbox" className="accent-[#B8954A]" checked={form.feeAgreed} onChange={(e) => set("feeAgreed", e.target.checked)} />
            10% fee agreed
          </label>
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

      <SectionTitle>Units ({units.length})</SectionTitle>
      {units.length === 0 && <div className="py-2 text-center text-[11px] text-[#5C6C60]">No units logged for this agent</div>}
      {units.map((u) => (
        <div key={u._id} className="mb-2 rounded-lg border border-[#2E3A32] bg-[#232D27] p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-[#F2EFE4]">
                {u.building}{u.roomType ? ` · ${roomTypeLabel(u.roomType)}` : ""}
              </div>
              <div className="text-[10px] text-[#9AAB9F]">
                {u.pricePerPerson != null && `RM${u.pricePerPerson}/person · `}cap {u.capacity}
                {u.availableFrom && ` · from ${u.availableFrom.slice(0, 10)}`}
                {u.photosReceived && " · 📷"}
              </div>
            </div>
            <select
              value={u.status}
              onChange={(e) => setUnitStatus(u, e.target.value as UnitListing["status"])}
              className="flex-shrink-0 rounded-lg border border-[#2E3A32] bg-[#1C2420] px-2 py-1 text-[11px] outline-none"
            >
              {UNIT_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          {u.description && <div className="mt-1.5 text-[11px] leading-relaxed text-[#9AAB9F]">{u.description}</div>}
        </div>
      ))}

      <SectionTitle>Notes</SectionTitle>
      <CrmNotes notes={agent.notes} onAdd={addNote} />
    </>
  );
}

function UnitForm({ agentId, unitsKey, onDone }: { agentId: string; unitsKey: string; onDone: () => void }) {
  const showToast = useToast();
  const [building, setBuilding] = useState<string>(BUILDINGS[0]);
  const [customBuilding, setCustomBuilding] = useState("");
  const [roomType, setRoomType] = useState("");
  const [pricePerPerson, setPricePerPerson] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [availableFrom, setAvailableFrom] = useState("");
  const [photosReceived, setPhotosReceived] = useState(false);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const b = building === "__other" ? customBuilding.trim() : building;
    if (!b) return showToast("Building is required.");
    setSaving(true);
    try {
      await apiPost("/api/units", {
        agentId,
        building: b,
        roomType: roomType || undefined,
        pricePerPerson: pricePerPerson ? Number(pricePerPerson) : undefined,
        capacity: Number(capacity) || 1,
        availableFrom: availableFrom || undefined,
        photosReceived,
        description: description || undefined,
      });
      await mutate(unitsKey);
      await mutate("/api/units");
      showToast("Unit logged");
      onDone();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-5 rounded-xl border border-[#2E3A32] bg-[#232D27] p-4">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#B8954A]">New Unit</div>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Building</FormLabel>
          <select className={inputCls} value={building} onChange={(e) => setBuilding(e.target.value)}>
            {BUILDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
            <option value="__other">Other…</option>
          </select>
        </div>
        <div>
          <FormLabel>Room Type</FormLabel>
          <select className={inputCls} value={roomType} onChange={(e) => setRoomType(e.target.value)}>
            <option value="">—</option>
            {ROOM_TYPES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
      </div>
      {building === "__other" && (
        <div className="mb-3">
          <FormLabel>Building Name</FormLabel>
          <input className={inputCls} value={customBuilding} onChange={(e) => setCustomBuilding(e.target.value)} placeholder="e.g. The Grand" />
        </div>
      )}
      <div className="mb-3 grid grid-cols-3 gap-3">
        <div>
          <FormLabel>RM/person</FormLabel>
          <input type="number" className={inputCls} value={pricePerPerson} onChange={(e) => setPricePerPerson(e.target.value)} />
        </div>
        <div>
          <FormLabel>Capacity</FormLabel>
          <input type="number" min={1} className={inputCls} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>
        <div>
          <FormLabel>Available From</FormLabel>
          <input type="date" className={inputCls} value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
        </div>
      </div>
      <div className="mb-3">
        <FormLabel>Description</FormLabel>
        <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Fully furnished, high floor…" />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#9AAB9F]">
          <input type="checkbox" className="accent-[#B8954A]" checked={photosReceived} onChange={(e) => setPhotosReceived(e.target.checked)} />
          Photos received
        </label>
        <button onClick={handleSubmit} disabled={saving} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B] disabled:opacity-50">
          Log Unit
        </button>
      </div>
    </div>
  );
}
