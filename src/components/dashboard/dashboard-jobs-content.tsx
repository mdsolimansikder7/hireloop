"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

import { useJobs } from "@/lib/jobs/useJobs";
import { Pagination } from "@/components/jobs/Pagination";
import { JobCard } from "@/components/jobs/JobCard";
import type { Job } from "@/lib/api/jobs";

export function DashboardJobsContent({
  initialJobs,
  initialMeta,
  initialError,
}: {
  initialJobs: Job[];
  initialMeta: import("@/lib/api/jobs").JobsMeta;
  initialError: boolean;
}) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    jobs,
    meta,
    error,
    loading,
    filters,
    savedIds,
    appliedIds,
    toggleSave,
    handleSortChange,
    goToPage,
    retry,
    basePath,
  } = useJobs({
    basePath: "/dashboard/jobs",
    initialJobs,
    initialMeta,
    initialError,
  });

  const clearAll = () => {
    router.replace("/dashboard/jobs");
  };

  const handlePageChange = (page: number) => {
    goToPage(page);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-10 text-center">
        <h2 className="text-[17px] font-medium text-white">
          Could not load jobs. Please try again.
        </h2>
        <button
          type="button"
          onClick={retry}
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
          onClick={clearAll}
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
            {meta.total.toLocaleString()}
          </span>{" "}
          Professional Jobs
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#9ca3af]">Sort by:</span>
          <select
            value={filters.sort}
            onChange={(e) => handleSortChange(e.target.value as "newest" | "salary")}
            className="h-8 rounded-[10px] border border-white/10 bg-[#141414] px-3 text-sm text-white outline-none transition-colors focus:border-[#5b4ff5]/60"
          >
            <option value="newest">Newest</option>
            <option value="salary">Highest Salary</option>
          </select>
        </div>
      </div>

      <div ref={contentRef} className="mt-6 flex flex-col gap-4" aria-busy={loading}>
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            saved={savedIds.has(job.id)}
            applied={appliedIds.has(job.id)}
            onToggleSave={toggleSave}
            basePath={basePath}
          />
        ))}
      </div>

      <Pagination page={filters.page} totalPages={Math.max(1, meta.totalPages)} onChange={handlePageChange} />
    </>
  );
}