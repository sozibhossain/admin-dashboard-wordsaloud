"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Mail, Pencil, Plus, RefreshCw, ShieldCheck, ShieldOff, Trash2, UserCog } from "lucide-react";
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  bulkDeleteAdministrators,
  bulkRevokeAdministratorInvitations,
  createAdministrator,
  deleteAdministrator,
  getAdministrators,
  getAdministratorInvitations,
  resendAdministratorInvitation,
  revokeAdministratorInvitation,
  updateAdministrator,
  type AdministratorPayload,
} from "@/lib/api";
import type { AdminInvitation, AdminPermission, Administrator } from "@/lib/types";
import { cn, errorMessage, initials } from "@/lib/utils";

const permissionOptions: { value: AdminPermission; label: string; description: string }[] = [
  { value: "dashboard", label: "Dashboard overview", description: "View platform totals and registration activity." },
  { value: "users", label: "User management", description: "View, verify, block, delete, and manage VIP members." },
  { value: "verification", label: "Verification queue", description: "Approve or reject tradesman verification requests." },
  { value: "advertisements", label: "Advertisements", description: "Create, edit, activate, and remove advertisements." },
  { value: "reviews", label: "Review moderation", description: "Approve or reject customer reviews." },
  { value: "categories", label: "Trade categories", description: "Add, edit, reorder, and deactivate categories." },
  { value: "exports", label: "Data exports", description: "Download user and tradesman data as CSV." },
  { value: "audit", label: "Audit log", description: "View administrator activity history." },
  { value: "settings", label: "Platform settings", description: "Change VIP, advertising, and moderation defaults." },
];

const allPermissions = permissionOptions.map((permission) => permission.value);

