"use client";

import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeading } from "@/components/page-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboard } from "@/lib/api";

const statColors = ["#b83e2e", "#263f89", "#873bea", "#e95013"];
const barColors = ["#238bab", "#f5cc35", "#39b8d3", "#9664dc", "#78d29f", "#d28683", "#72bd23"];

function DashboardSkeleton() { return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div><div className="grid gap-4 xl:grid-cols-[0.8fr_1.25fr]"><Skeleton className="h-[540px]" /><Skeleton className="h-[540px]" /></div></div>; }

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  return <><PageHeading title="Dashboard Overview" />{isLoading ? <DashboardSkeleton /> : isError || !data ? <p className="rounded-lg bg-white p-10 text-center text-red-600">Could not load dashboard data. Please try again.</p> : <>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[{ value: data.totalUser, label: "Total Users" }, { value: data.totalClient, label: "Total Clients" }, { value: data.totalTradesman, label: "Total Tradesmen" }, { value: data.totalAdvertisement, label: "Total Advertisements" }].map((stat, index) => <article key={stat.label} className="rounded-lg border border-black/10 bg-white px-5 py-5 text-center shadow-sm"><strong className="text-3xl" style={{ color: statColors[index] }}>{stat.value}</strong><p className="mt-2 text-base font-bold text-[#536071]">{stat.label}</p></article>)}
    </section>
    <section className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.25fr]">
      <article className="min-w-0 rounded-lg border border-black/10 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">New Tradesman Signups</h2><span className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white">Last 7 days</span></div><div className="h-[420px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.dailyTradesmanSignups} margin={{ top: 25, right: 5, bottom: 0, left: -20 }}><CartesianGrid stroke="#e7e9ee" strokeDasharray="2 3" /><XAxis dataKey="day" axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "#f5f2ec" }} /><Bar dataKey="count" radius={[24, 24, 0, 0]} maxBarSize={44} label={{ position: "insideTop", fill: "white", fontWeight: 700 }}>{data.dailyTradesmanSignups.map((_, index) => <Cell key={index} fill={barColors[index % barColors.length]} />)}</Bar></BarChart></ResponsiveContainer></div></article>
      <article className="min-w-0 rounded-lg border border-black/10 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">User Registrations</h2><span className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white">This year</span></div><div className="h-[420px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.userRegistrationRate} margin={{ top: 25, right: 5, bottom: 0, left: -15 }}><defs><linearGradient id="registration" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b83e2e" /><stop offset="100%" stopColor="#ef9b91" /></linearGradient></defs><CartesianGrid stroke="#d7d7d7" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip /><Area type="monotone" dataKey="count" stroke="#b83e2e" strokeWidth={3} fill="url(#registration)" /></AreaChart></ResponsiveContainer></div></article>
    </section>
  </>}</>;
}
