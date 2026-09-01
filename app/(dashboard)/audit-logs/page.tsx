"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bulkDeleteAuditLogs, deleteAuditLog, getAuditLogs } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

export default function AuditLogsPage() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const limit = 20;
  const query = useQuery({
    queryKey: ["audit-logs", page, search],
    queryFn: () => getAuditLogs({ page, limit, search }),
    placeholderData: keepPreviousData,
  });
  const refresh = () => client.invalidateQueries({ queryKey: ["audit-logs"] });
  const remove = useMutation({ mutationFn: deleteAuditLog, onSuccess: (response) => { toast.success(response.message); if ((query.data?.logs.length || 0) === 1 && page > 1) setPage((current) => current - 1); refresh(); }, onError: (error) => toast.error(errorMessage(error)) });
  const bulkRemove = useMutation({ mutationFn: () => bulkDeleteAuditLogs(selectedIds), onSuccess: (response) => { toast.success(response.message); if (selectedIds.length >= (query.data?.logs.length || 0) && page > 1) setPage((current) => current - 1); setSelectedIds([]); refresh(); }, onError: (error) => toast.error(errorMessage(error)) });
  const rows = query.data?.logs || [];
  const allSelected = rows.length > 0 && rows.every((log) => selectedIds.includes(log._id));
  return (
    <>
      <PageHeading title="Audit Log" />
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          setSearch(input.trim());
          setPage(1);
          setSelectedIds([]);
        }}
        className="mb-4 flex gap-2 rounded-lg bg-white p-4 shadow-sm"
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Search admin, action, record, or ID"
        />
        <Button size="sm">Search</Button>
        {selectedIds.length > 0 && <Button type="button" size="sm" variant="danger" disabled={bulkRemove.isPending} onClick={() => { if (confirm(`Delete ${selectedIds.length} selected audit entries?`)) bulkRemove.mutate(); }}><Trash2 size={15} />{bulkRemove.isPending ? "Deleting..." : `Delete ${selectedIds.length}`}</Button>}
      </form>
      <section className="overflow-hidden rounded-lg bg-white shadow-sm">
        {query.isLoading ? (
          <p className="p-10 text-center text-muted">
            Loading audit history...
          </p>
        ) : query.isError ? (
          <p className="p-10 text-center text-red-600">
            {errorMessage(query.error)}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-brand-soft text-left text-xs uppercase">
                  <tr>
                    <th className="w-12 px-5 py-4"><input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? [] : rows.map((log) => log._id))} aria-label="Select all audit entries on this page" /></th>
                    <th className="px-5 py-4">Timestamp</th>
                    <th className="px-4 py-4">Administrator</th>
                    <th className="px-4 py-4">Action</th>
                    <th className="px-4 py-4">Affected Record</th>
                    <th className="px-5 py-4">Details</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((log) => (
                    <tr
                      key={log._id}
                      className="border-b border-black/5 align-top"
                    >
                      <td className="px-5 py-4"><input type="checkbox" checked={selectedIds.includes(log._id)} onChange={() => setSelectedIds((current) => current.includes(log._id) ? current.filter((id) => id !== log._id) : [...current, log._id])} aria-label={`Select audit entry ${log._id}`} /></td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold">{log.actorName}</p>
                        <p className="text-xs text-muted">{log.actorEmail}</p>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium">
                        {log.action}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm capitalize">{log.entityType}</p>
                        <p className="font-mono text-xs text-muted">
                          {log.entityId || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {log.summary || "—"}
                      </td>
                      <td className="px-5 py-4 text-right"><Button size="sm" variant="danger" disabled={remove.isPending} onClick={() => { if (confirm("Delete this audit entry?")) remove.mutate(log._id); }}><Trash2 size={14} />Delete</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!query.data?.logs.length && (
              <p className="p-12 text-center text-muted">
                No audit entries found.
              </p>
            )}
            <Pagination
              page={query.data?.meta.page || 1}
              totalPages={query.data?.meta.totalPages || 1}
              total={query.data?.meta.total || 0}
              pageSize={limit}
              onPage={(nextPage) => { setPage(nextPage); setSelectedIds([]); }}
            />
          </>
        )}
      </section>
    </>
  );
}