function fullName(admin: Administrator) {
  return admin.name || `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || "Administrator";
}

function PermissionPicker({
  role,
  permissions,
  onChange,
}: {
  role: "admin" | "super-admin";
  permissions: AdminPermission[];
  onChange: (permissions: AdminPermission[]) => void;
}) {
  const selected = role === "super-admin" ? allPermissions : permissions;
  return <fieldset disabled={role === "super-admin"} className="space-y-2 disabled:opacity-65">
    <legend className="mb-2 text-sm font-semibold">Dashboard permissions</legend>
    {permissionOptions.map((permission) => {
      const checked = selected.includes(permission.value);
      return <label key={permission.value} className={cn("flex cursor-pointer items-start gap-3 rounded-md border p-3", checked ? "border-brand bg-brand-soft/50" : "border-black/10")}>
        <input
          type="checkbox"
          className="mt-1 size-4 accent-brand"
          checked={checked}
          onChange={(event) => onChange(event.target.checked
            ? [...permissions, permission.value]
            : permissions.filter((value) => value !== permission.value))}
        />
        <span><span className="block text-sm font-semibold">{permission.label}</span><span className="mt-0.5 block text-xs leading-5 text-muted">{permission.description}</span></span>
      </label>;
    })}
    {role === "super-admin" && <p className="text-xs text-muted">Super-admins always have every dashboard permission.</p>}
  </fieldset>;
}

function CreateAdminDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: createAdministrator,
    onSuccess: (response) => {
      if (response.data.acceptUrl && navigator.clipboard) {
        void navigator.clipboard.writeText(response.data.acceptUrl).catch(() => undefined);
        toast.success(`${response.message}. Development accept link copied`);
      } else {
        toast.success(response.message);
      }
      client.invalidateQueries({ queryKey: ["administrator-invitations"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: AdministratorPayload = { email: String(form.get("email") || "") };
    mutation.mutate(payload);
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogTitle>Invite administrator</DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted">We will email a secure, single-use link. The recipient verifies ownership by opening it and setting their own password.</DialogDescription>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <Field label="Email address"><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} /><Input name="email" type="email" autoComplete="off" required className="pl-11" placeholder="new.admin@example.com" /></div></Field>
        <p className="rounded-md bg-brand-soft p-3 text-xs leading-5 text-muted">Invited accounts start as administrators with dashboard-only access. After activation, you can assign additional permissions from this page.</p>
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={mutation.isPending}>{mutation.isPending ? "Sending..." : "Send invitation"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}

function EditAdminDialog({ admin, onOpenChange }: { admin: Administrator | null; onOpenChange: (open: boolean) => void }) {
  const client = useQueryClient();
  const [role, setRole] = useState<"admin" | "super-admin">(admin?.role || "admin");
  const [permissions, setPermissions] = useState<AdminPermission[]>(admin?.adminPermissions || []);

  const mutation = useMutation({
    mutationFn: () => updateAdministrator(admin!._id, { role, permissions: role === "super-admin" ? allPermissions : permissions }),
    onSuccess: (response) => {
      toast.success(response.message);
      client.invalidateQueries({ queryKey: ["administrators"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return <Dialog open={Boolean(admin)} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogTitle>Edit administrator</DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted">Change the role and dashboard access for {admin ? fullName(admin) : "this administrator"}.</DialogDescription>
      <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="mt-6 space-y-5">
        <div className="rounded-md border border-black/10 bg-black/[0.02] p-4"><p className="font-semibold">{admin && fullName(admin)}</p><p className="mt-1 text-sm text-muted">{admin?.email}</p></div>
        <Field label="Role"><select className="form-control" value={role} onChange={(event) => setRole(event.target.value as "admin" | "super-admin")}><option value="admin">Admin</option><option value="super-admin">Super-admin</option></select></Field>
        <PermissionPicker role={role} permissions={permissions} onChange={setPermissions} />
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save changes"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}

export default function AdministratorsPage() {
  const { data: session } = useSession();
  const client = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Administrator | null>(null);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [selectedInvitations, setSelectedInvitations] = useState<string[]>([]);
  const query = useQuery({ queryKey: ["administrators"], queryFn: getAdministrators });
  const invitations = useQuery({ queryKey: ["administrator-invitations"], queryFn: getAdministratorInvitations });
  const access = useMutation({
    mutationFn: ({ admin, isBlocked }: { admin: Administrator; isBlocked: boolean }) => updateAdministrator(admin._id, { isBlocked }),
    onSuccess: (response) => { toast.success(response.message); client.invalidateQueries({ queryKey: ["administrators"] }); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const resend = useMutation({ mutationFn: resendAdministratorInvitation, onSuccess: (response) => { toast.success(response.message); client.invalidateQueries({ queryKey: ["administrator-invitations"] }); }, onError: (error) => toast.error(errorMessage(error)) });
  const revoke = useMutation({ mutationFn: revokeAdministratorInvitation, onSuccess: (response) => { toast.success(response.message); client.invalidateQueries({ queryKey: ["administrator-invitations"] }); }, onError: (error) => toast.error(errorMessage(error)) });
  const remove = useMutation({ mutationFn: deleteAdministrator, onSuccess: (response) => { toast.success(response.message); client.invalidateQueries({ queryKey: ["administrators"] }); }, onError: (error) => toast.error(errorMessage(error)) });
  const bulkRemove = useMutation({ mutationFn: () => bulkDeleteAdministrators(selectedAdmins), onSuccess: (response) => { toast.success(response.message); setSelectedAdmins([]); client.invalidateQueries({ queryKey: ["administrators"] }); }, onError: (error) => toast.error(errorMessage(error)) });
  const bulkRevoke = useMutation({ mutationFn: () => bulkRevokeAdministratorInvitations(selectedInvitations), onSuccess: (response) => { toast.success(response.message); setSelectedInvitations([]); client.invalidateQueries({ queryKey: ["administrator-invitations"] }); }, onError: (error) => toast.error(errorMessage(error)) });
  const adminRows = query.data || [];
  const selectableAdmins = adminRows.filter((admin) => admin.role === "admin" && admin._id !== session?.user._id);
  const allAdminsSelected = selectableAdmins.length > 0 && selectableAdmins.every((admin) => selectedAdmins.includes(admin._id));

  return <>
    <PageHeading title="Admin Management" />
    <section className="mb-5 flex flex-col gap-4 rounded-lg border border-black/5 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="flex items-center gap-2 font-bold"><ShieldCheck className="text-brand" size={20} />Secure administrator access</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Create administrator accounts, assign only the permissions they need, or revoke access. This section is visible only to super-admins.</p></div>
      <Button className="shrink-0" onClick={() => setCreateOpen(true)}><Plus size={17} />Invite administrator</Button>
    </section>

    <InvitationList invitations={invitations.data || []} loading={invitations.isLoading} error={invitations.error} pending={resend.isPending || revoke.isPending || bulkRevoke.isPending} selectedIds={selectedInvitations} onSelectedIds={setSelectedInvitations} onBulkRevoke={() => { if (confirm(`Revoke ${selectedInvitations.length} selected invitations?`)) bulkRevoke.mutate(); }} onResend={(invitation) => resend.mutate(invitation._id)} onRevoke={(invitation) => { if (confirm(`Revoke the invitation for ${invitation.email}?`)) revoke.mutate(invitation._id); }} />

    <section className="overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm">
      {selectedAdmins.length > 0 && <div className="flex justify-end border-b border-black/5 p-3"><Button size="sm" variant="danger" disabled={bulkRemove.isPending} onClick={() => { if (confirm(`Permanently delete ${selectedAdmins.length} selected administrators?`)) bulkRemove.mutate(); }}><Trash2 size={15} />{bulkRemove.isPending ? "Deleting..." : `Delete ${selectedAdmins.length}`}</Button></div>}
      {query.isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20" />)}</div> : query.isError ? <p className="p-10 text-center text-sm text-red-600">{errorMessage(query.error)}</p> : <>
        <div className="hidden md:block"><table className="w-full table-fixed"><thead className="bg-brand-soft text-left text-xs uppercase"><tr><th className="w-12 px-5 py-4"><input type="checkbox" checked={allAdminsSelected} onChange={() => setSelectedAdmins(allAdminsSelected ? [] : selectableAdmins.map((admin) => admin._id))} aria-label="Select all deletable administrators" /></th><th className="w-[30%] px-6 py-4">Administrator</th><th className="w-[15%] px-4 py-4">Role</th><th className="w-[27%] px-4 py-4">Permissions</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody>{adminRows.map((admin) => <tr key={admin._id} className="border-b border-black/5 last:border-0"><td className="px-5 py-4"><input type="checkbox" checked={selectedAdmins.includes(admin._id)} disabled={admin.role === "super-admin" || admin._id === session?.user._id} onChange={() => setSelectedAdmins((current) => current.includes(admin._id) ? current.filter((id) => id !== admin._id) : [...current, admin._id])} aria-label={`Select ${fullName(admin)}`} /></td><td className="px-6 py-4"><AdminIdentity admin={admin} /></td><td className="px-4 py-4"><RoleBadge admin={admin} /></td><td className="px-4 py-4"><PermissionSummary admin={admin} /></td><td className="px-6 py-4"><AdminActions admin={admin} currentId={session?.user._id} onEdit={setEditing} onAccess={(isBlocked) => access.mutate({ admin, isBlocked })} onDelete={() => { if (confirm(`Permanently delete ${fullName(admin)}?`)) remove.mutate(admin._id); }} pending={access.isPending || remove.isPending} /></td></tr>)}</tbody></table></div>
        <div className="divide-y divide-black/5 md:hidden">{adminRows.map((admin) => <article key={admin._id} className="space-y-4 p-4"><div className="flex items-start justify-between gap-3"><label className="flex items-start gap-2"><input type="checkbox" className="mt-3" checked={selectedAdmins.includes(admin._id)} disabled={admin.role === "super-admin" || admin._id === session?.user._id} onChange={() => setSelectedAdmins((current) => current.includes(admin._id) ? current.filter((id) => id !== admin._id) : [...current, admin._id])} /><AdminIdentity admin={admin} /></label><RoleBadge admin={admin} /></div><PermissionSummary admin={admin} /><AdminActions admin={admin} currentId={session?.user._id} onEdit={setEditing} onAccess={(isBlocked) => access.mutate({ admin, isBlocked })} onDelete={() => { if (confirm(`Permanently delete ${fullName(admin)}?`)) remove.mutate(admin._id); }} pending={access.isPending || remove.isPending} /></article>)}</div>
        {!query.data?.length && <p className="p-12 text-center text-sm text-muted">No administrator accounts found.</p>}
      </>}
    </section>
    <CreateAdminDialog open={createOpen} onOpenChange={setCreateOpen} />
    <EditAdminDialog key={editing?._id || "closed"} admin={editing} onOpenChange={(open) => !open && setEditing(null)} />
  </>;
}

function InvitationList({ invitations, loading, error, pending, selectedIds, onSelectedIds, onBulkRevoke, onResend, onRevoke }: { invitations: AdminInvitation[]; loading: boolean; error: unknown; pending: boolean; selectedIds: string[]; onSelectedIds: (ids: string[]) => void; onBulkRevoke: () => void; onResend: (invitation: AdminInvitation) => void; onRevoke: (invitation: AdminInvitation) => void }) {
  if (!loading && !error && !invitations.length) return null;
  const allSelected = invitations.length > 0 && invitations.every((invitation) => selectedIds.includes(invitation._id));
  return <section className="mb-5 overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm"><div className="flex flex-wrap items-center gap-3 border-b border-black/5 px-5 py-4"><div><h2 className="font-bold">Pending invitations</h2><p className="mt-1 text-xs text-muted">Invitation links are single-use and expire automatically.</p></div>{selectedIds.length > 0 && <Button className="ml-auto" size="sm" variant="danger" disabled={pending} onClick={onBulkRevoke}><Trash2 size={14} />Revoke {selectedIds.length}</Button>}</div>{loading ? <div className="space-y-2 p-4"><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : error ? <p className="p-6 text-sm text-red-600">{errorMessage(error)}</p> : <><label className="flex items-center gap-2 border-b border-black/5 px-4 py-3 text-xs font-semibold"><input type="checkbox" checked={allSelected} onChange={() => onSelectedIds(allSelected ? [] : invitations.map((invitation) => invitation._id))} />Select all invitations</label><div className="divide-y divide-black/5">{invitations.map((invitation) => <article key={invitation._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><input type="checkbox" checked={selectedIds.includes(invitation._id)} onChange={() => onSelectedIds(selectedIds.includes(invitation._id) ? selectedIds.filter((id) => id !== invitation._id) : [...selectedIds, invitation._id])} aria-label={`Select invitation for ${invitation.email}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{invitation.email}</p><p className="mt-1 text-xs text-muted"><span className="capitalize">{invitation.status}</span> · Expires {new Date(invitation.expiresAt).toLocaleString()}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" disabled={pending} onClick={() => onResend(invitation)}><RefreshCw size={14} />Resend</Button><Button size="sm" variant="danger" disabled={pending} onClick={() => onRevoke(invitation)}><Trash2 size={14} />Revoke</Button></div></article>)}</div></>}</section>;
}

