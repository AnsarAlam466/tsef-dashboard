"use client";

import useSWR from "swr";
import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import { Task, isOverdue } from "@/lib/constants";
import TopBar from "@/components/TopBar";
import TaskModal from "@/components/TaskModal";
import Gantt from "@/components/Gantt";

export default function TimelinePage() {
  const { data: tasks = [] } = useSWR<Task[]>("/api/tasks", fetcher);
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });

  const overdueCount = tasks.filter((t) => isOverdue(t)).length;
  const monthLabel = new Date().toLocaleString("en", { month: "long", year: "numeric" });

  return (
    <>
      <TopBar
        title="Program Timeline"
        subtitle={`${monthLabel} · Gantt view · ${tasks.length} activities`}
        actions={overdueCount > 0 && <span className="rounded-full bg-[#ef444420] px-2.5 py-1 text-[10px] font-bold text-[#f87171]">{overdueCount} Overdue</span>}
      />
      <div className="p-7">
        <Gantt tasks={tasks} onTaskClick={(t) => setTaskModal({ open: true, task: t })} />
      </div>
      <TaskModal open={taskModal.open} task={taskModal.task} onClose={() => setTaskModal({ open: false, task: null })} />
    </>
  );
}
