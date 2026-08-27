"use client";

import useSWR, { mutate } from "swr";
import { useMemo, useRef, useState } from "react";
import { fetcher, apiDelete } from "@/lib/fetcher";
import { DEPTS, Doc } from "@/lib/constants";
import TopBar from "@/components/TopBar";
import { useToast } from "@/components/Toast";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileIcon(mime: string, name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf" || ext === "pdf") return "📕";
  if (["doc", "docx"].includes(ext)) return "📄";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["ppt", "pptx"].includes(ext)) return "📽️";
  if (["zip", "rar", "7z"].includes(ext)) return "🗜️";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("audio/")) return "🎵";
  return "📁";
}

export default function DocumentsPage() {
  const { data: docs = [] } = useSWR<Doc[]>("/api/documents", fetcher);
  const { data: checklist } = useSWR<{ html: string }>("/api/checklist", fetcher);
  const showToast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  async function handleUpload() {
    const file = fileInput.current?.files?.[0];
    if (!file) return showToast("Choose a file first.");

    const formData = new FormData();
    formData.append("file", file);
    if (department) formData.append("department", department);
    if (description) formData.append("description", description);

    setUploading(true);
    try {
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Upload failed");
      await mutate("/api/documents");
      showToast("Document uploaded");
      if (fileInput.current) fileInput.current.value = "";
      setDescription("");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    try {
      await apiDelete(`/api/documents/${id}`);
      await mutate("/api/documents");
      showToast("Document deleted");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const groups = useMemo(() => {
    const map: Record<string, Doc[]> = {};
    docs.forEach((doc) => {
      const key = doc.department || "general";
      if (!map[key]) map[key] = [];
      map[key].push(doc);
    });
    return map;
  }, [docs]);

  const groupOrder = ["general", ...Object.keys(DEPTS)].filter((k) => groups[k]?.length);

  return (
    <>
      <TopBar title="Documents" subtitle="Shared team files, organized by department" />
      <div className="max-w-[860px] p-7">
        <div className="mb-6 rounded-xl border border-[#B8954A40] bg-[#1C2420]">
          <button onClick={() => setShowChecklist(!showChecklist)} className="flex w-full items-center justify-between px-5 py-4 text-left">
            <div className="flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-wide text-[#B8954A]">
              📋 Official Documents Checklist
            </div>
            <span className="text-xs text-[#6E7E72]">{showChecklist ? "▲ Hide" : "▼ Show"}</span>
          </button>
          {showChecklist && checklist && (
            <div className="border-t border-[#2E3A32] px-6 py-5">
              <article className="pitchbook-md" dangerouslySetInnerHTML={{ __html: checklist.html }} />
            </div>
          )}
        </div>

        <div className="mb-6 rounded-xl border border-[#2E3A32] bg-[#1C2420] p-5">
          <div className="mb-3.5 text-[13px] font-bold uppercase tracking-wide text-[#9AAB9F]">Upload Document</div>
          <div className="mb-3.5 flex flex-wrap gap-3">
            <input ref={fileInput} type="file" className="flex-1 rounded-lg border border-[#2E3A32] bg-[#232D27] px-3 py-2 text-[13px] outline-none file:mr-3 file:rounded file:border-0 file:bg-[#2C3830] file:px-2.5 file:py-1 file:text-[#F2EFE4]" />
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="min-w-[160px] rounded-lg border border-[#2E3A32] bg-[#232D27] px-3 py-2 text-[13px] outline-none">
              <option value="">General (no department)</option>
              {Object.entries(DEPTS).map(([code, d]) => <option key={code} value={code}>{d.name}</option>)}
            </select>
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            className="mb-3.5 w-full rounded-lg border border-[#2E3A32] bg-[#232D27] px-3 py-2 text-[13px] outline-none"
          />
          <button onClick={handleUpload} disabled={uploading} className="rounded-lg bg-[#B8954A] px-3.5 py-2 text-xs font-semibold text-[#1C2420] hover:bg-[#C9A06B] disabled:opacity-50">
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>

        {docs.length === 0 && (
          <div className="rounded-xl border border-[#2E3A32] bg-[#1C2420] p-10 text-center text-[13px] text-[#6E7E72]">
            <div className="mb-2.5 text-3xl">📁</div>No documents uploaded yet
          </div>
        )}

        {groupOrder.map((key) => {
          const d = key !== "general" ? DEPTS[key] : null;
          return (
            <div key={key} className="mb-6">
              <div className="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide" style={{ color: d?.color || "#9AAB9F" }}>
                {d ? `${d.icon} ${d.name}` : "📌 General"}
                <span className="rounded-full bg-[#232D27] px-2 py-0.5 text-[10px] text-[#6E7E72]">{groups[key].length}</span>
              </div>
              {groups[key].map((doc) => (
                <div key={doc._id} className="mb-2 flex items-center gap-3.5 rounded-xl border border-[#2E3A32] bg-[#1C2420] p-4">
                  <div className="text-2xl">{fileIcon(doc.mimeType, doc.originalName)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{doc.originalName}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[#6E7E72]">
                      <span>{formatSize(doc.size)}</span>
                      <span>·</span>
                      <span>{doc.uploadedByName}</span>
                      <span>·</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                    {doc.description && <div className="mt-1 text-[12px] text-[#9AAB9F]">{doc.description}</div>}
                  </div>
                  <a href={`/api/documents/${doc._id}/download`} className="flex-shrink-0 rounded-lg border border-[#2E3A32] bg-[#232D27] px-3 py-1.5 text-xs font-semibold text-[#9AAB9F] hover:text-[#F2EFE4]">Download</a>
                  <button onClick={() => handleDelete(doc._id)} className="flex-shrink-0 text-[11px] text-[#6E7E72] hover:text-[#ff6666]">Delete</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
