"use client";

import useSWR, { mutate } from "swr";
import { useMemo, useState } from "react";
import { DndContext, DragOverlay, useDroppable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { fetcher, apiPatch } from "@/lib/fetcher";
import { DEPTS, Task } from "@/lib/constants";
import TopBar from "@/components/TopBar";
import TaskModal from "@/components/TaskModal";
import KanbanCard from "@/components/KanbanCard";
import { useToast } from "@/components/Toast";

const COLUMNS: { key: Task["status"]; label: string; accent: string }[] = [
  { key: "not_started", label: "Not Started", accent: "#6E7E72" },
  { key: "in_progress", label: "In Progress", accent: "#8FB6A8" },
  { key: "blocked", label: "Blocked", accent: "#ef4444" },
  { key: "done", label: "Done", accent: "#22c55e" },
];

const PEOPLE = ["Danny", "Marwa", "Ansar"];

function Column({ status, label, accent, tasks, onCardClick }: { status: Task["status"]; label: string; accent: string; tasks: Task[]; onCardClick: (t: Task) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex min-w-[270px] flex-1 flex-col rounded-xl border border-[#2E3A32] bg-[#1C2420]">
      <div className="flex items-center justify-between border-b border-[#2E3A32] px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
          <span className="text-[12px] font-bold uppercase tracking-wide text-[#F2EFE4]">{label}</span>
        </div>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2C3830] text-[10px] font-bold text-[#9AAB9F]">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className={`min-h-[120px] flex-1 p-2.5 transition-colors ${isOver ? "bg-[#B8954A0d]" : ""}`}>
        {tasks.map((t) => (
          <KanbanCard key={t._id} task={t} onClick={() => onCardClick(t)} />
        ))}
        {tasks.length === 0 && <div className="p-4 text-center text-[11px] text-[#5C6C60]">Drop tasks here</div>}
      </div>
    </div>
  );
}

export default function BoardPage() {
  const { data: tasks = [] } = useSWR<Task[]>("/api/tasks", fetcher);
  const showToast = useToast();
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [deptFilter, setDeptFilter] = useState("");
  const [personFilter, setPersonFilter] = useState("");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (deptFilter && t.department !== deptFilter) return false;
      if (personFilter && t.assignedTo !== personFilter) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, deptFilter, personFilter, search]);

  const activeTask = tasks.find((t) => t._id === activeId);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const task = tasks.find((t) => t._id === active.id);
    const newStatus = over.id as Task["status"];
    if (!task || task.status === newStatus) return;

    // optimistic update
    await mutate(
      "/api/tasks",
      tasks.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t)),
      false
    );
    try {
      await apiPatch(`/api/tasks/${task._id}`, { status: newStatus });
      showToast(`Moved to ${newStatus.replace("_", " ")}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      await mutate("/api/tasks");
    }
  }

  return (
    <>
      <TopBar
        title="Board"
        subtitle="Drag tasks between columns to update status"
        actions={<button onClick={() => setTaskModal({ open: true, task: null })} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B]">+ New Task</button>}
      />
      <div className="p-7">
        <div className="mb-5 flex flex-wrap gap-2.5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="min-w-[180px] flex-1 rounded-lg border border-[#2E3A32] bg-[#1C2420] px-3 py-2 text-[13px] outline-none focus:border-[#6E7E72]"
          />
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded-lg border border-[#2E3A32] bg-[#1C2420] px-3 py-2 text-[13px] outline-none">
            <option value="">All departments</option>
            {Object.entries(DEPTS).map(([code, d]) => <option key={code} value={code}>{d.name}</option>)}
          </select>
          <select value={personFilter} onChange={(e) => setPersonFilter(e.target.value)} className="rounded-lg border border-[#2E3A32] bg-[#1C2420] px-3 py-2 text-[13px] outline-none">
            <option value="">Everyone</option>
            {PEOPLE.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {COLUMNS.map((col) => (
              <Column
                key={col.key}
                status={col.key}
                label={col.label}
                accent={col.accent}
                tasks={filtered.filter((t) => t.status === col.key)}
                onCardClick={(t) => setTaskModal({ open: true, task: t })}
              />
            ))}
          </div>
          <DragOverlay>{activeTask ? <KanbanCard task={activeTask} onClick={() => {}} /> : null}</DragOverlay>
        </DndContext>
      </div>
      <TaskModal open={taskModal.open} task={taskModal.task} onClose={() => setTaskModal({ open: false, task: null })} />
    </>
  );
}
