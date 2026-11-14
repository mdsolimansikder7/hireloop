"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type JobsSortValue = "newest" | "salary";

const SORT_OPTIONS: { value: JobsSortValue; label: string }[] = [
  { value: "newest", label: "Most Recent" },
  { value: "salary", label: "Highest Salary" },
];

interface SortDropdownProps {
  value: JobsSortValue;
  onChange: (value: JobsSortValue) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const label = SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Most Recent";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-[10px] border border-white/10 bg-[#141414] px-3",
          "text-sm font-medium text-white transition-colors hover:bg-white/5",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4ff5]",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        {label}
        <ChevronDown
          className={cn("size-4 text-[#9ca3af] transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Sort by"
          className="absolute right-0 z-30 mt-1.5 w-[190px] overflow-hidden rounded-[10px] border border-white/10 bg-[#161616] py-1 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)]"
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "block w-full rounded-[8px] px-3 py-2 text-left text-sm transition-colors",
                "hover:bg-white/5",
                value === option.value && "bg-white/10 text-white",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
