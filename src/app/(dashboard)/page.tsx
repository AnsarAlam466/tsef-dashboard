"use client";

import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/fetcher";
import { Task, Meeting, Lead, HousingAgent, UnitListing, Deal, isOverdue, today, PEOPLE_COLORS } from "@/lib/constants";
import TopBar from "@/components/TopBar";
import TaskItem from "@/components/TaskItem";
import TaskModal from "@/components/TaskModal";
import MeetingModal from "@/components/MeetingModal";

const PEOPLE = [
  { name: "Danny", dept: "Product & Technology" },
  { name: "Marwa", dept: "Marketing & Growth" },
  { name: "Ansar", dept: "Operations" },
];

export default function HomePage() {
  const { data: session } = useSession();
  const { data: tasks = [] } = useSWR<Task[]>("/api/tasks", fetcher);
  const { data: meetings = [] } = useSWR<Meeting[]>("/api/meetings", fetcher);
  const { data: leads = [] } = useSWR<Lead[]>("/api/leads", fetcher);
  const { data: agents = [] } = useSWR<HousingAgent[]>("/api/agents", fetcher);
  const { data: units = [] } = useSWR<UnitListing[]>("/api/units", fetcher);
  const { data: deals = [] } = useSWR<Deal[]>("/api/deals", fetcher);
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [meetingModal, setMeetingModal] = useState(false);

  const me = session?.user?.name;
  const done = tasks.filter((t) => t.status === "done").length;
  const overallPct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const overdueAll = tasks.filter((t) => isOverdue(t));

  const mine = tasks.filter((t) => t.assignedTo === me && t.status !== "done");
  const myOverdue = mine.filter((t) => isOverdue(t));
  const myToday = mine.filter((t) => !isOverdue(t) && t.dueDate && t.dueDate <= today());
  const myUpcoming = mine.filter((t) => !myOverdue.includes(t) && !myToday.includes(t));

  const personStats = (person: string) => {
    const arr = tasks.filter((t) => t.assignedTo === person);
    const d = arr.filter((t) => t.status === "done").length;
    return { total: arr.length, done: d, pct: arr.length ? Math.round((d / arr.length) * 100) : 0, overdue: arr.filter((t) => isOverdue(t)).length };
  };

  const recentMeeting = meetings[0];

  return (
    <>
      <TopBar
        title={`Welcome back, ${me || ""}`}
        subtitle="Here's what needs your attention"
        actions={
          <>
            <button onClick={() => setTaskModal({ open: true, task: null })} className="rounded-lg border border-[#2E3A32] bg-[#232D27] px-3.5 py-1.5 text-xs font-semibold text-[#9AAB9F] hover:text-[#F2EFE4]">+ Add Task</button>
            <button onClick={() => setMeetingModal(true)} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B]">+ New Meeting</button>
          </>
        }
      />

      <div className="p-7">
        {/* CRM Pulse */}
        <div className="mb-7 grid grid-cols-4 gap-3">
          {[
            { label: "New Leads", value: leads.filter((l) => l.stage === "new").length, href: "/crm", icon: "🎓" },
            { label: "Agents Awaiting Reply", value: agents.filter((a) => a.stage === "contacted").length, href: "/crm", icon: "🤝" },
            { label: "Units Offered", value: units.filter((u) => u.status === "offered").length, href: "/crm", icon: "🏠" },
            { label: "Deals in Motion", value: deals.filter((d) => d.status === "negotiating").length, href: "/deals", icon: "💰" },
          ].map((s) => (
            <Link key={s.label} href={s.href} className="rounded-xl border border-[#2E3A32] bg-[#1C2420] p-4 transition-colors hover:border-[#B8954A66]">
              <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#6E7E72]">
                <span>{s.icon}</span> {s.label}
              </div>
              <div className="font-heading text-2xl font-bold" style={{ color: s.value > 0 ? "#B8954A" : "#F2EFE4" }}>{s.value}</div>
            </Link>
          ))}
        </div>

        {/* Team pulse strip */}
        <div className="mb-7 rounded-xl border border-[#2E3A32] bg-[#1C2420] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[#6E7E72]">Overall Progress</div>
              <div className="mt-1 text-2xl font-extrabold">{overallPct}% <span className="text-sm font-normal text-[#6E7E72]">({done}/{tasks.length} done)</span></div>
            </div>
            {overdueAll.length > 0 && (
              <div className="rounded-full bg-[#ef444420] px-3 py-1.5 text-xs font-bold text-[#f87171]">{overdueAll.length} overdue across the team</div>
            )}
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#232D27]">
            <div className="h-full rounded-full bg-[#B8954A] transition-all" style={{ width: `${overallPct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {PEOPLE.map((p) => {
              const s = personStats(p.name);
              const color = PEOPLE_COLORS[p.name];
              return (
                <div key={p.name} className="rounded-lg bg-[#232D27] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-black" style={{ background: color }}>{p.name[0]}</div>
                      <span className="text-xs font-semibold">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color }}>{s.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#2C3830]">
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: color }} />
                  </div>
                  {s.overdue > 0 && <div className="mt-1.5 text-[10px] text-[#f87171]">{s.overdue} overdue</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Focus feed */}
          <div className="col-span-2">
            <div className="mb-3.5 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-[#F2EFE4]">🎯 Your Focus</div>

            {myOverdue.length > 0 && (
              <div className="mb-5">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#f87171]">Overdue — needs attention now</div>
                {myOverdue.map((t) => <TaskItem key={t._id} task={t} onClick={() => setTaskModal({ open: true, task: t })} />)}
              </div>
            )}

            {myToday.length > 0 && (
              <div className="mb-5">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#f59e0b]">Due Today / This Week</div>
                {myToday.map((t) => <TaskItem key={t._id} task={t} onClick={() => setTaskModal({ open: true, task: t })} />)}
              </div>
            )}

            {myUpcoming.length > 0 && (
              <div className="mb-5">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#6E7E72]">Upcoming</div>
                {myUpcoming.map((t) => <TaskItem key={t._id} task={t} onClick={() => setTaskModal({ open: true, task: t })} />)}
              </div>
            )}

            {mine.length === 0 && (
              <div className="rounded-xl border border-[#2E3A32] bg-[#1C2420] p-10 text-center text-[13px] text-[#6E7E72]">
                <div className="mb-2.5 text-3xl">✨</div>Nothing pending — you&apos;re all caught up.
              </div>
            )}
          </div>

          {/* Sidebar: recent meeting */}
          <div>
            <div className="mb-3.5 text-[13px] font-bold uppercase tracking-wide text-[#F2EFE4]">Latest Meeting</div>
            {recentMeeting ? (
              <div className="rounded-xl border border-[#2E3A32] bg-[#1C2420] p-4">
                <div className="mb-1 text-sm font-bold">{recentMeeting.title}</div>
                <div className="mb-3 font-mono text-[11px] text-[#6E7E72]">{recentMeeting.date}</div>
                <div className="mb-3 text-[12px] leading-relaxed text-[#9AAB9F]">{recentMeeting.summary.slice(0, 150)}{recentMeeting.summary.length > 150 ? "…" : ""}</div>
                <div className="flex flex-wrap gap-1.5">
                  {recentMeeting.attendees.map((a) => <span key={a} className="rounded-full bg-[#232D27] px-2 py-0.5 text-[10px] text-[#9AAB9F]">{a}</span>)}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#2E3A32] bg-[#1C2420] p-6 text-center text-[12px] text-[#6E7E72]">No meetings logged yet</div>
            )}
          </div>
        </div>
      </div>

      <TaskModal open={taskModal.open} task={taskModal.task} onClose={() => setTaskModal({ open: false, task: null })} />
      <MeetingModal open={meetingModal} onClose={() => setMeetingModal(false)} />
    </>
  );
}
