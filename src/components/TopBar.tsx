"use client";

export default function TopBar({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#2E3A32] bg-[#1C2420] px-7 py-3.5">
      <div>
        <div className="text-base font-bold">{title}</div>
        {subtitle && <div className="mt-0.5 text-xs text-[#6E7E72]">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2.5">{actions}</div>
    </div>
  );
}
