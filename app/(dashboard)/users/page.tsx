"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, Download, Eye, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { bulkUserAction, createVip, deleteUser, exportUsers, getOptions, getUsers, toggleUserBlock, updateVerification, type VipPayload } from "@/lib/api";
import type { User } from "@/lib/types";
import { cn, errorMessage, initials } from "@/lib/utils";

const tabs = [{ key: "all", label: "All Users" }, { key: "client", label: "Client" }, { key: "tradesman", label: "Tradesman" }, { key: "vip", label: "VIP" }];
function nameOf(user: User) { return user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed member"; }

function VipDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [pitch, setPitch] = useState("");
  const [rateAmount, setRateAmount] = useState("");
  const [rateUnit, setRateUnit] = useState("Per day");
  const [tradesmanListOpen, setTradesmanListOpen] = useState(false);
  const [tradesmanSearch, setTradesmanSearch] = useState("");
  const tradesmenQuery = useQuery({
    queryKey: ["vip-tradesmen"],
    queryFn: () => getUsers({ type: "tradesman", page: 1, limit: 1000 }),
    enabled: open,
  });
  const optionsQuery = useQuery({ queryKey: ["options"], queryFn: getOptions, enabled: open });
  const selectedTradesman = tradesmenQuery.data?.users.find((user) => user._id === selectedId);
  const profile = selectedTradesman?.tradesmanProfile;
  const normalizedSearch = tradesmanSearch.trim().toLowerCase();
  const filteredTradesmen = tradesmenQuery.data?.users.filter((user) => {
    if (!normalizedSearch) return true;
    return [nameOf(user), user.email, user.tradesmanProfile?.mainSkill]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedSearch));
  });
  const mutation = useMutation({
    mutationFn: createVip,
    onSuccess: (response) => {
      toast.success(response.message);
      client.invalidateQueries({ queryKey: ["users"] });
      setSelectedId("");
      setPitch("");
      setRateAmount("");
      setRateUnit("Per day");
      setTradesmanListOpen(false);
      setTradesmanSearch("");
      onOpenChange(false);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedId("");
      setPitch("");
      setRateAmount("");
      setRateUnit("Per day");
      setTradesmanListOpen(false);
      setTradesmanSearch("");
    }
    onOpenChange(nextOpen);
  }

  function selectTradesman(userId: string) {
    const tradesman = tradesmenQuery.data?.users.find((user) => user._id === userId);
    const typicalRate = tradesman?.tradesmanProfile?.typicalRate;
    setSelectedId(userId);
    setPitch(tradesman?.tradesmanProfile?.pitch || "");
    setRateAmount(typicalRate?.amount === undefined ? "" : String(typicalRate.amount));
    setRateUnit(typicalRate?.unit || "Per day");
    setTradesmanListOpen(false);
    setTradesmanSearch("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form) as unknown as VipPayload;
    payload.rateAmount = Number(form.get("rateAmount"));
    mutation.mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>Add VIP Member</DialogTitle>
        <form key={selectedId || "no-tradesman"} onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <span className="mb-2 block text-sm font-medium">Member Type</span>
            <div className="relative">
              <input type="hidden" name="userId" value={selectedId} />
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={tradesmanListOpen}
                disabled={tradesmenQuery.isLoading || !tradesmenQuery.data?.users.length}
                onClick={() => {
                  setTradesmanListOpen((current) => !current);
                  setTradesmanSearch("");
                }}
                className="form-control flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:bg-black/[0.03]"
              >
                <span className={cn("truncate", !selectedTradesman && "text-[#a4a4a4]")}>
                  {tradesmenQuery.isLoading
                    ? "Loading tradesmen..."
                    : selectedTradesman
                      ? `${nameOf(selectedTradesman)} - ${selectedTradesman.email}${selectedTradesman.tradesmanProfile?.mainSkill ? ` - ${selectedTradesman.tradesmanProfile.mainSkill}` : ""}`
                      : "Select a tradesman"}
                </span>
                <ChevronDown size={18} className={cn("shrink-0 transition-transform", tradesmanListOpen && "rotate-180")} />
              </button>
              {tradesmanListOpen && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-black/15 bg-white shadow-lg">
                  <div className="border-b border-black/10 p-2">
                    <div className="flex items-center gap-2 rounded-md border border-[#cbd5e1] px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10">
                      <Search size={16} className="shrink-0 text-muted" />
                      <input
                        autoFocus
                        type="search"
                        value={tradesmanSearch}
                        onChange={(event) => setTradesmanSearch(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") setTradesmanListOpen(false);
                        }}
                        placeholder="Search by name, email or skill"
                        className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a4a4a4]"
                      />
                    </div>
                  </div>
                  <div role="listbox" aria-label="Tradesmen" className="max-h-52 overflow-y-auto overscroll-contain py-1">
                    {filteredTradesmen?.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        role="option"
                        aria-selected={user._id === selectedId}
                        onClick={() => selectTradesman(user._id)}
                        className={cn("block w-full px-4 py-3 text-left text-sm hover:bg-brand-soft", user._id === selectedId && "bg-brand-soft text-brand")}
                      >
                        <span className="block truncate font-medium">{nameOf(user)}</span>
                        <span className="block truncate text-xs text-muted">{user.email}{user.tradesmanProfile?.mainSkill ? ` - ${user.tradesmanProfile.mainSkill}` : ""}</span>
                      </button>
                    ))}
                    {!filteredTradesmen?.length && <p className="px-4 py-6 text-center text-sm text-muted">No tradesmen match your search.</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
          {tradesmenQuery.isError && <p className="text-sm text-red-600">Could not load tradesmen. Please try again.</p>}
          {!tradesmenQuery.isLoading && !tradesmenQuery.isError && !tradesmenQuery.data?.users.length && <p className="text-sm text-muted">No tradesmen found.</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Home Area">
              <Input name="homeArea" required disabled={!selectedTradesman} defaultValue={profile?.homeArea || ""} placeholder="San Fernando" />
            </Field>
            <Field label="Main Skill">
              <select name="mainSkill" required disabled={!selectedTradesman} defaultValue={profile?.mainSkill || ""} className="form-control">
                <option value="" disabled>Select a skill</option>
                {optionsQuery.data?.skills.map((skill) => <option key={skill}>{skill}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Travel Range">
            <div className="grid gap-2">
              {["5km - Local only", "Trinidad wide", "T&T wide"].map((range) => (
                <label key={range} className="flex cursor-pointer items-center justify-between rounded-md border border-black/20 px-4 py-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                  <span>{range}</span>
                  <input type="radio" name="travelRange" value={range} required disabled={!selectedTradesman} defaultChecked={profile?.travelRange === range} className="size-4 accent-brand" />
                </label>
              ))}
            </div>
          </Field>
          <Field label={`Pitch ${pitch.length}/140`}>
            <textarea name="pitch" maxLength={140} required disabled={!selectedTradesman} value={pitch} onChange={(event) => setPitch(event.target.value)} className="form-control min-h-24 resize-none" placeholder="A short introduction" />
          </Field>
          <Field label="Typical Rate">
            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <Input name="rateAmount" type="number" min="0" required disabled={!selectedTradesman} value={rateAmount} onChange={(event) => setRateAmount(event.target.value)} placeholder="TT$ amount" />
              <select name="rateUnit" disabled={!selectedTradesman} value={rateUnit} onChange={(event) => setRateUnit(event.target.value)} className="form-control">
                <option>Per day</option><option>Per hour</option><option>Per job</option>
              </select>
            </div>
          </Field>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button disabled={!selectedTradesman || mutation.isPending}>{mutation.isPending ? "Creating..." : "Create New Member"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-medium"><span className="mb-2 block">{label}</span>{children}</label>; }

function DetailItem({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{children}</dd></div>;
}

function yesNo(value?: boolean) { return value ? "Yes" : "No"; }

function formatDate(value?: string | null) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function UsersPage() {
  const client = useQueryClient(); const { data: session } = useSession(); const [type, setType] = useState("all"); const [page, setPage] = useState(1); const [vipOpen, setVipOpen] = useState(false); const [selected, setSelected] = useState<User | null>(null); const [selectedIds, setSelectedIds] = useState<string[]>([]); const [searchInput, setSearchInput] = useState(""); const [search, setSearch] = useState(""); const limit = 8;
  const query = useQuery({ queryKey: ["users", type, page, search], queryFn: () => getUsers({ type, page, limit, search }), placeholderData: keepPreviousData });
  const refresh = () => client.invalidateQueries({ queryKey: ["users"] });
  const block = useMutation({ mutationFn: toggleUserBlock, onSuccess: (r) => { toast.success(r.message); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });
  const remove = useMutation({ mutationFn: deleteUser, onSuccess: (r) => { toast.success(r.message); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });
  const verify = useMutation({ mutationFn: ({ id }: { id: string }) => updateVerification(id, "verified"), onSuccess: (r) => { toast.success(r.message); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });
  const bulk = useMutation({ mutationFn: (action: "block" | "unblock" | "delete") => bulkUserAction({ ids: selectedIds, action }), onSuccess: (r) => { toast.success(r.message); setSelectedIds([]); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });
  function actions(user: User) { return <div className="flex items-center justify-end gap-2"><button title={user.isBlocked ? "Activate user" : "Block user"} aria-label={user.isBlocked ? "Activate user" : "Block user"} className={cn("text-green-600", user.isBlocked && "text-amber-600")} onClick={() => block.mutate(user._id)}><ShieldCheck size={17} /></button>{user.tradesmanProfile?.verificationStatus === "pending" && <button title="Verify tradesman" aria-label="Verify tradesman" className="text-green-600" onClick={() => verify.mutate({ id: user.tradesmanProfile!._id })}><CheckCircle2 size={17} /></button>}<button title="View member" aria-label="View member" className="text-blue-500" onClick={() => setSelected(user)}><Eye size={17} /></button><button title="Delete member" aria-label="Delete member" className="text-red-500" onClick={() => { if (confirm(`Delete ${nameOf(user)}?`)) remove.mutate(user._id); }}><Trash2 size={17} /></button></div>; }
  const canExport = session?.user.role === "super-admin" || session?.user.permissions?.includes("exports");
  const rows = query.data?.users || []; const allSelected = rows.length > 0 && rows.every((user) => selectedIds.includes(user._id));
  return <><PageHeading title="User List" /><div className="mb-4 space-y-3"><div className="flex flex-wrap items-center gap-2">{tabs.map((tab) => <button key={tab.key} onClick={() => { setType(tab.key); setPage(1); setSelectedIds([]); }} className={cn("h-10 rounded-full border border-black/10 bg-white px-4 text-sm shadow-sm", type === tab.key && "border-brand bg-brand text-white")}>{tab.label}</button>)}{type === "vip" && <Button size="sm" className="ml-auto" onClick={() => setVipOpen(true)}><Plus size={16} />Add VIP Member</Button>}</div><div className="flex flex-wrap gap-2 rounded-lg bg-white p-3 shadow-sm"><form onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); setPage(1); }} className="flex min-w-[260px] flex-1 gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} /><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name, email, phone, or skill" className="pl-9" /></div><Button size="sm">Search</Button></form>{canExport && <Button size="sm" variant="outline" onClick={() => exportUsers({ type, search }).catch((error) => toast.error(errorMessage(error)))}><Download size={15} />Export CSV</Button>}{selectedIds.length > 0 && <><Button size="sm" variant="outline" onClick={() => bulk.mutate("block")}>Block {selectedIds.length}</Button><Button size="sm" variant="outline" onClick={() => bulk.mutate("unblock")}>Activate</Button><Button size="sm" variant="danger" onClick={() => { if (confirm(`Delete ${selectedIds.length} selected users?`)) bulk.mutate("delete"); }}>Delete</Button></>}</div></div>
    <section className="overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm">
      {query.isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div> : query.isError ? <p className="p-10 text-center text-red-600">{errorMessage(query.error)}</p> : <>
        <div className="hidden md:block"><table className="w-full table-fixed"><thead className="bg-brand-soft text-left"><tr><th className="w-12 px-5 py-4"><input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? [] : rows.map((user) => user._id))} aria-label="Select all users" /></th><th className="w-[42%] px-4 py-4">MEMBER</th><th className="w-[25%] px-4 py-4 text-center">TYPE</th><th className="px-7 py-4 text-right">ACTIONS</th></tr></thead><tbody>{rows.map((user) => <tr key={user._id} className="border-b border-black/5"><td className="px-5 py-3"><input type="checkbox" checked={selectedIds.includes(user._id)} onChange={() => setSelectedIds((current) => current.includes(user._id) ? current.filter((id) => id !== user._id) : [...current, user._id])} aria-label={`Select ${nameOf(user)}`} /></td><td className="px-4 py-[18px]"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f0f1f4] text-xs font-bold">{initials(nameOf(user)).slice(0, 1)}</span><div className="min-w-0"><div className="truncate text-sm font-bold">{nameOf(user)}</div><div className="truncate text-sm text-[#a0a7b4]">{user.email}</div></div></div></td><td className="px-4 py-3 text-center"><div className="text-sm font-bold capitalize">{user.role}</div>{user.tradesmanProfile?.mainSkill && <div className="text-[11px] text-muted">{user.tradesmanProfile.mainSkill}</div>}</td><td className="px-7 py-3">{actions(user)}</td></tr>)}</tbody></table></div>
        <div className="divide-y divide-black/5 md:hidden">{query.data?.users.map((user) => <article key={user._id} className="p-4"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f0f1f4] text-xs font-bold">{initials(nameOf(user)).slice(0, 1)}</span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold">{nameOf(user)}</h3><p className="truncate text-xs text-muted">{user.email}</p><p className="mt-1 text-xs capitalize">{user.role}</p></div>{actions(user)}</div></article>)}</div>
        {!query.data?.users.length && <p className="p-12 text-center text-sm text-muted">No members found.</p>}<Pagination page={query.data?.meta.page || 1} totalPages={query.data?.meta.totalPages || 1} total={query.data?.meta.total || 0} pageSize={limit} onPage={setPage} />
      </>}
    </section><VipDialog open={vipOpen} onOpenChange={setVipOpen} />
    <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Member details</DialogTitle>
        {selected && <div className="mt-6 space-y-5">
          <div className="flex items-center gap-4 rounded-md border border-[#d9e8f2] p-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent text-xl font-bold">{initials(nameOf(selected))}</span>
            <div className="min-w-0">
              <h3 className="truncate font-bold">{nameOf(selected)}</h3>
              <p className="text-sm capitalize text-muted">{selected.role} · {selected.isBlocked ? "Blocked" : "Active"}</p>
            </div>
          </div>

          <section className="rounded-md border border-black/10 p-4">
            <h4 className="mb-4 font-bold">Account information</h4>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <DetailItem label="First name">{selected.firstName || "Not provided"}</DetailItem>
              <DetailItem label="Last name">{selected.lastName || "Not provided"}</DetailItem>
              <DetailItem label="Email">{selected.email}</DetailItem>
              <DetailItem label="Phone">{selected.phoneNumber || "Not provided"}</DetailItem>
              <DetailItem label="Role"><span className="capitalize">{selected.role}</span></DetailItem>
              <DetailItem label="Area">{selected.area || "Not provided"}</DetailItem>
              <DetailItem label="Account status">{selected.isBlocked ? "Blocked" : "Active"}</DetailItem>
              <DetailItem label="Email verified">{yesNo(selected.isEmailVerified)}</DetailItem>
              <DetailItem label="Profile complete">{yesNo(selected.isProfileComplete)}</DetailItem>
              <DetailItem label="Profile image">{selected.profileImage?.url ? <a href={selected.profileImage.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">View image</a> : "Not provided"}</DetailItem>
              <DetailItem label="Image asset ID"><span className="font-mono text-xs">{selected.profileImage?.public_id || "Not provided"}</span></DetailItem>
              <DetailItem label="Joined">{formatDate(selected.createdAt)}</DetailItem>
              <DetailItem label="Last updated">{formatDate(selected.updatedAt)}</DetailItem>
              <DetailItem label="User ID" className="sm:col-span-2"><span className="font-mono text-xs">{selected._id}</span></DetailItem>
            </dl>
          </section>

          {selected.tradesmanProfile && <>
            <section className="rounded-md border border-black/10 p-4">
              <h4 className="mb-4 font-bold">Tradesman profile</h4>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <DetailItem label="Main skill">{selected.tradesmanProfile.mainSkill || "Not provided"}</DetailItem>
                <DetailItem label="Extra skills">{selected.tradesmanProfile.extraSkills?.length ? selected.tradesmanProfile.extraSkills.join(", ") : "None"}</DetailItem>
                <DetailItem label="Home area">{selected.tradesmanProfile.homeArea || "Not provided"}</DetailItem>
                <DetailItem label="Travel range">{selected.tradesmanProfile.travelRange || "Not provided"}</DetailItem>
                <DetailItem label="Typical rate">{selected.tradesmanProfile.typicalRate ? `TT$ ${selected.tradesmanProfile.typicalRate.amount} · ${selected.tradesmanProfile.typicalRate.unit}` : "Not provided"}</DetailItem>
                <DetailItem label="Verification"><span className="capitalize">{selected.tradesmanProfile.verificationStatus || "Not provided"}</span></DetailItem>
                <DetailItem label="VIP member">{yesNo(selected.tradesmanProfile.isVip)}</DetailItem>
                <DetailItem label="Live profile">{yesNo(selected.tradesmanProfile.isLive)}</DetailItem>
                <DetailItem label="Average rating">{selected.tradesmanProfile.ratingAverage ?? 0}</DetailItem>
                <DetailItem label="Rating count">{selected.tradesmanProfile.ratingCount ?? 0}</DetailItem>
                <DetailItem label="Jobs completed">{selected.tradesmanProfile.jobsCount ?? 0}</DetailItem>
                <DetailItem label="Work photos">{selected.tradesmanProfile.workPhotos?.filter((photo) => photo.url).length || 0}</DetailItem>
                <DetailItem label="Pitch" className="sm:col-span-2">{selected.tradesmanProfile.pitch || "Not provided"}</DetailItem>
                <DetailItem label="Profile created">{formatDate(selected.tradesmanProfile.createdAt)}</DetailItem>
                <DetailItem label="Profile updated">{formatDate(selected.tradesmanProfile.updatedAt)}</DetailItem>
                <DetailItem label="Profile ID" className="sm:col-span-2"><span className="font-mono text-xs">{selected.tradesmanProfile._id}</span></DetailItem>
              </dl>
            </section>

            {selected.tradesmanProfile.workPhotos?.some((photo) => photo.url) && <section className="rounded-md border border-black/10 p-4">
              <h4 className="mb-4 font-bold">Work photos</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selected.tradesmanProfile.workPhotos.filter((photo) => photo.url).map((photo, index) => <a key={photo.public_id || photo.url} href={photo.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-md border border-black/10 bg-black/[0.02]">
                  {/* External work-photo hosts are dynamic, so a native image avoids hostname restrictions. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={`Work photo ${index + 1}`} loading="lazy" className="h-32 w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                  <span className="block px-3 py-2 text-center text-xs font-medium text-brand">View full image</span>
                </a>)}
              </div>
            </section>}

            {selected.tradesmanProfile.contactChangeRequest && <section className="rounded-md border border-black/10 p-4">
              <h4 className="mb-4 font-bold">Contact change request</h4>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <DetailItem label="Status"><span className="capitalize">{selected.tradesmanProfile.contactChangeRequest.status || "None"}</span></DetailItem>
                <DetailItem label="Requested at">{formatDate(selected.tradesmanProfile.contactChangeRequest.requestedAt)}</DetailItem>
                <DetailItem label="Requested name">{selected.tradesmanProfile.contactChangeRequest.requestedName || "Not provided"}</DetailItem>
                <DetailItem label="Requested phone">{selected.tradesmanProfile.contactChangeRequest.requestedPhoneNumber || "Not provided"}</DetailItem>
                <DetailItem label="Reason" className="sm:col-span-2">{selected.tradesmanProfile.contactChangeRequest.reason || "Not provided"}</DetailItem>
              </dl>
            </section>}
          </>}
        </div>}
      </DialogContent>
    </Dialog>
  </>;
}
