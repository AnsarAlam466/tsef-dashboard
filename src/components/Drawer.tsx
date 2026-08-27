"use client";

export default function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fixed right-0 top-0 h-full w-[440px] max-w-[95vw] overflow-y-auto border-l border-[#2E3A32] bg-[#1C2420] p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="font-heading text-base font-bold text-[#F2EFE4]">{title}</div>
          <button onClick={onClose} className="rounded px-1.5 text-sm text-[#6E7E72] hover:text-[#F2EFE4]">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-2.5 mt-6 text-[11px] font-bold uppercase tracking-wide text-[#6E7E72]">{children}</div>;
}
