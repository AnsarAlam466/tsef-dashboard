"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CrmNote } from "@/lib/constants";
import { inputCls } from "@/components/Modal";

export default function CrmNotes({ notes, onAdd }: { notes: CrmNote[]; onAdd: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onAdd(text.trim());
      setText("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-2.5 flex gap-2">
        <input
          className={inputCls}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a note…"
        />
        <button onClick={add} disabled={saving || !text.trim()} className="flex-shrink-0 rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B] disabled:opacity-50">
          Add
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {[...notes].reverse().map((n, i) => (
          <div key={i} className="rounded-lg bg-[#232D27] p-2.5">
            <div className="text-[12px] leading-relaxed text-[#F2EFE4]">{n.text}</div>
            <div className="mt-1 text-[10px] text-[#6E7E72]">
              {n.author} · {format(new Date(n.at), "MMM d, HH:mm")}
            </div>
          </div>
        ))}
        {notes.length === 0 && <div className="py-2 text-center text-[11px] text-[#5C6C60]">No notes yet</div>}
      </div>
    </div>
  );
}
