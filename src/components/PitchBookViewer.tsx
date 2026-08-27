"use client";

import { useState } from "react";
import clsx from "clsx";

export type Chapter = { slug: string; title: string; html: string };

export default function PitchBookViewer({ chapters }: { chapters: Chapter[] }) {
  const [active, setActive] = useState(0);
  const chapter = chapters[active];

  return (
    <div className="flex min-h-0 flex-1">
      <div className="w-[280px] min-w-[280px] overflow-y-auto border-r border-[#2E3A32] bg-[#101511] p-4">
        <div className="mb-3 px-2 text-[11px] font-bold uppercase tracking-wide text-[#6E7E72]">Chapters</div>
        {chapters.map((c, i) => (
          <button
            key={c.slug}
            onClick={() => setActive(i)}
            className={clsx(
              "mb-1 flex w-full items-center gap-2.5 rounded-lg border-l-2 px-3 py-2.5 text-left text-[13px] transition-colors",
              i === active
                ? "border-[#B8954A] bg-[#B8954A14] font-semibold text-[#F2EFE4]"
                : "border-transparent text-[#9AAB9F] hover:bg-[#1C2420] hover:text-[#F2EFE4]"
            )}
          >
            <span className={clsx("font-heading text-[11px] font-bold", i === active ? "text-[#B8954A]" : "text-[#6E7E72]")}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="truncate">{c.title}</span>
          </button>
        ))}
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[760px] p-10">
          <div className="mb-2 font-heading text-[11px] font-bold uppercase tracking-widest text-[#B8954A]">
            Chapter {String(active + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
          </div>
          <article className="pitchbook-md" dangerouslySetInnerHTML={{ __html: chapter.html }} />
          <div className="mt-10 flex items-center justify-between border-t border-[#2E3A32] pt-5">
            <button
              onClick={() => setActive(Math.max(0, active - 1))}
              disabled={active === 0}
              className="rounded-lg border border-[#2E3A32] bg-[#232D27] px-3.5 py-1.5 text-xs font-semibold text-[#9AAB9F] hover:text-[#F2EFE4] disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              onClick={() => setActive(Math.min(chapters.length - 1, active + 1))}
              disabled={active === chapters.length - 1}
              className="rounded-lg bg-[#B8954A] px-3.5 py-1.5 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B] disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
