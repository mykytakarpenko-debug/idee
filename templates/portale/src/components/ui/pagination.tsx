"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { copy } from "@/content/it";
import { Button } from "./button";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav
      aria-label={copy.a11y.pagination}
      className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 sm:px-6"
    >
      <p className="text-[13px] text-fg-muted tabular-nums" aria-live="polite">
        {copy.common.showing(from, to, total)}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={copy.common.previous}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <span className="px-2 text-[13px] text-fg-muted tabular-nums">
          {copy.common.page(page, pages)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label={copy.common.next}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
