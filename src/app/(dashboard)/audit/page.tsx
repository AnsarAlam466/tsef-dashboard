"use client";

import useSWR from "swr";
import { useState } from "react";
import { format } from "date-fns";
import { fetcher } from "@/lib/fetcher";
import { AuditEntry } from "@/lib/constants";
import TopBar from "@/components/TopBar";

const ACTION_COLORS: Record<string, string> = {
  create: "#10B981",
  update: "#8FB6A8",
  stage_change: "#B8954A",
  delete: "#ef4444",
  login: "#9AAB9F",
  download: "#C9A06B",
};

export default function AuditPage() {
  const { data: logs = [] } = useSWR<AuditEntry[]>("/api/audit", fetcher);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");

  const actions = [...new Set(logs.map((l) => l.action))].sort();
  const entityTypes = [...new Set(logs.map((l) => l.entityType).filter(Boolean))].sort();
  const actors = [...new Set(logs.map((l) => l.actor).filter(Boolean))].sort();

  const filtered = logs.filter(
    (l) =>
      (!actionFilter || l.action === actionFilter) &&
      (!entityFilter || l.entityType === entityFilter) &&
      (!actorFilter || l.actor === actorFilter)
  );

  const filterCls = "rounded-lg border border-[#2E3A32] bg-[#232D27] px-2.5 py-1.5 text-xs text-[#9AAB9F] outline-none";

  return (
    <>
      <TopBar title="Audit Trail" subtitle="Every action, logged. Team-only visibility." />
      <div className="max-w-[860px] p-7">
        <div className="mb-5 flex gap-2.5">
          <select className={filterCls} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select className={filterCls} value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
            <option value="">All entities</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select className={filterCls} value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}>
            <option value="">All actors</option>
            {actors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-[#2E3A32] bg-[#1C2420] p-10 text-center text-[13px] text-[#6E7E72]">
            <div className="mb-2.5 text-3xl">🧾</div>No audit entries yet
          </div>
        )}

        {filtered.map((l) => {
          const color = ACTION_COLORS[l.action] || "#9AAB9F";
          return (
            <div key={l._id} className="mb-1.5 flex items-center gap-3 rounded-lg border border-[#2E3A32] bg-[#1C2420] px-4 py-2.5">
              <span className="w-[130px] flex-shrink-0 font-mono text-[11px] text-[#6E7E72]">{format(new Date(l.at), "d MMM yyyy, HH:mm")}</span>
              <span className="flex flex-shrink-0 items-center gap-1.5 text-[11px] font-medium text-[#9AAB9F]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2C3830] text-[9px] font-bold text-[#F2EFE4]">
                  {(l.actor || "?").charAt(0).toUpperCase()}
                </span>
                {l.actor || "—"}
              </span>
              <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${color}20`, color }}>
                {l.action}
              </span>
              <span className="flex-shrink-0 text-[11px] uppercase tracking-wide text-[#6E7E72]">{l.entityType}</span>
              <span className="min-w-0 truncate text-[12px] text-[#9AAB9F]">{l.summary}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
