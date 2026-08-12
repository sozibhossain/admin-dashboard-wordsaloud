"use client";

import { Bell, BriefcaseBusiness, Grid2X2, LogOut, Menu, Settings, ShieldCheck, Users, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Brand } from "./brand";
import { cn, initials } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard Overview", icon: Grid2X2, permission: "dashboard" },
  { href: "/users", label: "User list", icon: Users, permission: "users" },
  { href: "/advertisements", label: "Advertisement", icon: BriefcaseBusiness, permission: "advertisements" },
  { href: "/administrators", label: "Admin Management", icon: ShieldCheck, superAdminOnly: true },
  { href: "/settings", label: "Setting", icon: Settings },
] as const;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const visibleLinks = links.filter((link) => {
    if ("superAdminOnly" in link) return session?.user.role === "super-admin";
    if ("permission" in link) return session?.user.role === "super-admin" || session?.user.permissions?.includes(link.permission);
    return true;
  });
  return <div className="flex h-full flex-col bg-brand px-5 py-8 text-white">
    <Brand light />
    <nav className="mt-8 space-y-2">
      {visibleLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={onNavigate} className={cn("flex h-12 items-center gap-3 rounded-full px-4 text-[15px] font-medium", pathname.startsWith(href) ? "bg-accent text-white" : "hover:bg-white/10")}><Icon size={21} fill={href === "/dashboard" && pathname.startsWith(href) ? "currentColor" : "none"} />{label}</Link>)}
    </nav>
    <Link href="/logout" onClick={onNavigate} className="mt-auto flex h-12 items-center gap-3 rounded-full px-4 text-[15px] font-medium hover:bg-white/10"><LogOut size={22} />Log out</Link>
  </div>;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const current = links.find((item) => pathname.startsWith(item.href))?.label || (pathname === "/logout" ? "Logging Out" : "Dashboard");
  return <div className="min-h-screen bg-surface">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[290px] lg:block"><Sidebar /></aside>
    {open && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/35" aria-label="Close navigation" onClick={() => setOpen(false)} /><aside className="relative h-full w-[280px]"><button className="absolute right-3 top-3 z-10 rounded-md p-2 text-white" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button><Sidebar onNavigate={() => setOpen(false)} /></aside></div>}
    <header className="fixed left-0 right-0 top-0 z-30 flex h-[84px] items-center bg-brand px-4 text-white lg:left-[290px] lg:px-11">
      <button className="mr-4 rounded-md p-2 hover:bg-white/10 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button>
      <div className="hidden items-center gap-6 sm:flex"><span className="text-xl font-extrabold">Aturservice<span className="text-accent">tt</span></span><span className="text-sm">&gt;&nbsp; {current}</span></div>
      <div className="ml-auto flex items-center gap-4"><button className="grid size-9 place-items-center rounded-full bg-white text-[#768091]" aria-label="Notifications"><Bell size={17} /></button><div className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-[#17304d]">{initials(session?.user?.name || undefined).slice(0, 1)}</div></div>
    </header>
    <main className="min-h-screen pt-[84px] lg:pl-[290px]"><div className="p-4 sm:p-7 lg:px-10">{children}</div></main>
  </div>;
}
