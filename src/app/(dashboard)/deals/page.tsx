"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { format } from "date-fns";
import { fetcher, apiPatch, apiDelete } from "@/lib/fetcher";
import { Deal, Lead, HousingAgent, UnitListing, DEAL_STATUSES } from "@/lib/constants";
import TopBar from "@/components/TopBar";
import DealModal from "@/components/DealModal";
import { roomTypeLabel } from "@/components/CrmCard";
import { useToast } from "@/components/Toast";

const STATUS_COLORS: Record<string, string> = {
  negotiating: "#C9A06B", confirmed: "#10B981", paid: "#B8954A", cancelled: "#ef4444",
};

function Tile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-[#2E3A32] bg-[#1C2420] p-5">
      <div className="text-[11px] uppercase tracking-wide text-[#6E7E72]">{label}</div>
      <div className="mt-1 text-2xl font-extrabold" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}

export default function DealsPage() {
  const { data: deals = [] } = useSWR<Deal[]>("/api/deals", fetcher);
  const { data: leads = [] } = useSWR<Lead[]>("/api/leads", fetcher);
  const { data: agents = [] } = useSWR<HousingAgent[]>("/api/agents", fetcher);
  const { data: units = [] } = useSWR<UnitListing[]>("/api/units", fetcher);
  const showToast = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  const leadName = (id: string) => leads.find((l) => l._id === id)?.name || "—";
  const agentName = (id?: string | null) => (id ? agents.find((a) => a._id === id)?.name || "—" : "—");
  const unitLabel = (id?: string | null) => {
    const u = id ? units.find((x) => x._id === id) : null;
    return u ? `${u.building}${u.roomType ? ` · ${roomTypeLabel(u.roomType)}` : ""}` : "—";
  };

  const closedDeals = deals.filter((d) => d.status === "confirmed" || d.status === "paid");
  const totalFees = closedDeals.reduce((s, d) => s + (d.feeAmount ?? 0), 0);
  const pipelineValue = deals.filter((d) => d.status === "negotiating").reduce((s, d) => s + (d.value ?? 0), 0);

  async function setStatus(deal: Deal, status: Deal["status"]) {
    await mutate("/api/deals", deals.map((d) => (d._id === deal._id ? { ...d, status } : d)), false);
    try {
      await apiPatch(`/api/deals/${deal._id}`, { status });
      showToast(`Deal ${DEAL_STATUSES.find((s) => s.key === status)?.label.toLowerCase() || status}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to update deal");
    } finally {
      await mutate("/api/deals");
    }
  }

  async function handleDelete(deal: Deal) {
    if (!confirm(`Delete deal for ${leadName(deal.leadId)}?`)) return;
    try {
      await apiDelete(`/api/deals/${deal._id}`);
      await mutate("/api/deals");
      showToast("Deal deleted");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <>
      <TopBar
        title="Deals"
        subtitle="Track closings and fees earned"
        actions={<button onClick={() => setModalOpen(true)} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B]">+ New Deal</button>}
      />
      <div className="p-7">
        <div className="mb-7 grid grid-cols-4 gap-4">
          <Tile label="Total Deals" value={String(deals.length)} />
          <Tile label="Confirmed + Paid" value={String(closedDeals.length)} accent="#10B981" />
          <Tile label="Total Fees Earned" value={`RM${totalFees.toLocaleString()}`} accent="#B8954A" />
          <Tile label="Pipeline Value" value={`RM${pipelineValue.toLocaleString()}`} accent="#C9A06B" />
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#2E3A32] bg-[#1C2420]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#2E3A32] text-[11px] uppercase tracking-wide text-[#6E7E72]">
                <th className="px-4 py-3 font-semibold">Lead</th>
                <th className="px-4 py-3 font-semibold">Agent</th>
                <th className="px-4 py-3 font-semibold">Unit</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold">Fee</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Closed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d._id} className="border-b border-[#2E3A32] last:border-0 hover:bg-[#232D27]">
                  <td className="px-4 py-3 font-medium text-[#F2EFE4]">{leadName(d.leadId)}</td>
                  <td className="px-4 py-3 text-[#9AAB9F]">{agentName(d.agentId)}</td>
                  <td className="px-4 py-3 text-[#9AAB9F]">{unitLabel(d.unitId)}</td>
                  <td className="px-4 py-3 font-mono text-[#F2EFE4]">{d.value != null ? `RM${d.value.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-[#B8954A]">{d.feeAmount != null ? `RM${d.feeAmount.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: STATUS_COLORS[d.status] }} />
                      <select
                        value={d.status}
                        onChange={(e) => setStatus(d, e.target.value as Deal["status"])}
                        className="rounded-lg border border-[#2E3A32] bg-[#232D27] px-2 py-1 text-[11px] outline-none"
                      >
                        {DEAL_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#6E7E72]">{d.closedAt ? format(new Date(d.closedAt), "MMM d, yyyy") : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(d)} className="text-[11px] text-[#6E7E72] hover:text-[#ff6666]" title="Delete deal">✕</button>
                  </td>
                </tr>
              ))}
              {deals.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[12px] text-[#6E7E72]">No deals yet — close your first one 💪</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <DealModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
