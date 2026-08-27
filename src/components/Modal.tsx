"use client";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[80vh] w-[520px] max-w-[90vw] overflow-y-auto rounded-xl border border-[#2E3A32] bg-[#1C2420] p-7">
        <div className="mb-5 text-base font-bold">{title}</div>
        {children}
      </div>
    </div>
  );
}

export function FormLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-[#6E7E72]">{children}</label>;
}

export const inputCls =
  "w-full rounded-lg border border-[#2E3A32] bg-[#232D27] px-3 py-2.5 text-[13px] outline-none focus:border-[#6E7E72]";
