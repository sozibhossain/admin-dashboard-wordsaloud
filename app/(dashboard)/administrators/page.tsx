"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, ShieldCheck, ShieldOff, UserCog } from "lucide-react";
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createAdministrator,
  getAdministrators,
  updateAdministrator,
  type AdministratorPayload,
} from "@/lib/api";
import type { AdminPermission, Administrator } from "@/lib/types";
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
  const [role, setRole] = useState<"admin" | "super-admin">("admin");
  const [permissions, setPermissions] = useState<AdminPermission[]>(["dashboard"]);
  const mutation = useMutation({
    mutationFn: createAdministrator,
    onSuccess: (response) => {
      toast.success(response.message);
      client.invalidateQueries({ queryKey: ["administrators"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: AdministratorPayload = {
      firstName: String(form.get("firstName") || ""),
      lastName: String(form.get("lastName") || ""),
      email: String(form.get("email") || ""),
      phoneNumber: String(form.get("phoneNumber") || ""),
      password: String(form.get("password") || ""),
      role,
      permissions: role === "super-admin" ? allPermissions : permissions,
    };
    mutation.mutate(payload);
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogTitle>Create administrator</DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted">Create a private dashboard account. There is no public admin sign-up.</DialogDescription>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name"><Input name="firstName" required /></Field>
          <Field label="Last name"><Input name="lastName" required /></Field>
          <Field label="Email address"><Input name="email" type="email" autoComplete="off" required /></Field>
          <Field label="Phone (optional)"><Input name="phoneNumber" type="tel" /></Field>
          <Field label="Initial password"><Input name="password" type="password" minLength={8} autoComplete="new-password" required /></Field>
          <Field label="Role"><select className="form-control" value={role} onChange={(event) => setRole(event.target.value as "admin" | "super-admin")}><option value="admin">Admin</option><option value="super-admin">Super-admin</option></select></Field>
        </div>
        <PermissionPicker role={role} permissions={permissions} onChange={setPermissions} />
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={mutation.isPending}>{mutation.isPending ? "Creating..." : "Create admin"}</Button></div>
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
  const query = useQuery({ queryKey: ["administrators"], queryFn: getAdministrators });
  const access = useMutation({
    mutationFn: ({ admin, isBlocked }: { admin: Administrator; isBlocked: boolean }) => updateAdministrator(admin._id, { isBlocked }),
    onSuccess: (response) => { toast.success(response.message); client.invalidateQueries({ queryKey: ["administrators"] }); },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return <>
    <PageHeading title="Admin Management" />
    <section className="mb-5 flex flex-col gap-4 rounded-lg border border-black/5 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="flex items-center gap-2 font-bold"><ShieldCheck className="text-brand" size={20} />Secure administrator access</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Create administrator accounts, assign only the permissions they need, or revoke access. This section is visible only to super-admins.</p></div>
      <Button className="shrink-0" onClick={() => setCreateOpen(true)}><Plus size={17} />Add administrator</Button>
    </section>

    <section className="overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm">
      {query.isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20" />)}</div> : query.isError ? <p className="p-10 text-center text-sm text-red-600">{errorMessage(query.error)}</p> : <>
        <div className="hidden md:block"><table className="w-full table-fixed"><thead className="bg-brand-soft text-left text-xs uppercase"><tr><th className="w-[34%] px-6 py-4">Administrator</th><th className="w-[18%] px-4 py-4">Role</th><th className="w-[28%] px-4 py-4">Permissions</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody>{query.data?.map((admin) => <tr key={admin._id} className="border-b border-black/5 last:border-0"><td className="px-6 py-4"><AdminIdentity admin={admin} /></td><td className="px-4 py-4"><RoleBadge admin={admin} /></td><td className="px-4 py-4"><PermissionSummary admin={admin} /></td><td className="px-6 py-4"><AdminActions admin={admin} currentId={session?.user._id} onEdit={setEditing} onAccess={(isBlocked) => access.mutate({ admin, isBlocked })} pending={access.isPending} /></td></tr>)}</tbody></table></div>
        <div className="divide-y divide-black/5 md:hidden">{query.data?.map((admin) => <article key={admin._id} className="space-y-4 p-4"><div className="flex items-start justify-between gap-3"><AdminIdentity admin={admin} /><RoleBadge admin={admin} /></div><PermissionSummary admin={admin} /><AdminActions admin={admin} currentId={session?.user._id} onEdit={setEditing} onAccess={(isBlocked) => access.mutate({ admin, isBlocked })} pending={access.isPending} /></article>)}</div>
        {!query.data?.length && <p className="p-12 text-center text-sm text-muted">No administrator accounts found.</p>}
      </>}
    </section>
    <CreateAdminDialog open={createOpen} onOpenChange={setCreateOpen} />
    <EditAdminDialog key={editing?._id || "closed"} admin={editing} onOpenChange={(open) => !open && setEditing(null)} />
  </>;
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

function AdminActions({ admin, currentId, onEdit, onAccess, pending }: { admin: Administrator; currentId?: string; onEdit: (admin: Administrator) => void; onAccess: (isBlocked: boolean) => void; pending: boolean }) {
  const isSelf = admin._id === currentId;
  return <div className="flex items-center justify-end gap-2"><Button size="sm" variant="outline" onClick={() => onEdit(admin)}><Pencil size={14} />Edit</Button><Button size="sm" variant={admin.isBlocked ? "default" : "danger"} disabled={pending || isSelf} title={isSelf ? "You cannot revoke your own access" : undefined} onClick={() => { const action = admin.isBlocked ? "restore" : "revoke"; if (confirm(`${action[0].toUpperCase() + action.slice(1)} access for ${fullName(admin)}?`)) onAccess(!admin.isBlocked); }}>{admin.isBlocked ? <><UserCog size={14} />Restore</> : <><ShieldOff size={14} />Revoke</>}</Button></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold"><span className="mb-2 block">{label}</span>{children}</label>;
}