function AdminIdentity({ admin }: { admin: Administrator }) {
  return <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/70 text-sm font-bold">{initials(fullName(admin))}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{fullName(admin)}</p><p className="truncate text-xs text-muted">{admin.email}</p>{admin.isBlocked && <p className="mt-1 text-xs font-semibold text-red-600">Access revoked</p>}</div></div>;
}

function RoleBadge({ admin }: { admin: Administrator }) {
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", admin.role === "super-admin" ? "bg-brand text-white" : "bg-black/5 text-ink")}>{admin.role === "super-admin" ? "Super-admin" : "Admin"}</span>;
}

function PermissionSummary({ admin }: { admin: Administrator }) {
  const permissions = admin.role === "super-admin" ? allPermissions : admin.adminPermissions;
  return <div className="flex flex-wrap gap-1.5">{permissions.length ? permissions.map((permission) => <span key={permission} className="inline-flex items-center gap-1 rounded-full bg-[#eef6f1] px-2.5 py-1 text-[11px] font-semibold capitalize text-[#28734b]"><Check size={12} />{permission}</span>) : <span className="text-xs text-muted">Settings only</span>}</div>;
}

function AdminActions({ admin, currentId, onEdit, onAccess, onDelete, pending }: { admin: Administrator; currentId?: string; onEdit: (admin: Administrator) => void; onAccess: (isBlocked: boolean) => void; onDelete: () => void; pending: boolean }) {
  const isSelf = admin._id === currentId;
  const canDelete = admin.role === "admin" && !isSelf;
  return <div className="flex flex-wrap items-center justify-end gap-2"><Button size="sm" variant="outline" onClick={() => onEdit(admin)}><Pencil size={14} />Edit</Button><Button size="sm" variant={admin.isBlocked ? "default" : "danger"} disabled={pending || isSelf} title={isSelf ? "You cannot revoke your own access" : undefined} onClick={() => { const action = admin.isBlocked ? "restore" : "revoke"; if (confirm(`${action[0].toUpperCase() + action.slice(1)} access for ${fullName(admin)}?`)) onAccess(!admin.isBlocked); }}>{admin.isBlocked ? <><UserCog size={14} />Restore</> : <><ShieldOff size={14} />Revoke</>}</Button><Button size="sm" variant="danger" disabled={pending || !canDelete} title={!canDelete ? "Super-admin and current accounts cannot be deleted" : undefined} onClick={onDelete}><Trash2 size={14} />Delete</Button></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold"><span className="mb-2 block">{label}</span>{children}</label>;
}
