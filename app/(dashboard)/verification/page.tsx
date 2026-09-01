"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { CheckCircle2, Search, Trash2, XCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  bulkVerificationAction,
  bulkUserAction,
  deleteUser,
  getUsers,
  updateVerification,
} from "@/lib/api";
import type { User } from "@/lib/types";
import { errorMessage } from "@/lib/utils";

const nameOf = (user: User) =>
  user.name ||
  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
  "Unnamed tradesman";

export default function VerificationPage() {
  const client = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectIds, setRejectIds] = useState<string[]>([]);
  const [rejectBulk, setRejectBulk] = useState(false);
  const limit = 10;
  const query = useQuery({
    queryKey: ["verification", status, search, page],
    queryFn: () =>
      getUsers({
        type: "tradesman",
        page,
        limit,
        search,
        verificationStatus: status,
      }),
    placeholderData: keepPreviousData,
  });
  const refresh = () => {
    setSelected([]);
    client.invalidateQueries({ queryKey: ["verification"] });
    client.invalidateQueries({ queryKey: ["notifications"] });
    client.invalidateQueries({ queryKey: ["users"] });
    client.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const single = useMutation({
    mutationFn: ({
      id,
      next,
      reason,
    }: {
      id: string;
      next: "verified" | "rejected";
      reason?: string;
    }) => updateVerification(id, next, reason),
    onSuccess: (response) => {
      toast.success(response.message);
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const bulk = useMutation({
    mutationFn: ({
      action,
      reason,
    }: {
      action: "verify" | "reject";
      reason?: string;
    }) => bulkVerificationAction({ ids: selected, action, reason }),
    onSuccess: (response) => {
      toast.success(response.message);
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const rows = query.data?.users || [];
  const remove = useMutation({ mutationFn: deleteUser, onSuccess: (response) => { toast.success(response.message); refresh(); }, onError: (error) => toast.error(errorMessage(error)) });
  const selectedUserIds = rows.filter((user) => selected.includes(user.tradesmanProfile!._id)).map((user) => user._id);
  const bulkRemove = useMutation({ mutationFn: () => bulkUserAction({ ids: selectedUserIds, action: "delete" }), onSuccess: (response) => { toast.success(response.message); refresh(); }, onError: (error) => toast.error(errorMessage(error)) });
  const allSelected =
    rows.length > 0 &&
    rows.every((user) => selected.includes(user.tradesmanProfile!._id));

  function reject(ids: string[], bulkMode = false) {
    setRejectIds(ids);
    setRejectBulk(bulkMode);
    setRejectReason("");
    setRejectOpen(true);
  }

  function submitReject() {
    const reason = rejectReason.trim();
    if (!reason) return;
    setRejectOpen(false);
    if (rejectBulk) bulk.mutate({ action: "reject", reason });
    else single.mutate({ id: rejectIds[0], next: "rejected", reason });
  }

  return (
    <>
      <PageHeading title="Verification Queue" />
      <section className="mb-4 flex flex-wrap gap-3 rounded-lg bg-white p-4 shadow-sm">
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
          className="flex min-w-[260px] flex-1 gap-2"
        >
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              size={17}
            />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, email, phone, or skill"
              className="pl-10"
            />
          </div>
          <Button size="sm">Search</Button>
        </form>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
            setSelected([]);
          }}
          className="form-control w-auto"
        >
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        {selected.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => bulk.mutate({ action: "verify" })}>
              <CheckCircle2 size={15} />
              Verify {selected.length}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => reject(selected, true)}
            >
              <XCircle size={15} />
              Reject {selected.length}
            </Button>
            <Button size="sm" variant="danger" disabled={bulkRemove.isPending} onClick={() => { if (confirm(`Permanently delete ${selectedUserIds.length} selected tradesman accounts?`)) bulkRemove.mutate(); }}><Trash2 size={15} />Delete {selectedUserIds.length}</Button>
          </div>
        )}
      </section>
      <section className="overflow-hidden rounded-lg bg-white shadow-sm">
        {query.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        ) : query.isError ? (
          <p className="p-10 text-center text-red-600">
            {errorMessage(query.error)}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead className="bg-brand-soft text-left text-xs uppercase">
                  <tr>
                    <th className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() =>
                          setSelected(
                            allSelected
                              ? []
                              : rows.map((user) => user.tradesmanProfile!._id),
                          )
                        }
                        aria-label="Select all tradesmen"
                      />
                    </th>
                    <th className="px-4 py-4">Tradesman</th>
                    <th className="px-4 py-4">Skill</th>
                    <th className="px-4 py-4">Submitted</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((user) => {
                    const profile = user.tradesmanProfile!;
                    return (
                      <tr key={user._id} className="border-b border-black/5">
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selected.includes(profile._id)}
                            onChange={() =>
                              setSelected((current) =>
                                current.includes(profile._id)
                                  ? current.filter((id) => id !== profile._id)
                                  : [...current, profile._id],
                              )
                            }
                            aria-label={`Select ${nameOf(user)}`}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold">{nameOf(user)}</p>
                          <p className="text-xs text-muted">{user.email}</p>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {profile.mainSkill || "Not provided"}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {new Date(
                            profile.verification?.submittedAt ||
                              profile.updatedAt ||
                              user.createdAt ||
                              "",
                          ).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-sm capitalize">
                          {profile.verificationStatus}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                single.mutate({
                                  id: profile._id,
                                  next: "verified",
                                })
                              }
                              disabled={single.isPending}
                            >
                              <CheckCircle2 size={14} />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => reject([profile._id])}
                              disabled={single.isPending}
                            >
                              <XCircle size={14} />
                              Reject
                            </Button>
                            <Button size="sm" variant="danger" disabled={remove.isPending} onClick={() => { if (confirm(`Permanently delete ${nameOf(user)}?`)) remove.mutate(user._id); }}><Trash2 size={14} />Delete</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!rows.length && (
              <p className="p-12 text-center text-sm text-muted">
                No tradesmen found for this status.
              </p>
            )}
            <Pagination
              page={query.data?.meta.page || 1}
              totalPages={query.data?.meta.totalPages || 1}
              total={query.data?.meta.total || 0}
              pageSize={limit}
              onPage={(nextPage) => { setPage(nextPage); setSelected([]); }}
            />
          </>
        )}
      </section>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Reject Verification</DialogTitle>
          <DialogDescription className="pb-2">
            Please provide a reason for the rejection.
          </DialogDescription>
          <textarea
            className="h-28 w-full resize-none rounded-md border border-[#b7b7b7] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#a4a4a4] focus:border-brand focus:ring-2 focus:ring-brand/10"
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) submitReject();
            }}
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={submitReject}
              disabled={!rejectReason.trim()}
            >
              Confirm Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
