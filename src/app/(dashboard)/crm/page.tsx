"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { DndContext, DragOverlay, useDroppable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import clsx from "clsx";
import { fetcher, apiPatch } from "@/lib/fetcher";
import { Lead, HousingAgent, LEAD_STAGES, AGENT_STAGES } from "@/lib/constants";
import TopBar from "@/components/TopBar";
import { LeadCrmCard, AgentCrmCard } from "@/components/CrmCard";
import LeadDrawer from "@/components/LeadDrawer";
import AgentDrawer from "@/components/AgentDrawer";
import LeadModal from "@/components/LeadModal";
import AgentModal from "@/components/AgentModal";
import { useToast } from "@/components/Toast";

const LEAD_ACCENTS: Record<string, string> = {
  new: "#8FB6A8", contacted: "#C9A06B", matching: "#B8954A", viewing: "#A395C9", closing: "#f59e0b", won: "#10B981", lost: "#ef4444",
};
const AGENT_ACCENTS: Record<string, string> = {
  to_contact: "#6E7E72", contacted: "#C9A06B", responsive: "#8FB6A8", active: "#10B981", inactive: "#ef4444",
};

function Column({ id, label, accent, count, children }: { id: string; label: string; accent: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="flex min-w-[240px] flex-1 flex-col rounded-xl border border-[#2E3A32] bg-[#1C2420]">
      <div className="flex items-center justify-between border-b border-[#2E3A32] px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
          <span className="text-[12px] font-bold uppercase tracking-wide text-[#F2EFE4]">{label}</span>
        </div>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2C3830] text-[10px] font-bold text-[#9AAB9F]">{count}</span>
      </div>
      <div ref={setNodeRef} className={`min-h-[120px] flex-1 p-2.5 transition-colors ${isOver ? "bg-[#B8954A0d]" : ""}`}>
        {children}
        {count === 0 && <div className="p-4 text-center text-[11px] text-[#5C6C60]">Drop here</div>}
      </div>
    </div>
  );
}

export default function CrmPage() {
  const { data: leads = [] } = useSWR<Lead[]>("/api/leads", fetcher);
  const { data: agents = [] } = useSWR<HousingAgent[]>("/api/agents", fetcher);
  const showToast = useToast();

  const [tab, setTab] = useState<"students" | "agents">("students");
  const [leadModal, setLeadModal] = useState(false);
  const [agentModal, setAgentModal] = useState(false);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [openAgentId, setOpenAgentId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const openLead = leads.find((l) => l._id === openLeadId) || null;
  const openAgent = agents.find((a) => a._id === openAgentId) || null;
  const activeLead = leads.find((l) => l._id === activeId);
  const activeAgent = agents.find((a) => a._id === activeId);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function handleLeadDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const lead = leads.find((l) => l._id === active.id);
    const newStage = over.id as Lead["stage"];
    if (!lead || lead.stage === newStage) return;

    await mutate("/api/leads", leads.map((l) => (l._id === lead._id ? { ...l, stage: newStage } : l)), false);
    try {
      await apiPatch(`/api/leads/${lead._id}`, { stage: newStage });
      showToast(`Moved to ${LEAD_STAGES.find((s) => s.key === newStage)?.label || newStage}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update lead");
    } finally {
      await mutate("/api/leads");
    }
  }

  async function handleAgentDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const agent = agents.find((a) => a._id === active.id);
    const newStage = over.id as HousingAgent["stage"];
    if (!agent || agent.stage === newStage) return;

    await mutate("/api/agents", agents.map((a) => (a._id === agent._id ? { ...a, stage: newStage } : a)), false);
    try {
      await apiPatch(`/api/agents/${agent._id}`, { stage: newStage });
      showToast(`Moved to ${AGENT_STAGES.find((s) => s.key === newStage)?.label || newStage}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update agent");
    } finally {
      await mutate("/api/agents");
    }
  }

  return (
    <>
      <TopBar
        title="CRM"
        subtitle="Student leads and housing agent pipeline"
        actions={
          tab === "students" ? (
            <button onClick={() => setLeadModal(true)} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B]">+ New Lead</button>
          ) : (
            <button onClick={() => setAgentModal(true)} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B]">+ New Agent</button>
          )
        }
      />
      <div className="p-7">
        <div className="mb-5 inline-flex rounded-lg border border-[#2E3A32] bg-[#1C2420] p-1">
          {(["students", "agents"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "rounded-md px-4 py-1.5 text-xs font-semibold capitalize transition-colors",
                tab === t ? "bg-[#B8954A] text-[#1C2420]" : "text-[#9AAB9F] hover:text-[#F2EFE4]"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "students" ? (
          <DndContext onDragStart={handleDragStart} onDragEnd={handleLeadDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {LEAD_STAGES.map((s) => {
                const colLeads = leads.filter((l) => l.stage === s.key);
                return (
                  <Column key={s.key} id={s.key} label={s.label} accent={LEAD_ACCENTS[s.key]} count={colLeads.length}>
                    {colLeads.map((l) => (
                      <LeadCrmCard key={l._id} lead={l} onClick={() => setOpenLeadId(l._id)} />
                    ))}
                  </Column>
                );
              })}
            </div>
            <DragOverlay>{activeLead ? <LeadCrmCard lead={activeLead} onClick={() => {}} /> : null}</DragOverlay>
          </DndContext>
        ) : (
          <DndContext onDragStart={handleDragStart} onDragEnd={handleAgentDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {AGENT_STAGES.map((s) => {
                const colAgents = agents.filter((a) => a.stage === s.key);
                return (
                  <Column key={s.key} id={s.key} label={s.label} accent={AGENT_ACCENTS[s.key]} count={colAgents.length}>
                    {colAgents.map((a) => (
                      <AgentCrmCard key={a._id} agent={a} onClick={() => setOpenAgentId(a._id)} />
                    ))}
                  </Column>
                );
              })}
            </div>
            <DragOverlay>{activeAgent ? <AgentCrmCard agent={activeAgent} onClick={() => {}} /> : null}</DragOverlay>
          </DndContext>
        )}
      </div>

      <LeadModal open={leadModal} onClose={() => setLeadModal(false)} />
      <AgentModal open={agentModal} onClose={() => setAgentModal(false)} />
      <LeadDrawer lead={openLead} onClose={() => setOpenLeadId(null)} />
      <AgentDrawer agent={openAgent} onClose={() => setOpenAgentId(null)} />
    </>
  );
}
