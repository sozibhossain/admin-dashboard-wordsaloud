"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { getReviewsAdmin, moderateReview } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

const person = (value?: { firstName?: string; lastName?: string; email?: string }) => `${value?.firstName || ""} ${value?.lastName || ""}`.trim() || value?.email || "Unknown";

export default function ReviewsPage() {
  const client = useQueryClient(); const [status, setStatus] = useState("pending"); const [page, setPage] = useState(1); const limit = 12;
  const query = useQuery({ queryKey: ["reviews", status, page], queryFn: () => getReviewsAdmin({ page, limit, status }), placeholderData: keepPreviousData });
  const mutation = useMutation({ mutationFn: ({ id, next, note }: { id: string; next: "approved" | "rejected"; note?: string }) => moderateReview(id, { status: next, note }), onSuccess: (response) => { toast.success(response.message); client.invalidateQueries({ queryKey: ["reviews"] }); client.invalidateQueries({ queryKey: ["notifications"] }); }, onError: (error) => toast.error(errorMessage(error)) });
  return <><div className="flex flex-wrap items-start gap-3"><PageHeading title="Review Moderation" /><select className="form-control ml-auto w-auto" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div><section className="grid gap-4 lg:grid-cols-2">{query.data?.reviews.map((review) => <article key={review._id} className="rounded-lg bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="font-semibold">{person(review.reviewer)}</p><p className="text-xs text-muted">Review for {person(review.tradesman?.user)}</p></div><span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-bold">{review.rating}/5</span></div><p className="mt-4 text-sm leading-6">{review.reviewText || review.ratingLabel || "No written comment."}</p><p className="mt-3 text-xs text-muted">{new Date(review.createdAt).toLocaleString()}</p><div className="mt-4 flex gap-2"><Button size="sm" onClick={() => mutation.mutate({ id: review._id, next: "approved" })}><CheckCircle2 size={14} />Approve</Button><Button size="sm" variant="danger" onClick={() => { const note = window.prompt("Reason for rejection (optional):") || ""; mutation.mutate({ id: review._id, next: "rejected", note }); }}><XCircle size={14} />Reject</Button></div></article>)}{query.isLoading && <p className="col-span-full rounded-lg bg-white p-10 text-center text-muted">Loading reviews...</p>}{query.isError && <p className="col-span-full rounded-lg bg-white p-10 text-center text-red-600">{errorMessage(query.error)}</p>}{!query.isLoading && !query.data?.reviews.length && <p className="col-span-full rounded-lg bg-white p-12 text-center text-muted">No {status} reviews.</p>}</section>{query.data && <div className="mt-5 rounded-lg bg-white"><Pagination page={query.data.meta.page} totalPages={query.data.meta.totalPages} total={query.data.meta.total} pageSize={limit} onPage={setPage} /></div>}</>;
}
