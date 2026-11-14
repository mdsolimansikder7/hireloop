"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import {
  jobsParamsToQueryString,
  parseJobsFilters,
} from "@/lib/api/jobs";
import { Button } from "@/components/ui/button";

const DEBOUNCE_MS = 300;

export function JobSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();

  const filters = React.useMemo(
    () => parseJobsFilters(new URLSearchParams(paramsString)),
    [paramsString],
  );

  const [input, setInput] = React.useState(filters.q);
  const [debouncedQuery, setDebouncedQuery] = React.useState(filters.q);
  const [lastCommittedQuery, setLastCommittedQuery] =
    React.useState(filters.q);

  // Keep the input in sync when the query changes from the outside
  // (e.g. "Clear all", browser back/forward, shared links).
  if (filters.q !== lastCommittedQuery) {
    setLastCommittedQuery(filters.q);
    setInput(filters.q);
  }

  React.useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedQuery(input.trim()),
      DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [input]);

  React.useEffect(() => {
    if (debouncedQuery === filters.q) return;
    router.replace(
      `?${jobsParamsToQueryString({ ...filters, q: debouncedQuery, page: 1 })}`,
      { scroll: false },
    );
  }, [debouncedQuery, filters, router]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    router.replace(
      `?${jobsParamsToQueryString({ ...filters, q: input.trim(), page: 1 })}`,
      { scroll: false },
    );
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/[0.08] bg-[#111111] p-3"
    >
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Search by job title, keywords..."
            aria-label="Search jobs"
            className="h-[44px] w-full rounded-[10px] border border-white/10 bg-[#141414] pl-10 pr-3 text-sm text-white placeholder:text-[#6b7280] outline-none transition-colors focus:border-[#5b4ff5]/60"
          />
        </div>
        <Button
          type="submit"
          className="h-[44px] shrink-0 rounded-[10px] bg-white px-5 text-sm font-medium text-black hover:bg-white/80"
        >
          Search Jobs
        </Button>
      </div>
    </form>
  );
}
