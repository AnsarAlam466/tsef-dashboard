"use client";

import { DEPTS, PRIORITY_LABEL, STATUS_LABEL, Task, isOverdue } from "@/lib/constants";
import clsx from "clsx";

const PRIORITY_BORDER: Record<string, string> = {
  primary: "border-l-[#ff4444]",
  secondary: "border-l-[#ffaa00]",
  parallel: "border-l-[#0E9F6E]",
};

const STATUS_STYLE: Record<string, string> = {
  done: "bg-[#10B98120] text-[#10B981]",
  in_progress: "bg-[#8FB6A820] text-[#8FB6A8]",
  blocked: "bg-[#ff444420] text-[#ff4444]",
  not_started: "bg-[#2C3830] text-[#6E7E72]",
};

const PRIORITY_TAG: Record<string, string> = {
  primary: "bg-[#ff444420] text-[#ff6666]",
  secondary: "bg-[#ffaa0020] text-[#ffbb33]",
  parallel: "bg-[#0E9F6E20] text-[#34D399]",
};

export default function TaskItem({ task, onClick }: { task: Task; onClick?: () => void }) {
  const d = DEPTS[task.department];
  const overdue = isOverdue(task);

  return (
    <div
      onClick={onClick}
      className={clsx(
        "mb-2 flex cursor-pointer items-start gap-3 rounded-lg border-l-[3px] bg-[#232D27] p-3 transition-colors hover:bg-[#2C3830]",
        PRIORITY_BORDER[task.priority],
        overdue && "shadow-[inset_0_0_0_1px_rgba(255,68,68,0.25)]"
      )}
    >
      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: d?.color }} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[13px] font-medium leading-snug">{task.title}</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: `${d?.color}20`, color: d?.color }}>
            {d?.icon} {task.department}
          </span>
          <span className={clsx("rounded px-1.5 py-0.5 text-[10px] font-semibold", PRIORITY_TAG[task.priority])}>{task.priority}</span>
          <span className={clsx("font-mono text-[10px]", overdue ? "text-[#ff4444]" : "text-[#6E7E72]")}>
            Due {task.dueDate || "—"}
          </span>
        </div>
      </div>
      <span className={clsx("flex-shrink-0 rounded px-2 py-1 text-[10px] font-semibold", STATUS_STYLE[task.status])}>
        {STATUS_LABEL[task.status]}
      </span>
    </div>
  );
}

export { PRIORITY_LABEL };
