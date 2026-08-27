"use client";

import { useState } from "react";
import { mutate } from "swr";
import { apiPost } from "@/lib/fetcher";
import { DEPTS, today } from "@/lib/constants";
import TopBar from "@/components/TopBar";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

type ParsedTask = {
  title: string;
  department: string;
  assignedTo: string;
  priority: string;
  dueDate: string;
  fallback: string;
};

type ParseResult = {
  summary: string;
  decisions: string[];
  openQuestions: string[];
  tasks: ParsedTask[];
};

const SAMPLE = `Meeting 28 June - We moved from render to azure VM, connected via SSH, more control now can host LLMs. Danny set it up already.

New UI direction - reel style, mobile first, max 3 pages. We might be first booking platform in Malaysia not just redirect like propertyguru.

Marketing - Marwa to work on platforms, cinematic content not AI. Real storyline.

One person takes lead on development and delegates.

Plan A - get MVP and reach out for funding. Plan B - organic 20 agents a day.

Notion needs to be configured again.`;

export default function NlpPage() {
  const showToast = useToast();
  const router = useRouter();
  const [text, setText] = useState("");
  const [date, setDate] = useState(today());
  const [attendees, setAttendees] = useState("Danny,Marwa,Ansar");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);

  async function handleParse() {
    if (!text.trim()) return showToast("Paste a meeting transcript first.");
    setLoading(true);
    try {
      const res = await apiPost<ParseResult>("/api/nlp/parse", { text });
      setResult(res);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    try {
      await apiPost("/api/meetings", {
        title: "Parsed Meeting — " + date,
        date,
        attendees: attendees.split(","),
        summary: result.summary,
        decisions: result.decisions,
        openQuestions: result.openQuestions,
        tasks: result.tasks,
      });
      await mutate("/api/meetings");
      await mutate("/api/tasks");
      showToast(`Meeting saved. ${result.tasks.length} task(s) added.`);
      setText("");
      setResult(null);
      router.push("/meetings");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <>
      <TopBar title="NLP Input" subtitle="Paste meeting → auto-parse → tasks created" />
      <div className="max-w-[800px] p-7">
        <div className="mb-4 text-[13px] font-bold uppercase tracking-wide text-[#9AAB9F]">Paste Meeting Transcript</div>
        <div className="mb-3.5 flex flex-wrap gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-w-[140px] flex-1 rounded-lg border border-[#2E3A32] bg-[#1C2420] px-3 py-2 text-[13px] outline-none" />
          <select value={attendees} onChange={(e) => setAttendees(e.target.value)} className="min-w-[140px] flex-1 rounded-lg border border-[#2E3A32] bg-[#1C2420] px-3 py-2 text-[13px] outline-none">
            <option value="Danny,Marwa,Ansar">All 3 — Danny, Marwa, Ansar</option>
            <option value="Danny,Ansar">Danny + Ansar</option>
            <option value="Marwa,Ansar">Marwa + Ansar</option>
            <option value="Danny,Marwa">Danny + Marwa</option>
          </select>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your raw meeting notes here — WhatsApp messages, voice note transcript, bullet points, anything."
          className="mb-3.5 min-h-[220px] w-full resize-y rounded-xl border border-[#2E3A32] bg-[#1C2420] p-5 text-sm leading-relaxed outline-none focus:border-[#6E7E72]"
        />
        <div className="flex gap-2.5">
          <button onClick={handleParse} disabled={loading} className="rounded-lg bg-[#B8954A] px-3.5 py-2 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B] disabled:opacity-50">
            {loading ? "Parsing…" : "Parse with TSEF"}
          </button>
          <button onClick={() => setText(SAMPLE)} className="rounded-lg border border-[#2E3A32] bg-[#232D27] px-3.5 py-2 text-xs font-semibold text-[#9AAB9F] hover:text-[#F2EFE4]">Load Sample</button>
        </div>

        {result && (
          <div className="mt-5 rounded-xl border border-[#2E3A32] bg-[#1C2420] p-5">
            <Section label="Summary">
              <div className="text-sm leading-relaxed text-[#9AAB9F]">{result.summary}</div>
            </Section>
            <hr className="my-5 border-[#2E3A32]" />
            <Section label="Decisions Made">
              {result.decisions.map((d, i) => (
                <div key={i} className="mb-1.5 flex items-start gap-2.5 rounded-lg bg-[#232D27] px-3 py-2.5 text-[13px]">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#2C3830] text-[10px] font-bold text-[#9AAB9F]">{i + 1}</div>
                  {d}
                </div>
              ))}
            </Section>
            <hr className="my-5 border-[#2E3A32]" />
            <Section label="Tasks Extracted">
              {result.tasks.length ? result.tasks.map((t, i) => {
                const d = DEPTS[t.department] || DEPTS.tech;
                return (
                  <div key={i} className="mb-2 rounded-lg border-l-[3px] bg-[#232D27] p-3.5" style={{ borderLeftColor: d.color }}>
                    <div className="mb-2 flex items-start justify-between">
                      <div className="text-[13px] font-semibold">{t.title}</div>
                      <span className="rounded bg-[#2C3830] px-2 py-0.5 text-[10px] font-semibold text-[#6E7E72]">New</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: `${d.color}20`, color: d.color }}>{d.icon} {t.department}</span>
                      <span className="rounded bg-[#ff444420] px-1.5 py-0.5 text-[10px] font-semibold text-[#ff6666]">{t.priority}</span>
                      <span className="text-[11px] text-[#6E7E72]">→ {t.assignedTo}</span>
                      <span className="font-mono text-[10px] text-[#6E7E72]">Due {t.dueDate}</span>
                    </div>
                  </div>
                );
              }) : <div className="p-6 text-center text-[13px] text-[#6E7E72]">No tasks detected — add manually</div>}
            </Section>
            <hr className="my-5 border-[#2E3A32]" />
            <Section label="Open Questions">
              {result.openQuestions.map((q, i) => (
                <div key={i} className="mb-1.5 flex items-start gap-2.5 rounded-lg bg-[#232D27] px-3 py-2.5 text-[13px]">
                  <div className="flex h-5 items-center justify-center rounded bg-[#2C3830] px-1.5 text-[10px] font-bold text-[#ffbb33]">Q{i + 1}</div>
                  {q}
                </div>
              ))}
            </Section>
            <div className="mt-5 flex gap-2.5">
              <button onClick={handleSave} className="rounded-lg bg-[#B8954A] px-3.5 py-2 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B]">Confirm & Save</button>
              <button onClick={() => setResult(null)} className="rounded-lg border border-[#2E3A32] bg-[#232D27] px-3.5 py-2 text-xs font-semibold text-[#9AAB9F] hover:text-[#F2EFE4]">Clear</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 text-[11px] uppercase tracking-wide text-[#6E7E72]">{label}</div>
      {children}
    </div>
  );
}
