"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import clsx from "clsx";
import { Lead, HousingAgent, ROOM_TYPES, PEOPLE_COLORS } from "@/lib/constants";

export function roomTypeLabel(key?: string) {
  return ROOM_TYPES.find((r) => r.key === key)?.label;
}

const cardCls = (dragging: boolean) =>
  clsx(
    "mb-2.5 cursor-grab rounded-lg border border-[#2E3A32] bg-[#202A24] p-3 shadow-sm transition-shadow hover:border-[#3D4F42] active:cursor-grabbing",
    dragging && "z-50 opacity-60 shadow-lg"
  );

export function LeadCrmCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead._id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={onClick} className={cardCls(isDragging)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="truncate text-[13px] font-medium text-[#F2EFE4]">{lead.name}</div>
        {lead.nationality && <span className="flex-shrink-0 text-[10px] text-[#6E7E72]">{lead.nationality}</span>}
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px] text-[#9AAB9F]">
        {lead.budget != null && <span className="font-mono font-semibold text-[#B8954A]">RM{lead.budget}</span>}
        {lead.roomType && <span className="rounded bg-[#2C3830] px-1.5 py-0.5">{roomTypeLabel(lead.roomType)}</span>}
        {lead.groupSize > 1 && <span className="rounded bg-[#2C3830] px-1.5 py-0.5">×{lead.groupSize}</span>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-[10px] text-[#6E7E72]">{lead.preferredBuildings.length ? lead.preferredBuildings.join(", ") : "Any building"}</div>
        {lead.assignedTo && (
          <span
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-black"
            style={{ background: PEOPLE_COLORS[lead.assignedTo] || "#6E7E72" }}
            title={lead.assignedTo}
          >
            {lead.assignedTo[0]}
          </span>
        )}
      </div>
    </div>
  );
}

export function AgentCrmCard({ agent, onClick }: { agent: HousingAgent; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: agent._id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={onClick} className={cardCls(isDragging)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="truncate text-[13px] font-medium text-[#F2EFE4]">
          {agent.name}
          {agent.alias && <span className="ml-1.5 text-[10px] text-[#6E7E72]">({agent.alias})</span>}
        </div>
        {agent.feeAgreed && <span className="flex-shrink-0 rounded bg-[#B8954A20] px-1.5 py-0.5 text-[9px] font-bold text-[#B8954A]">10% agreed</span>}
      </div>
      {agent.whatsapp && <div className="mb-2 font-mono text-[10px] text-[#9AAB9F]">{agent.whatsapp}</div>}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {agent.buildingsCovered.map((b) => (
            <span key={b} className="rounded bg-[#2C3830] px-1.5 py-0.5 text-[9px] text-[#9AAB9F]">{b}</span>
          ))}
        </div>
        {agent.lastContactedAt && (
          <span className="flex-shrink-0 font-mono text-[10px] text-[#6E7E72]">{format(new Date(agent.lastContactedAt), "MMM d")}</span>
        )}
      </div>
    </div>
  );
}
