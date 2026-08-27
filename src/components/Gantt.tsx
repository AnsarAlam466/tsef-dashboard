"use client";

import { useMemo, useState } from "react";
import { DEPTS, Task, isOverdue, today as todayStr } from "@/lib/constants";
import clsx from "clsx";

const ROW_H = 40;
const GROUP_H = 34;
const HEADER_H = 52;
const LEFT_W = 300;

const PROGRESS: Record<string, number> = { done: 100, in_progress: 50, blocked: 8, not_started: 0 };

function parseISO(s: string) {
  return new Date(s + "T00:00:00");
}
function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

type Row =
  | { type: "group"; code: string; count: number }
  | { type: "task"; task: Task };

export default function Gantt({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (task: Task) => void }) {
  const [zoom, setZoom] = useState<"day" | "week">("week");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const dayWidth = zoom === "day" ? 34 : 14;

  const today = parseISO(todayStr());

  const { minDate, maxDate, days } = useMemo(() => {
    const dates: Date[] = [];
    tasks.forEach((t) => {
      if (t.startDate) dates.push(parseISO(t.startDate));
      if (t.dueDate) dates.push(parseISO(t.dueDate));
    });
    if (!dates.length) dates.push(today);
    let min = new Date(Math.min(...dates.map((d) => d.getTime())));
    let max = new Date(Math.max(...dates.map((d) => d.getTime())));
    min = addDays(min, -4);
    max = addDays(max, 6);
    if (today < min) min = addDays(today, -4);
    if (today > max) max = addDays(today, 6);
    // Snap to Monday for clean week columns
    const day = min.getDay();
    min = addDays(min, day === 0 ? -6 : 1 - day);

    const list: Date[] = [];
    let cursor = min;
    while (cursor <= max) {
      list.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return { minDate: min, maxDate: max, days: list };
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalWidth = days.length * dayWidth;

  const grouped = useMemo(() => {
    const byDept: Record<string, Task[]> = {};
    Object.keys(DEPTS).forEach((code) => (byDept[code] = []));
    tasks.forEach((t) => {
      if (!byDept[t.department]) byDept[t.department] = [];
      byDept[t.department].push(t);
    });
    return byDept;
  }, [tasks]);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    Object.entries(grouped).forEach(([code, arr]) => {
      if (!arr.length) return;
      out.push({ type: "group", code, count: arr.length });
      if (!collapsed.has(code)) {
        [...arr]
          .sort((a, b) => (a.startDate || a.dueDate || "").localeCompare(b.startDate || b.dueDate || ""))
          .forEach((task) => out.push({ type: "task", task }));
      }
    });
    return out;
  }, [grouped, collapsed]);

  // Compute Y offsets for arrow overlay, matching row render heights
  const { rowTop, totalHeight } = useMemo(() => {
    const map = new Map<string, number>();
    let y = 0;
    rows.forEach((r) => {
      if (r.type === "task") map.set(r.task._id, y);
      y += r.type === "group" ? GROUP_H : ROW_H;
    });
    return { rowTop: map, totalHeight: y };
  }, [rows]);

  const taskById = useMemo(() => {
    const m = new Map<string, Task>();
    tasks.forEach((t) => m.set(t._id, t));
    return m;
  }, [tasks]);

  function xForDate(d: Date) {
    return diffDays(minDate, d) * dayWidth;
  }

  function toggleCollapse(code: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  // Month bands
  const monthBands = useMemo(() => {
    const bands: { label: string; days: number }[] = [];
    days.forEach((d) => {
      const label = d.toLocaleString("en", { month: "short", year: "numeric" });
      if (bands.length && bands[bands.length - 1].label === label) bands[bands.length - 1].days++;
      else bands.push({ label, days: 1 });
    });
    return bands;
  }, [days]);

  // Week bands (for week zoom ticks)
  const weekBands = useMemo(() => {
    const bands: { label: string; start: Date; days: number }[] = [];
    days.forEach((d) => {
      const wk = getISOWeek(d);
      const last = bands[bands.length - 1];
      if (last && getISOWeek(last.start) === wk && d.getDay() !== 1) {
        last.days++;
      } else {
        bands.push({ label: `W${wk}`, start: d, days: 1 });
      }
    });
    return bands;
  }, [days]);

  const todayX = xForDate(today);

  return (
    <div className="rounded-xl border border-[#2E3A32] bg-[#1C2420]">
      <div className="flex items-center justify-between border-b border-[#2E3A32] px-4 py-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9AAB9F]">
          {toISO(minDate)} → {toISO(maxDate)}
        </div>
        <div className="flex overflow-hidden rounded-md border border-[#2E3A32]">
          <button
            onClick={() => setZoom("day")}
            className={clsx("px-3 py-1 text-[11px] font-semibold transition-colors", zoom === "day" ? "bg-[#B8954A] text-[#1C2420]" : "bg-[#232D27] text-[#9AAB9F] hover:text-[#F2EFE4]")}
          >
            Day
          </button>
          <button
            onClick={() => setZoom("week")}
            className={clsx("px-3 py-1 text-[11px] font-semibold transition-colors", zoom === "week" ? "bg-[#B8954A] text-[#1C2420]" : "bg-[#232D27] text-[#9AAB9F] hover:text-[#F2EFE4]")}
          >
            Week
          </button>
        </div>
      </div>

      <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 320px)" }}>
        <div style={{ minWidth: LEFT_W + totalWidth }}>
          {/* Header */}
          <div className="sticky top-0 z-30 flex bg-[#1C2420]" style={{ height: HEADER_H }}>
            <div className="sticky left-0 z-40 flex w-[300px] min-w-[300px] flex-col justify-end border-b border-r border-[#2E3A32] bg-[#1C2420] px-3.5 pb-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#5C6C60]">Task / WBS</div>
            </div>
            <div style={{ width: totalWidth }}>
              <div className="flex border-b border-[#2E3A32]" style={{ height: HEADER_H / 2 }}>
                {monthBands.map((b, i) => (
                  <div
                    key={i}
                    className="flex flex-shrink-0 items-center border-r border-[#2E3A32] px-2 text-[10px] font-semibold text-[#9AAB9F]"
                    style={{ width: b.days * dayWidth }}
                  >
                    {b.label}
                  </div>
                ))}
              </div>
              <div className="flex border-b border-[#2E3A32]" style={{ height: HEADER_H / 2 }}>
                {zoom === "day"
                  ? days.map((d, i) => {
                      const weekend = d.getDay() === 0 || d.getDay() === 6;
                      const isToday = toISO(d) === toISO(today);
                      return (
                        <div
                          key={i}
                          className={clsx(
                            "flex flex-shrink-0 flex-col items-center justify-center border-r border-[#222C26] text-[9px]",
                            weekend ? "bg-[#101511] text-[#5C6C60]" : "text-[#9AAB9F]",
                            isToday && "bg-[#B8954A1a] font-bold text-[#B8954A]"
                          )}
                          style={{ width: dayWidth }}
                        >
                          <div>{"SMTWTFS"[d.getDay()]}</div>
                          <div>{d.getDate()}</div>
                        </div>
                      );
                    })
                  : weekBands.map((b, i) => (
                      <div
                        key={i}
                        className="flex flex-shrink-0 items-center justify-center border-r border-[#222C26] text-[10px] font-medium text-[#9AAB9F]"
                        style={{ width: b.days * dayWidth }}
                      >
                        {b.label}
                      </div>
                    ))}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="relative">
            {/* grid-lines + weekend shading + today marker (behind rows content but rows have transparent bg on right side) */}
            <div className="pointer-events-none absolute left-[300px] top-0 z-0" style={{ width: totalWidth, height: totalHeight }}>
              {zoom === "day" &&
                days.map((d, i) =>
                  d.getDay() === 0 || d.getDay() === 6 ? (
                    <div key={i} className="absolute top-0 bg-[#101511]" style={{ left: i * dayWidth, width: dayWidth, height: totalHeight }} />
                  ) : null
                )}
              <div className="absolute top-0 z-10 border-l-2 border-dashed border-[#f59e0b]" style={{ left: todayX, height: totalHeight }} />
            </div>

            {/* dependency arrows */}
            <svg
              className="pointer-events-none absolute left-[300px] top-0 z-20"
              width={totalWidth}
              height={totalHeight}
              style={{ overflow: "visible" }}
            >
              <defs>
                <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#6E7E72" />
                </marker>
              </defs>
              {rows
                .filter((r): r is { type: "task"; task: Task } => r.type === "task")
                .flatMap(({ task }) => {
                  const childY = rowTop.get(task._id);
                  if (childY === undefined || !task.dependencies?.length || !task.startDate) return [];
                  return task.dependencies.map((depId) => {
                    const parent = taskById.get(depId);
                    const parentY = rowTop.get(depId);
                    if (!parent || parentY === undefined || !parent.dueDate) return null;
                    const startX = xForDate(parseISO(parent.dueDate)) + dayWidth;
                    const startY = parentY + ROW_H / 2;
                    const endX = xForDate(parseISO(task.startDate!));
                    const endY = childY + ROW_H / 2;
                    const midX = startX + Math.max(10, (endX - startX) / 2);
                    const path =
                      endX > startX
                        ? `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX - 4} ${endY}`
                        : `M ${startX} ${startY} L ${startX + 10} ${startY} L ${startX + 10} ${(startY + endY) / 2} L ${endX - 14} ${(startY + endY) / 2} L ${endX - 14} ${endY} L ${endX - 4} ${endY}`;
                    return (
                      <path key={`${depId}-${task._id}`} d={path} fill="none" stroke="#6E7E72" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                    );
                  });
                })}
            </svg>

            {/* rows */}
            {rows.map((row) => {
              if (row.type === "group") {
                const d = DEPTS[row.code];
                const isCollapsed = collapsed.has(row.code);
                return (
                  <div key={`g-${row.code}`} className="relative z-10 flex border-b border-[#222C26]" style={{ height: GROUP_H }}>
                    <div
                      onClick={() => toggleCollapse(row.code)}
                      className="sticky left-0 z-40 flex w-[300px] min-w-[300px] cursor-pointer items-center gap-2 border-r border-[#2E3A32] px-3.5"
                      style={{ background: `${d.color}1a` }}
                    >
                      <span className="text-[10px] text-[#9AAB9F]">{isCollapsed ? "▸" : "▾"}</span>
                      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: d.color }} />
                      <span className="text-[11px] font-bold" style={{ color: d.color }}>{d.icon} {d.name.split(" ")[0]}</span>
                      <span className="ml-auto text-[10px] text-[#5C6C60]">{row.count}</span>
                    </div>
                    <div style={{ width: totalWidth, background: `${d.color}0a` }} />
                  </div>
                );
              }

              const t = row.task;
              const d = DEPTS[t.department];
              const overdue = isOverdue(t);
              const hasBar = !!t.startDate;
              const barLeft = hasBar ? xForDate(parseISO(t.startDate!)) : xForDate(parseISO(t.dueDate || todayStr())) - 6;
              const barWidth = hasBar
                ? Math.max(dayWidth - 2, (diffDays(parseISO(t.startDate!), parseISO(t.dueDate || t.startDate!)) + 1) * dayWidth - 2)
                : 12;
              const pct = PROGRESS[t.status] ?? 0;
              const barColor = overdue ? "#ef4444" : d.color;

              return (
                <div key={t._id} className="relative z-10 flex border-b border-[#222C26] hover:bg-[#ffffff05]" style={{ height: ROW_H }}>
                  <div className="sticky left-0 z-40 flex w-[300px] min-w-[300px] items-center gap-2 border-r border-[#2E3A32] bg-[#1C2420] px-3.5">
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: d.color }} />
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onTaskClick(t)}>
                      <div className="truncate text-[12px] font-medium text-[#F2EFE4]">{t.title}</div>
                      <div className="truncate text-[10px] text-[#6E7E72]">{t.assignedTo} · {t.startDate || "—"} → {t.dueDate || "—"}</div>
                    </div>
                  </div>
                  <div className="relative" style={{ width: totalWidth }}>
                    {hasBar ? (
                      <div
                        onClick={() => onTaskClick(t)}
                        className="absolute top-1/2 -translate-y-1/2 cursor-pointer rounded-[4px] border-l-[3px]"
                        style={{
                          left: barLeft,
                          width: barWidth,
                          height: 20,
                          background: overdue ? "rgba(239,68,68,0.15)" : `${d.color}26`,
                          borderLeftColor: barColor,
                        }}
                        title={t.title}
                      >
                        <div className="h-full rounded-r-[3px]" style={{ width: `${pct}%`, background: `${barColor}66` }} />
                        {barWidth > 60 && (
                          <div className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-[#F2EFE4]" style={{ textShadow: "0 1px 2px #121814" }}>
                            {t.priority === "primary" ? "🔴" : t.priority === "secondary" ? "🟡" : "🟢"} {t.status.replace("_", " ")}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => onTaskClick(t)}
                        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-pointer"
                        style={{ left: barLeft + 6, background: barColor }}
                        title={`${t.title} (milestone)`}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {rows.length === 0 && (
              <div className="p-10 text-center text-[13px] text-[#6E7E72]">No tasks to display on the timeline.</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-t border-[#2E3A32] px-4 py-2.5">
        {Object.entries(DEPTS).map(([code, d]) =>
          grouped[code]?.length ? (
            <div key={code} className="flex items-center gap-1.5 text-[10px] text-[#6E7E72]">
              <div className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.name.split(" ")[0]}
            </div>
          ) : null
        )}
        <div className="flex items-center gap-1.5 text-[10px] text-[#6E7E72]"><div className="h-2 w-2 rounded-full bg-[#ef4444]" /> Overdue</div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#6E7E72]"><div className="h-2.5 w-0.5 border-l-2 border-dashed border-[#f59e0b]" /> Today</div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#6E7E72]"><div className="h-2 w-2 rotate-45 bg-[#9AAB9F]" /> Milestone (no start date)</div>
      </div>
    </div>
  );
}
