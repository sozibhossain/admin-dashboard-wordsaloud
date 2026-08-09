"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createAdvertisement, deleteAdvertisement, getAdvertisements, updateAdvertisement } from "@/lib/api";
import type { Advertisement } from "@/lib/types";
import { errorMessage } from "@/lib/utils";

function AdDialog({ open, onOpenChange, advertisement }: { open: boolean; onOpenChange: (open: boolean) => void; advertisement: Advertisement | null }) {
  const client = useQueryClient();
  const mutation = useMutation({ mutationFn: (payload: { title: string; description: string }) => advertisement ? updateAdvertisement(advertisement._id, payload) : createAdvertisement(payload), onSuccess: (r) => { toast.success(r.message); client.invalidateQueries({ queryKey: ["advertisements"] }); onOpenChange(false); }, onError: (e) => toast.error(errorMessage(e)) });
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); mutation.mutate({ title: String(form.get("title")), description: String(form.get("description")) }); }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogTitle>{advertisement ? "Edit Advertisement" : "Create New Advertisement"}</DialogTitle><form onSubmit={submit} className="mt-8 space-y-4"><label className="block text-sm font-medium">Advertise Title<Input name="title" className="mt-2" required defaultValue={advertisement?.title} placeholder="e.g. Emergency Plumber" /></label><label className="block text-sm font-medium">Advertise Description<textarea name="description" className="form-control mt-2 min-h-36 resize-none" required defaultValue={advertisement?.description} placeholder="Write here..." /></label><div className="flex gap-3 pt-1"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : advertisement ? "Save Changes" : "Create Advertisement"}</Button></div></form></DialogContent></Dialog>;
}

export default function AdvertisementsPage() {
  const client = useQueryClient(); const [page, setPage] = useState(1); const [filter, setFilter] = useState<"all" | "active" | "inactive">("all"); const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Advertisement | null>(null); const pageSize = 9;
  const query = useQuery({ queryKey: ["advertisements"], queryFn: getAdvertisements });
  const remove = useMutation({ mutationFn: deleteAdvertisement, onSuccess: (r) => { toast.success(r.message); client.invalidateQueries({ queryKey: ["advertisements"] }); }, onError: (e) => toast.error(errorMessage(e)) });
  const toggle = useMutation({ mutationFn: (ad: Advertisement) => updateAdvertisement(ad._id, { isActive: !ad.isActive }), onSuccess: (r) => { toast.success(r.message); client.invalidateQueries({ queryKey: ["advertisements"] }); }, onError: (e) => toast.error(errorMessage(e)) });
  const filtered = (query.data || []).filter((ad) => filter === "all" || (filter === "active" ? ad.isActive : !ad.isActive)); const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)); const safePage = Math.min(page, totalPages); const ads = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  return <><div className="flex flex-wrap items-start gap-3"><PageHeading title="Advertisement" /><div className="ml-auto flex items-center gap-3"><label className="relative"><span className="sr-only">Filter advertisements</span><select value={filter} onChange={(e) => { setFilter(e.target.value as typeof filter); setPage(1); }} className="h-10 appearance-none rounded-full border border-black/10 bg-white pl-4 pr-10 text-sm shadow-sm"><option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select><Filter size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" /></label><Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} /><span className="hidden sm:inline">Create Advertisement</span></Button></div></div>
    {query.isLoading ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div> : <><section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{ads.map((ad) => <article key={ad._id} className="relative min-h-64 rounded-lg bg-[#ffce78] p-6 shadow-sm"><div className="flex items-start justify-between gap-3"><h2 className="text-base font-bold">{ad.title}</h2><div className="flex shrink-0 gap-2"><button className="grid size-8 place-items-center rounded-md bg-[#edf0f1]" title="Edit advertisement" aria-label="Edit advertisement" onClick={() => { setEditing(ad); setOpen(true); }}><Pencil size={17} /></button><button className="grid size-8 place-items-center rounded-md bg-[#edf0f1]" title="Delete advertisement" aria-label="Delete advertisement" onClick={() => { if (confirm(`Delete ${ad.title}?`)) remove.mutate(ad._id); }}><Trash2 size={17} /></button></div></div><div className="mt-5 grid grid-cols-[auto_1fr] gap-4 text-sm leading-6"><strong>Description:</strong><p>{ad.description}</p></div><button onClick={() => toggle.mutate(ad)} className="mt-4 text-xs font-bold text-brand underline-offset-2 hover:underline">{ad.isActive ? "Active" : "Inactive"}</button></article>)}</section>{!ads.length && <div className="rounded-lg bg-white p-16 text-center text-sm text-muted">No advertisements found.</div>}<div className="mt-5 rounded-lg bg-white shadow-sm"><Pagination page={safePage} totalPages={totalPages} total={filtered.length} pageSize={pageSize} onPage={setPage} /></div></>}
    <AdDialog open={open} onOpenChange={setOpen} advertisement={editing} />
  </>;
}
