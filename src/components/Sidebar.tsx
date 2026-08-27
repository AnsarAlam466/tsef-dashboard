"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import clsx from "clsx";

const MAIN_NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/crm", label: "CRM", icon: "🤝" },
  { href: "/deals", label: "Deals", icon: "💰" },
  { href: "/board", label: "Board", icon: "🗂" },
  { href: "/timeline", label: "Timeline", icon: "📊" },
  { href: "/meetings", label: "Meetings", icon: "📋" },
  { href: "/decisions", label: "Decisions", icon: "⚖️" },
  { href: "/pitchbook", label: "Pitch Book", icon: "📖" },
  { href: "/documents", label: "Documents", icon: "📁" },
  { href: "/nlp", label: "NLP Input", icon: "🧠" },
  { href: "/audit", label: "Audit", icon: "🛡" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="flex w-[220px] min-w-[220px] flex-col overflow-y-auto border-r border-[#2E3A32] bg-[#101511]">
      <div className="border-b border-[#2E3A32] px-5 py-4">
        <div className="font-heading text-[17px] font-bold leading-tight tracking-tight">
          <span className="text-[#B8954A]">Ten&</span>
          <span className="font-light text-[#F2EFE4]">See</span>
        </div>
        <div className="mt-0.5 text-[11px] leading-tight text-[#6E7E72]">Operating System</div>
      </div>

      <div className="px-3 pb-2 pt-4">
        {MAIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "mb-0.5 flex items-center gap-2.5 rounded-md border-l-2 px-2.5 py-2 text-[13px] transition-colors",
              pathname === item.href
                ? "border-[#B8954A] bg-[#B8954A1a] font-semibold text-[#F2EFE4]"
                : "border-transparent text-[#9AAB9F] hover:bg-[#232D27] hover:text-[#F2EFE4]"
            )}
          >
            <span className="w-[18px] text-center text-sm">{item.icon}</span> {item.label}
          </Link>
        ))}
      </div>

      <div className="mt-auto border-t border-[#2E3A32] p-3">
        {session?.user && (
          <div className="flex items-center gap-2.5 rounded-lg bg-[#232D27] px-2.5 py-2">
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-black"
              style={{ background: session.user.avatarColor || "#C9A06B" }}
            >
              {session.user.name?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">{session.user.name}</div>
              <div className="truncate text-[10px] text-[#6E7E72]">{session.user.role}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex-shrink-0 text-[10px] text-[#6E7E72] hover:text-[#F2EFE4]"
              title="Sign out"
            >
              ⏻
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
