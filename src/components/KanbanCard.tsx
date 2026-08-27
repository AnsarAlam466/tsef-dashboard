"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { DEPTS, PEOPLE_COLORS, Task, isOverdue } from "@/lib/constants";
import clsx from "clsx";

const PRIORITY_DOT: Record<string, string> = { primary: "#ef4444", secondary: "#f59e0b", parallel: "#22c55e" };

export default function KanbanCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });
  const d = DEPTS[task.department];
  const overdue = isOverdue(task);
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={clsx(
        "mb-2.5 cursor-grab rounded-lg border border-[#2E3A32] bg-[#202A24] p-3 shadow-sm transition-shadow hover:border-[#3D4F42] active:cursor-grabbing",
        isDragging && "z-50 opacity-60 shadow-lg"
      )}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRIORITY_DOT[task.priority] }} />
        <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: `${d.color}20`, color: d.color }}>
          {d.icon} {task.department}
        </span>
        {overdue && <span className="ml-auto rounded bg-[#ef444420] px-1.5 py-0.5 text-[9px] font-bold text-[#f87171]">Overdue</span>}
      </div>
      <div className="mb-2.5 text-[13px] font-medium leading-snug text-[#F2EFE4]">{task.title}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-black"
            style={{ background: PEOPLE_COLORS[task.assignedTo] || "#6E7E72" }}
          >
            {task.assignedTo[0]}
          </div>
          <span className="text-[10px] text-[#9AAB9F]">{task.assignedTo}</span>
        </div>
        {task.dueDate && (
          <span className={clsx("font-mono text-[10px]", overdue ? "text-[#f87171]" : "text-[#6E7E72]")}>{task.dueDate.slice(5)}</span>
        )}
      </div>
    </div>
  );
}
