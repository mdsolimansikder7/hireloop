"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { JobCard } from "@/components/jobs/JobCard";
import { SortDropdown, type JobsSortValue } from "@/components/jobs/SortDropdown";
import { Pagination } from "@/components/jobs/Pagination";
import type { Job } from "@/lib/api/jobs";

interface JobsResultsProps {
  jobs: Job[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    facets?: Record<string, number>;
  };
  error: boolean;
  loading: boolean;
  filters: {
    q: string;
    types: string[];
    workMode: string;
    level: string;
    salaryMin: string;
    sort: JobsSortValue;
    page: number;
  };
  savedIds: Set<string>;
  appliedIds: Set<string>;
  onToggleSave: (jobId: string, saved: boolean) => void | Promise<void>;
  onSortChange: (sort: JobsSortValue) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onClearFilters: () => void;
  basePath: string;
}

export function JobsResults({
  jobs,
  meta,
  error,
  loading,
  filters,
  savedIds,
  appliedIds,
  onToggleSave,
  onSortChange,
  onPageChange,
  onRetry,
  onClearFilters,
  basePath,
}: JobsResultsProps) {
  if (error) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-10 text-center">
        <h2 className="text-[17px] font-medium text-white">
          Could not load jobs. Please try again.
        </h2>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] bg-white px-5 text-sm font-medium text-black hover:bg-white/80"
        >
          Retry
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#111111] px-6 py-16 text-center">
        <h2 className="text-[17px] font-medium text-white">
          No jobs match your filters
        </h2>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Try adjusting your search or clearing the filters.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-[10px] bg-white px-5 text-sm font-medium text-black hover:bg-white/80"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">
          Found{" "}
          <span className="font-semibold text-white">
            {formatNumber(meta.total)}
          </span>{" "}
          Professional Jobs
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#9ca3af]">Sort by:</span>
          <SortDropdown value={filters.sort} onChange={onSortChange} />
        </div>
      </div>

      <div
        className={cn(
          "mt-6 flex flex-col gap-4",
          loading && jobs.length > 0 && "opacity-60",
        )}
        aria-busy={loading}
      >
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            saved={savedIds.has(job.id)}
            applied={appliedIds.has(job.id)}
            onToggleSave={onToggleSave}
            basePath={basePath}
          />
        ))}
      </div>

      <Pagination page={filters.page} totalPages={Math.max(1, meta.totalPages)} onChange={onPageChange} />
    </>
  );
}