"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { bulkDeleteReviews, deleteReview, getReviewsAdmin, moderateReview } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

const person = (value?: { firstName?: string; lastName?: string; email?: string }) => `${value?.firstName || ""} ${value?.lastName || ""}`.trim() || value?.email || "Unknown";

export default function ReviewsPage() {
  const client = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const limit = 12;
  const query = useQuery({ queryKey: ["reviews", status, page], queryFn: () => getReviewsAdmin({ page, limit, status }), placeholderData: keepPreviousData });
  const refresh = () => { client.invalidateQueries({ queryKey: ["reviews"] }); client.invalidateQueries({ queryKey: ["notifications"] }); };
  const mutation = useMutation({ mutationFn: ({ id, next, note }: { id: string; next: "approved" | "rejected"; note?: string }) => moderateReview(id, { status: next, note }), onSuccess: (response) => { toast.success(response.message); refresh(); }, onError: (error) => toast.error(errorMessage(error)) });
  const remove = useMutation({ mutationFn: deleteReview, onSuccess: (response) => { toast.success(response.message); if ((query.data?.reviews.length || 0) === 1 && page > 1) setPage((current) => current - 1); refresh(); }, onError: (error) => toast.error(errorMessage(error)) });
  const bulkRemove = useMutation({ mutationFn: () => bulkDeleteReviews(selectedIds), onSuccess: (response) => { toast.success(response.message); if (selectedIds.length >= (query.data?.reviews.length || 0) && page > 1) setPage((current) => current - 1); setSelectedIds([]); refresh(); }, onError: (error) => toast.error(errorMessage(error)) });
  const rows = query.data?.reviews || [];
  const allSelected = rows.length > 0 && rows.every((review) => selectedIds.includes(review._id));

  return <>
    <div className="flex flex-wrap items-start gap-3"><PageHeading title="Review Moderation" /><div className="ml-auto flex items-center gap-2">{selectedIds.length > 0 && <Button size="sm" variant="danger" disabled={bulkRemove.isPending} onClick={() => { if (confirm(`Delete ${selectedIds.length} selected reviews?`)) bulkRemove.mutate(); }}><Trash2 size={15} />{bulkRemove.isPending ? "Deleting..." : `Delete ${selectedIds.length}`}</Button>}<select className="form-control w-auto" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); setSelectedIds([]); }}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div></div>
    {rows.length > 0 && <label className="mb-4 flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold shadow-sm"><input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? [] : rows.map((review) => review._id))} />Select all on this page</label>}
    <section className="grid gap-4 lg:grid-cols-2">
      {rows.map((review) => <article key={review._id} className="rounded-lg bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><input type="checkbox" className="mt-1" checked={selectedIds.includes(review._id)} onChange={() => setSelectedIds((current) => current.includes(review._id) ? current.filter((id) => id !== review._id) : [...current, review._id])} aria-label={`Select review by ${person(review.reviewer)}`} /><div><p className="font-semibold">{person(review.reviewer)}</p><p className="text-xs text-muted">Review for {person(review.tradesman?.user)}</p></div></div><span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-bold">{review.rating}/5</span></div><p className="mt-4 text-sm leading-6">{review.reviewText || review.ratingLabel || "No written comment."}</p><p className="mt-3 text-xs text-muted">{new Date(review.createdAt).toLocaleString()}</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => mutation.mutate({ id: review._id, next: "approved" })}><CheckCircle2 size={14} />Approve</Button><Button size="sm" variant="outline" onClick={() => { const note = window.prompt("Reason for rejection (optional):") || ""; mutation.mutate({ id: review._id, next: "rejected", note }); }}><XCircle size={14} />Reject</Button><Button className="ml-auto" size="sm" variant="danger" disabled={remove.isPending} onClick={() => { if (confirm("Delete this review permanently?")) remove.mutate(review._id); }}><Trash2 size={14} />Delete</Button></div></article>)}
      {query.isLoading && <p className="col-span-full rounded-lg bg-white p-10 text-center text-muted">Loading reviews...</p>}{query.isError && <p className="col-span-full rounded-lg bg-white p-10 text-center text-red-600">{errorMessage(query.error)}</p>}{!query.isLoading && !rows.length && <p className="col-span-full rounded-lg bg-white p-12 text-center text-muted">No {status} reviews.</p>}
    </section>
    {query.data && <div className="mt-5 rounded-lg bg-white"><Pagination page={query.data.meta.page} totalPages={query.data.meta.totalPages} total={query.data.meta.total} pageSize={limit} onPage={(nextPage) => { setPage(nextPage); setSelectedIds([]); }} /></div>}
  </>;
}
