"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSOS: () => void;
  userRole?: string;
}

type NavItem = { name: string; href: string; icon: string };

const primaryItems: NavItem[] = [
  { name: "Home", href: "/", icon: "⌂" },
  { name: "Dashboard", href: "/dashboard", icon: "▦" },
  { name: "Live Situation", href: "/live-situation", icon: "◉" },
  { name: "Emergency Map", href: "/emergency-map", icon: "⌖" },
  { name: "Alerts", href: "/alerts", icon: "△" },
  { name: "Shelters", href: "/shelters", icon: "⌂" },
  { name: "Responders", href: "/responders", icon: "♙" },
];

const secondaryItems: NavItem[] = [
  { name: "Resources", href: "/resources", icon: "▣" },
  { name: "AI Assistant", href: "/ai-assistant", icon: "✦" },
  { name: "Safety Guide", href: "/safety-guide", icon: "◇" },
  { name: "Family Safety", href: "/family", icon: "⌘" },
  { name: "System Analysis", href: "/system-analysis", icon: "◌" },
];

export function AppSidebar({ isOpen, onClose, onSOS, userRole = "CITIZEN" }: AppSidebarProps) {
  const pathname = usePathname();
  const isAdmin = ["ADMIN", "EOC_ADMIN"].includes(userRole.toUpperCase());
  const responderItems = userRole.toUpperCase() === "RESPONDER"
    ? primaryItems.filter((item) => item.href !== "/dashboard")
    : primaryItems;
  const items = [
    ...responderItems,
    ...secondaryItems.filter((item) => item.href !== "/resources" || isAdmin || userRole.toUpperCase() === "RESPONDER"),
    ...(isAdmin ? [{ name: "EOC", href: "/eoc", icon: "▤" }] : []),
  ];

  return (
    <>
      {isOpen && <button aria-label="Close navigation" className="fixed inset-0 z-[1000] bg-slate-950/55 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside aria-label="Main navigation" className={`fixed inset-y-0 left-0 z-[1010] flex h-dvh w-[min(19rem,88vw)] flex-col border-r border-white/10 bg-[#0B1F3A] text-slate-200 shadow-2xl transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-20 lg:w-64 lg:shrink-0 lg:translate-x-0 lg:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex min-h-[76px] items-center justify-between border-b border-white/10 px-4">
          <Link href="/" onClick={onClose} className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xl" aria-hidden="true">✚</span>
            <span className="min-w-0"><span className="block text-sm font-extrabold text-white">ResQ</span><span className="block text-xs text-slate-300">Emergency Response</span></span>
          </Link>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-lg text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 lg:hidden" aria-label="Close sidebar">×</button>
        </div>

        <nav aria-label="Application pages" className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Response</p>
          <div className="space-y-1">
            {items.slice(0, responderItems.length).map((item) => <NavLink key={item.href} item={item} pathname={pathname} onClose={onClose} />)}
          </div>
          <p className="px-3 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Tools</p>
          <div className="space-y-1">
            {items.slice(responderItems.length).map((item) => <NavLink key={item.href} item={item} pathname={pathname} onClose={onClose} />)}
          </div>
        </nav>

        <div className="border-t border-white/10 p-3">
          <button type="button" onClick={() => { onClose(); onSOS(); }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-4 text-sm font-extrabold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]">
            <span aria-hidden="true">☎</span> Send SOS
          </button>
          <p className="pt-2 text-center text-[10px] text-slate-400">Emergency services: 112</p>
        </div>
      </aside>
    </>
  );
}

function NavLink({ item, pathname, onClose }: { item: NavItem; pathname: string; onClose: () => void }) {
  const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
  return <Link href={item.href} onClick={onClose} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${active ? "bg-[#2563EB] font-bold text-white shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
    <span aria-hidden="true" className="w-5 text-center text-base">{item.icon}</span><span className="truncate">{item.name}</span>
  </Link>;
}
