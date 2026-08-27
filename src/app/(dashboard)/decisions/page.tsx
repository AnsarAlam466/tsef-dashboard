"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { fetcher, apiPatch } from "@/lib/fetcher";
import { Decision, Meeting, DEPTS, DECISION_STATUSES, PEOPLE_COLORS, today } from "@/lib/constants";
import TopBar from "@/components/TopBar";
import DecisionModal from "@/components/DecisionModal";
import { useToast } from "@/components/Toast";

const STATUS_COLORS: Record<string, string> = { open: "#9AAB9F", executed: "#10B981", missed: "#ef4444" };

export default function DecisionsPage() {
  const { data: decisions = [] } = useSWR<Decision[]>("/api/decisions", fetcher);
  const { data: meetings = [] } = useSWR<Meeting[]>("/api/meetings", fetcher);
  const [modalOpen, setModalOpen] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const showToast = useToast();

  const meetingTitle = (id?: string | null) => meetings.find((m) => m._id === id)?.title;

  async function changeStatus(id: string, status: string) {
    try {
      await apiPatch(`/api/decisions/${id}`, { status });
      await mutate("/api/decisions");
      showToast("Status updated");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  const filtered = decisions.filter(
    (d) =>
      (!ownerFilter || d.owner === ownerFilter) &&
      (!statusFilter || d.status === statusFilter) &&
      (!deptFilter || d.department === deptFilter)
  );

  const filterCls = "rounded-lg border border-[#2E3A32] bg-[#232D27] px-2.5 py-1.5 text-xs text-[#9AAB9F] outline-none";

  return (
    <>
      <TopBar
        title="Decisions"
        subtitle="Every decision has an owner and a deadline — immutable once made"
        actions={<button onClick={() => setModalOpen(true)} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B]">+ New Decision</button>}
      />
      <div className="max-w-[860px] p-7">
        <div className="mb-5 flex gap-2.5">
          <select className={filterCls} value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
            <option value="">All owners</option>
            {["Danny", "Marwa", "Ansar"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select className={filterCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {DECISION_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <select className={filterCls} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All departments</option>
            {Object.entries(DEPTS).map(([key, d]) => (
              <option key={key} value={key}>{d.name}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-[#2E3A32] bg-[#1C2420] p-10 text-center text-[13px] text-[#6E7E72]">
            <div className="mb-2.5 text-3xl">⚖️</div>No decisions on record — log one from a meeting or add it here
          </div>
        )}

        {Object.entries(DEPTS).map(([deptKey, dept]) => {
          const rows = filtered.filter((d) => d.department === deptKey);
          if (rows.length === 0) return null;
          return (
            <div key={deptKey} className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: dept.color }}>
                <span>{dept.icon}</span>{dept.name}
              </div>
              {rows.map((d) => {
                const overdue = d.status === "open" && d.deadline < today();
                return (
                  <div key={d._id} className="mb-2 rounded-xl border border-[#2E3A32] bg-[#1C2420] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[13px] leading-relaxed text-[#F2EFE4]">{d.text}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${PEOPLE_COLORS[d.owner] || "#9AAB9F"}20`, color: PEOPLE_COLORS[d.owner] || "#9AAB9F" }}>
                            {d.owner}
                          </span>
                          <span className={`font-mono text-[11px] ${overdue ? "font-bold text-[#ef4444]" : "text-[#6E7E72]"}`}>
                            {d.deadline}{overdue && " · OVERDUE"}
                          </span>
                          {meetingTitle(d.meetingId) && (
                            <span className="rounded-full bg-[#232D27] px-2 py-0.5 text-[10px] text-[#9AAB9F]">📅 {meetingTitle(d.meetingId)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${STATUS_COLORS[d.status]}20`, color: STATUS_COLORS[d.status] }}>
                          {DECISION_STATUSES.find((s) => s.key === d.status)?.label}
                        </span>
                        <select
                          className="rounded-lg border border-[#2E3A32] bg-[#232D27] px-2 py-1 text-[11px] text-[#9AAB9F] outline-none"
                          value={d.status}
                          onChange={(e) => changeStatus(d._id, e.target.value)}
                        >
                          {DECISION_STATUSES.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <DecisionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
