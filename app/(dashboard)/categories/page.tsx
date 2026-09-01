"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { bulkDeleteCategories, createCategory, deleteCategory, getCategoriesAdminPage, updateCategory } from "@/lib/api";
import type { Category } from "@/lib/types";
import { errorMessage } from "@/lib/utils";

function CategoryIcon({ icon, name }: { icon: string; name: string }) {
  // Category icon URLs are administrator-managed and may use any HTTPS host.
  // eslint-disable-next-line @next/next/no-img-element
  if (/^https:\/\//i.test(icon)) return <img src={icon} alt="" className="size-9 rounded-md object-contain" />;
  return <span className="text-2xl" role="img" aria-label={`${name} icon`}>{icon || "🛠️"}</span>;
}

export default function CategoriesPage() {
  const client = useQueryClient();
  const [editing, setEditing] = useState<Category | null | "new">(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const limit = 10;
  const query = useQuery({ queryKey: ["categories-admin", page], queryFn: () => getCategoriesAdminPage({ page, limit }), placeholderData: keepPreviousData });
  const refresh = () => {
    client.invalidateQueries({ queryKey: ["categories-admin"] });
    client.invalidateQueries({ queryKey: ["categories"] });
  };
  const save = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: { name: string; icon: string; order?: number } }) => id ? updateCategory(id, payload) : createCategory(payload),
    onSuccess: (response) => { toast.success(response.message); refresh(); setEditing(null); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const toggle = useMutation({
    mutationFn: (category: Category) => updateCategory(category._id, { isActive: !category.isActive }),
    onSuccess: (response) => { toast.success(response.message); refresh(); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: deleteCategory,
    onSuccess: (response) => { toast.success(response.message); if ((query.data?.categories.length || 0) === 1 && page > 1) setPage((current) => current - 1); refresh(); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const bulkRemove = useMutation({
    mutationFn: () => bulkDeleteCategories(selectedIds),
    onSuccess: (response) => { toast.success(response.message); if (selectedIds.length >= (query.data?.categories.length || 0) && page > 1) setPage((current) => current - 1); setSelectedIds([]); refresh(); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const category = editing === "new" ? null : editing;
  const rows = query.data?.categories || [];
  const selectableRows = rows.filter((item) => item.tradesmanCount === 0);
  const allSelected = selectableRows.length > 0 && selectableRows.every((item) => selectedIds.includes(item._id));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    save.mutate({ id: category?._id, payload: { name: String(form.get("name") || ""), icon: String(form.get("icon") || ""), ...(category ? { order: Number(form.get("order")) } : {}) } });
  }

  return <>
    <div className="flex flex-wrap items-start gap-3"><PageHeading title="Trade Categories" /><div className="ml-auto flex gap-2">{selectedIds.length > 0 && <Button size="sm" variant="danger" disabled={bulkRemove.isPending} onClick={() => { if (confirm(`Delete ${selectedIds.length} selected categories?`)) bulkRemove.mutate(); }}><Trash2 size={15} />{bulkRemove.isPending ? "Deleting..." : `Delete ${selectedIds.length}`}</Button>}<Button size="sm" onClick={() => setEditing("new")}><Plus size={16} />Add Category</Button></div></div>
    <section className="overflow-hidden rounded-lg bg-white shadow-sm">
      {query.isLoading ? <p className="p-10 text-center text-muted">Loading categories...</p> : query.isError ? <p className="p-10 text-center text-red-600">{errorMessage(query.error)}</p> : <>
        <div className="overflow-x-auto"><table className="w-full min-w-[780px]">
          <thead className="bg-brand-soft text-left text-xs uppercase"><tr><th className="w-12 px-5 py-4"><input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? [] : selectableRows.map((item) => item._id))} aria-label="Select all deletable categories on this page" /></th><th className="px-4 py-4">Order</th><th className="px-4 py-4">Icon</th><th className="px-4 py-4">Category</th><th className="px-4 py-4">Tradesmen</th><th className="px-4 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
          <tbody>{rows.map((item) => <tr key={item._id} className="border-b border-black/5">
            <td className="px-5 py-4"><input type="checkbox" checked={selectedIds.includes(item._id)} disabled={item.tradesmanCount > 0} title={item.tradesmanCount > 0 ? "Deactivate categories assigned to tradesmen instead" : undefined} onChange={() => setSelectedIds((current) => current.includes(item._id) ? current.filter((id) => id !== item._id) : [...current, item._id])} aria-label={`Select ${item.name}`} /></td>
            <td className="px-4 py-4">{item.order + 1}</td><td className="px-4 py-4"><CategoryIcon icon={item.icon} name={item.name} /></td><td className="px-4 py-4 font-semibold">{item.name}{item.isNew && <span className="ml-2 rounded-full bg-accent px-2 py-1 text-[10px] font-bold uppercase text-white">New</span>}</td><td className="px-4 py-4">{item.tradesmanCount}</td><td className="px-4 py-4"><button onClick={() => toggle.mutate(item)} disabled={toggle.isPending} className={item.isActive ? "font-semibold text-green-700" : "font-semibold text-red-600"}>{item.isActive ? "Active" : "Inactive"}</button></td>
            <td className="px-6 py-4"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(item)}><Pencil size={14} />Edit</Button><Button size="sm" variant="danger" disabled={remove.isPending || item.tradesmanCount > 0} title={item.tradesmanCount > 0 ? "Deactivate categories assigned to tradesmen instead" : "Delete category"} onClick={() => { if (confirm(`Delete ${item.name}?`)) remove.mutate(item._id); }}><Trash2 size={14} />Delete</Button></div></td>
          </tr>)}</tbody>
        </table></div>
        {!rows.length && <p className="p-12 text-center text-sm text-muted">No categories found.</p>}
        <Pagination page={query.data?.meta.page || 1} totalPages={query.data?.meta.totalPages || 1} total={query.data?.meta.total || 0} pageSize={limit} onPage={(nextPage) => { setPage(nextPage); setSelectedIds([]); }} />
      </>}
    </section>
    <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle><form className="mt-6 space-y-4" onSubmit={submit}><label className="block text-sm font-semibold">Category Name<Input name="name" required defaultValue={category?.name} className="mt-2" /></label><label className="block text-sm font-semibold">Icon (emoji or HTTPS URL)<Input name="icon" defaultValue={category?.icon} className="mt-2" placeholder="🔧 or https://example.com/icon.svg" /><span className="mt-2 block text-xs font-normal leading-5 text-muted">Raw SVG code is not accepted. Use one emoji or a hosted HTTPS image URL.</span></label>{category ? <label className="block text-sm font-semibold">Order<Input name="order" type="number" min="0" max={Math.max(0, (query.data?.meta.total || 1) - 1)} required defaultValue={category.order} className="mt-2" /></label> : <p className="rounded-md bg-brand-soft p-3 text-xs leading-5 text-muted">New categories are placed at the top and display a NEW badge for 7 days.</p>}<div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={save.isPending}>{save.isPending ? "Saving..." : "Save Category"}</Button></div></form></DialogContent></Dialog>
  </>;
}
