"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuditLogs } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const limit = 20;
  const query = useQuery({
    queryKey: ["audit-logs", page, search],
    queryFn: () => getAuditLogs({ page, limit, search }),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeading title="Audit Log" />
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          setSearch(input.trim());
          setPage(1);
        }}
        className="mb-4 flex gap-2 rounded-lg bg-white p-4 shadow-sm"
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Search admin, action, record, or ID"
        />
        <Button size="sm">Search</Button>
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
                    <th className="px-5 py-4">Timestamp</th>
                    <th className="px-4 py-4">Administrator</th>
                    <th className="px-4 py-4">Action</th>
                    <th className="px-4 py-4">Affected Record</th>
                    <th className="px-5 py-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data?.logs.map((log) => (
                    <tr
                      key={log._id}
                      className="border-b border-black/5 align-top"
                    >
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
              onPage={setPage}
            />
          </>
        )}
      </section>
    </>
  );
}
