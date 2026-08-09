import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

export function Pagination({ page, totalPages, total, pageSize, onPage }: { page: number; totalPages: number; total: number; pageSize: number; onPage: (page: number) => void }) {
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  return <div className="flex flex-col gap-3 border-t border-black/5 px-4 py-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
    <span>Showing {start} to {end} of {total} results</span>
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={17} /></Button>
      <Button size="icon" aria-label={`Page ${page}`}>{page}</Button>
      {totalPages > page + 1 && <span className="px-1">...</span>}
      {totalPages > page && <Button variant="outline" size="icon" onClick={() => onPage(totalPages)}>{totalPages}</Button>}
      <Button variant="outline" size="icon" aria-label="Next page" disabled={page >= totalPages} onClick={() => onPage(page + 1)}><ChevronRight size={17} /></Button>
    </div>
  </div>;
}
