"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createCategory, getCategoriesAdmin, updateCategory } from "@/lib/api";
import type { Category } from "@/lib/types";
import { errorMessage } from "@/lib/utils";

export default function CategoriesPage() {
  const client = useQueryClient();
  const [editing, setEditing] = useState<Category | null | "new">(null);
  const query = useQuery({ queryKey: ["categories"], queryFn: getCategoriesAdmin });
  const save = useMutation({ mutationFn: ({ id, payload }: { id?: string; payload: { name: string; icon: string; order: number } }) => id ? updateCategory(id, payload) : createCategory(payload), onSuccess: (response) => { toast.success(response.message); client.invalidateQueries({ queryKey: ["categories"] }); setEditing(null); }, onError: (error) => toast.error(errorMessage(error)) });
  const toggle = useMutation({ mutationFn: (category: Category) => updateCategory(category._id, { isActive: !category.isActive }), onSuccess: (response) => { toast.success(response.message); client.invalidateQueries({ queryKey: ["categories"] }); }, onError: (error) => toast.error(errorMessage(error)) });
  const category = editing === "new" ? null : editing;
  return <>
    <div className="flex items-start"><PageHeading title="Trade Categories" /><Button className="ml-auto" size="sm" onClick={() => setEditing("new")}><Plus size={16} />Add Category</Button></div>
    <section className="overflow-hidden rounded-lg bg-white shadow-sm">{query.isLoading ? <p className="p-10 text-center text-muted">Loading categories...</p> : query.isError ? <p className="p-10 text-center text-red-600">{errorMessage(query.error)}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[700px]"><thead className="bg-brand-soft text-left text-xs uppercase"><tr><th className="px-6 py-4">Order</th><th className="px-4 py-4">Icon</th><th className="px-4 py-4">Category</th><th className="px-4 py-4">Tradesmen</th><th className="px-4 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody>{query.data?.map((item) => <tr key={item._id} className="border-b border-black/5"><td className="px-6 py-4">{item.order + 1}</td><td className="px-4 py-4 text-2xl">{item.icon || "🛠️"}</td><td className="px-4 py-4 font-semibold">{item.name}</td><td className="px-4 py-4">{item.tradesmanCount}</td><td className="px-4 py-4"><button onClick={() => toggle.mutate(item)} className={item.isActive ? "font-semibold text-green-700" : "font-semibold text-red-600"}>{item.isActive ? "Active" : "Inactive"}</button></td><td className="px-6 py-4 text-right"><Button size="sm" variant="outline" onClick={() => setEditing(item)}><Pencil size={14} />Edit</Button></td></tr>)}</tbody></table></div>}</section>
    <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle><form className="mt-6 space-y-4" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); save.mutate({ id: category?._id, payload: { name: String(form.get("name")), icon: String(form.get("icon")), order: Number(form.get("order")) } }); }}><label className="block text-sm font-semibold">Category Name<Input name="name" required defaultValue={category?.name} className="mt-2" /></label><label className="block text-sm font-semibold">Icon (emoji or URL)<Input name="icon" defaultValue={category?.icon} className="mt-2" /></label><label className="block text-sm font-semibold">Order<Input name="order" type="number" min="0" required defaultValue={category?.order ?? query.data?.length ?? 0} className="mt-2" /></label><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={save.isPending}>{save.isPending ? "Saving..." : "Save Category"}</Button></div></form></DialogContent></Dialog>
  </>;
}
