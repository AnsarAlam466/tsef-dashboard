"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { fetcher, apiDelete } from "@/lib/fetcher";
import { Meeting } from "@/lib/constants";
import TopBar from "@/components/TopBar";
import MeetingModal from "@/components/MeetingModal";
import { useToast } from "@/components/Toast";

export default function MeetingsPage() {
  const { data: meetings = [] } = useSWR<Meeting[]>("/api/meetings", fetcher);
  const [modalOpen, setModalOpen] = useState(false);
  const showToast = useToast();

  async function handleDelete(id: string) {
    if (!confirm("Delete this meeting? This does not delete its linked tasks.")) return;
    try {
      await apiDelete(`/api/meetings/${id}`);
      await mutate("/api/meetings");
      showToast("Meeting deleted");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <>
      <TopBar
        title="Meetings & Decisions"
        subtitle="All meeting records"
        actions={<button onClick={() => setModalOpen(true)} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B]">+ New Meeting</button>}
      />
      <div className="max-w-[720px] p-7">
        {meetings.length === 0 && (
          <div className="rounded-xl border border-[#2E3A32] bg-[#1C2420] p-10 text-center text-[13px] text-[#6E7E72]">
            <div className="mb-2.5 text-3xl">📅</div>No meetings logged yet
          </div>
        )}
        {meetings.map((m) => (
          <div key={m._id} className="mb-3 rounded-xl border border-[#2E3A32] bg-[#1C2420] p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="text-[15px] font-bold">{m.title}</div>
                <div className="mt-1 font-mono text-[11px] text-[#6E7E72]">{m.date}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#10B98120] px-2 py-0.5 text-[10px] font-bold text-[#10B981]">{m.taskIds.length} tasks</span>
                <button onClick={() => handleDelete(m._id)} className="text-[11px] text-[#6E7E72] hover:text-[#ff6666]">Delete</button>
              </div>
            </div>
            <div className="mb-3.5 text-[13px] leading-relaxed text-[#9AAB9F]">{m.summary}</div>
            {m.decisions.length > 0 && (
              <>
                <hr className="my-3 border-[#2E3A32]" />
                <div className="mb-2 text-[11px] uppercase tracking-wide text-[#6E7E72]">Decisions</div>
                {m.decisions.map((d, i) => (
                  <div key={i} className="mb-1.5 flex items-start gap-2.5 rounded-lg bg-[#232D27] px-3 py-2.5 text-[13px]">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#2C3830] text-[10px] font-bold text-[#9AAB9F]">{i + 1}</div>
                    {d}
                  </div>
                ))}
              </>
            )}
            {m.openQuestions?.length > 0 && (
              <>
                <div className="mb-2 mt-3 text-[11px] uppercase tracking-wide text-[#6E7E72]">Open Questions</div>
                {m.openQuestions.map((q, i) => (
                  <div key={i} className="mb-1.5 flex items-start gap-2.5 rounded-lg bg-[#232D27] px-3 py-2.5 text-[13px]">
                    <div className="flex h-5 items-center justify-center rounded bg-[#2C3830] px-1.5 text-[10px] font-bold text-[#ffbb33]">Q{i + 1}</div>
                    {q}
                  </div>
                ))}
              </>
            )}
            <div className="mt-3 flex gap-2">
              {m.attendees.map((a) => (
                <span key={a} className="rounded-full bg-[#232D27] px-2 py-0.5 text-[10px] font-medium text-[#9AAB9F]">{a}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <MeetingModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
