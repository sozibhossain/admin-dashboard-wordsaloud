"use client";

import { Bell, BriefcaseBusiness, ClipboardCheck, FileClock, FolderCog, Grid2X2, LogOut, Menu, MessageSquareText, Settings, ShieldCheck, SlidersHorizontal, Users, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Brand } from "./brand";
import { cn, initials } from "@/lib/utils";
import { getNotifications } from "@/lib/api";

const links = [
  { href: "/dashboard", label: "Dashboard Overview", icon: Grid2X2, permission: "dashboard" },
  { href: "/users", label: "User List", icon: Users, permission: "users" },
  { href: "/verification", label: "Verification Queue", icon: ClipboardCheck, permission: "verification" },
  { href: "/advertisements", label: "Advertisements", icon: BriefcaseBusiness, permission: "advertisements" },
  { href: "/reviews", label: "Review Moderation", icon: MessageSquareText, permission: "reviews" },
  { href: "/categories", label: "Trade Categories", icon: FolderCog, permission: "categories" },
  { href: "/audit-logs", label: "Audit Log", icon: FileClock, permission: "audit" },
  { href: "/platform-settings", label: "Platform Settings", icon: SlidersHorizontal, permission: "settings" },
  { href: "/administrators", label: "Admin Management", icon: ShieldCheck, superAdminOnly: true },
  { href: "/settings", label: "My Settings", icon: Settings },
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: getNotifications, refetchInterval: 60_000 });
  const current = links.find((item) => pathname.startsWith(item.href))?.label || (pathname === "/logout" ? "Logging Out" : "Dashboard");
  return <div className="min-h-screen bg-surface">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[290px] lg:block"><Sidebar /></aside>
    {open && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/35" aria-label="Close navigation" onClick={() => setOpen(false)} /><aside className="relative h-full w-[280px]"><button className="absolute right-3 top-3 z-10 rounded-md p-2 text-white" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button><Sidebar onNavigate={() => setOpen(false)} /></aside></div>}
    <header className="fixed left-0 right-0 top-0 z-30 flex h-[84px] items-center bg-brand px-4 text-white lg:left-[290px] lg:px-11">
      <button className="mr-4 rounded-md p-2 hover:bg-white/10 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button>
      <div className="hidden items-center gap-6 sm:flex"><span className="text-xl font-extrabold">Aturservice<span className="text-accent">tt</span></span><span className="text-sm">&gt;&nbsp; {current}</span></div>
      <div className="ml-auto flex items-center gap-4"><div className="relative"><button onClick={() => setNotificationsOpen((value) => !value)} className="relative grid size-9 place-items-center rounded-full bg-white text-[#768091]" aria-label="Notifications" aria-expanded={notificationsOpen}><Bell size={17} />{Boolean(notifications.data?.unreadCount) && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{Math.min(notifications.data!.unreadCount, 99)}</span>}</button>{notificationsOpen && <div className="absolute right-0 top-12 w-[min(90vw,360px)] overflow-hidden rounded-lg border border-black/10 bg-white text-ink shadow-xl"><div className="border-b border-black/10 px-4 py-3"><p className="font-bold">Notifications</p><p className="text-xs text-muted">{notifications.data?.unreadCount || 0} items need attention</p></div><div className="max-h-80 overflow-y-auto">{notifications.data?.items.map((item) => <Link key={`${item.type}-${item.id}`} href={item.href} onClick={() => setNotificationsOpen(false)} className="block border-b border-black/5 px-4 py-3 hover:bg-brand-soft"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 truncate text-xs text-muted">{item.message}</p></Link>)}{!notifications.data?.items.length && <p className="p-6 text-center text-sm text-muted">No new notifications.</p>}</div>{notifications.data && <div className="grid grid-cols-3 gap-1 border-t border-black/10 p-3 text-center text-xs text-muted"><span>{notifications.data.counts.verification} verifications</span><span>{notifications.data.counts.reviews} reviews</span><span>{notifications.data.counts.inquiries} inquiries</span></div>}</div>}</div><div className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-[#17304d]">{initials(session?.user?.name || undefined).slice(0, 1)}</div></div>
    </header>
    <main className="min-h-screen pt-[84px] lg:pl-[290px]"><div className="p-4 sm:p-7 lg:px-10">{children}</div></main>
  </div>;
}
