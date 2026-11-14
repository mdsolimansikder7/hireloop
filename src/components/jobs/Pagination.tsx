"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

function getPageItems(current: number, total: number): Array<number | "…"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const candidates = new Set<number>([1, total, current - 1, current, current + 1]);
  const pages = [...candidates]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const items: Array<number | "…"> = [];
  let previous = 0;
  for (const page of pages) {
    if (page - previous > 1) items.push("…");
    items.push(page);
    previous = page;
  }
  return items;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages));
  const items = getPageItems(safePage, Math.max(1, totalPages));

  const goTo = (next: number) => {
    if (next < 1 || next > Math.max(1, totalPages) || next === safePage) return;
    onChange(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav aria-label="Pagination" className="mt-10 flex justify-center">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={safePage <= 1}
          onClick={() => goTo(safePage - 1)}
          className={cn(
            "grid size-8 place-items-center rounded-[8px] border border-white/10 bg-[#141414] text-[#9ca3af]",
            "transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        {items.map((item, index) =>
          item === "…" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-sm text-[#6b7280]"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === safePage ? "page" : undefined}
              onClick={() => goTo(item)}
              className={cn(
                "grid size-8 place-items-center rounded-[8px] text-sm font-medium",
                "transition-colors hover:bg-white/5",
                item === safePage
                  ? "bg-white text-black"
                  : "text-[#9ca3af] hover:text-white",
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Next page"
          disabled={safePage >= Math.max(1, totalPages)}
          onClick={() => goTo(safePage + 1)}
          className={cn(
            "grid size-8 place-items-center rounded-[8px] border border-white/10 bg-[#141414] text-[#9ca3af]",
            "transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
