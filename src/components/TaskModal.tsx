"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { apiPatch, apiPost, apiDelete, fetcher } from "@/lib/fetcher";
import { DEPTS, Task, addDays, today } from "@/lib/constants";
import Modal, { FormLabel, inputCls } from "@/components/Modal";
import { useToast } from "@/components/Toast";

const PEOPLE = ["Danny", "Marwa", "Ansar"];

type Props = {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
};

export default function TaskModal({ open, onClose, task }: Props) {
  const isEdit = !!task;
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Task" : "Add Task"}>
      {open && <TaskForm key={task?._id || "new"} task={task} onClose={onClose} />}
    </Modal>
  );
}

function TaskForm({ task, onClose }: { task?: Task | null; onClose: () => void }) {
  const showToast = useToast();
  const isEdit = !!task;
  const { data: allTasks = [] } = useSWR<Task[]>("/api/tasks", fetcher);

  const [title, setTitle] = useState(task?.title || "");
  const [department, setDepartment] = useState(task?.department || "tech");
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || "Danny");
  const [priority, setPriority] = useState<Task["priority"]>(task?.priority || "primary");
  const [status, setStatus] = useState<Task["status"]>(task?.status || "not_started");
  const [startDate, setStartDate] = useState(task?.startDate || task?.dueDate || today());
  const [dueDate, setDueDate] = useState(task?.dueDate || addDays(7));
  const [fallback, setFallback] = useState(task?.fallback || "");
  const [dependencies, setDependencies] = useState<string[]>(task?.dependencies || []);
  const [saving, setSaving] = useState(false);

  function toggleDependency(id: string) {
    setDependencies((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSave() {
    if (!title.trim()) return showToast("Add a task title.");
    if (startDate && dueDate && startDate > dueDate) return showToast("Start date must be before the due date.");
    setSaving(true);
    try {
      if (isEdit && task) {
        await apiPatch(`/api/tasks/${task._id}`, { title, department, assignedTo, priority, status, startDate, dueDate, fallback, dependencies });
        showToast("Task updated");
      } else {
        await apiPost("/api/tasks", { title, department, assignedTo, priority, status, startDate, dueDate, fallback: fallback || "Escalate to team", dependencies });
        showToast("Task added");
      }
      await mutate("/api/tasks");
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    setSaving(true);
    try {
      await apiDelete(`/api/tasks/${task._id}`);
      await mutate("/api/tasks");
      showToast("Task deleted");
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-3.5">
        <FormLabel>Task Title</FormLabel>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Set up WhatsApp API keys" />
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Department</FormLabel>
          <select className={inputCls} value={department} onChange={(e) => setDepartment(e.target.value)}>
            {Object.entries(DEPTS).map(([code, d]) => (
              <option key={code} value={code}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <FormLabel>Assigned To</FormLabel>
          <select className={inputCls} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            {PEOPLE.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Start Date</FormLabel>
          <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <FormLabel>Due Date</FormLabel>
          <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <div>
          <FormLabel>Priority</FormLabel>
          <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])}>
            <option value="primary">🔴 Primary</option>
            <option value="secondary">🟡 Secondary</option>
            <option value="parallel">🟢 Parallel</option>
          </select>
        </div>
        {isEdit && (
          <div>
            <FormLabel>Status</FormLabel>
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as Task["status"])}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        )}
      </div>
      {allTasks.filter((t) => t._id !== task?._id).length > 0 && (
        <div className="mb-3.5">
          <FormLabel>Depends On (must finish before this starts)</FormLabel>
          <div className="max-h-[120px] overflow-y-auto rounded-lg border border-[#2E3A32] bg-[#232D27] p-2">
            {allTasks
              .filter((t) => t._id !== task?._id)
              .map((t) => (
                <label key={t._id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[12px] hover:bg-[#2C3830]">
                  <input type="checkbox" checked={dependencies.includes(t._id)} onChange={() => toggleDependency(t._id)} className="accent-[#B8954A]" />
                  <span className="truncate">{t.title}</span>
                </label>
              ))}
          </div>
        </div>
      )}
      <div className="mb-3.5">
        <FormLabel>Fallback (if not done)</FormLabel>
        <input className={inputCls} value={fallback} onChange={(e) => setFallback(e.target.value)} placeholder="e.g. Escalate to Ansar" />
      </div>
      <div className="mt-5 flex justify-end gap-2.5">
        {isEdit && (
          <button onClick={handleDelete} disabled={saving} className="mr-auto rounded-lg border border-[#2E3A32] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[#ff6666] hover:border-[#ff4444]">
            Delete
          </button>
        )}
        <button onClick={onClose} className="rounded-lg border border-[#2E3A32] bg-[#232D27] px-3.5 py-1.5 text-xs font-semibold text-[#9AAB9F] hover:text-[#F2EFE4]">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B] disabled:opacity-50">
          {isEdit ? "Save" : "Add Task"}
        </button>
      </div>
    </>
  );
}
