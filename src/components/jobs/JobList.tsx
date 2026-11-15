"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  DEFAULT_JOB_LIMIT,
  fetchAppliedJobIds,
  fetchJobs,
  fetchSavedJobIds,
  parseJobsFilters,
  toggleSavedJob,
  type Job,
  type JobsFiltersState,
  type JobsMeta,
  jobsParamsToQueryString,
} from "@/lib/api/jobs";
import { formatNumber } from "@/lib/format";
import { useSession } from "@/lib/auth-client";
import { getRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { JobCard } from "@/components/jobs/JobCard";
import { SortDropdown, type JobsSortValue } from "@/components/jobs/SortDropdown";
import { Pagination } from "@/components/jobs/Pagination";

interface JobListProps {
  initialJobs: Job[];
  initialMeta: JobsMeta;
  initialError?: boolean;
}

export function JobList({
  initialJobs,
  initialMeta,
  initialError = false,
}: JobListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();

  const filters = React.useMemo(
    () => parseJobsFilters(new URLSearchParams(paramsString)),
    [paramsString],
  );

  const [jobs, setJobs] = React.useState<Job[]>(initialJobs);
  const [meta, setMeta] = React.useState<JobsMeta>(initialMeta);
  const [error, setError] = React.useState(initialError);
  const [loading, setLoading] = React.useState(false);
  const firstRunRef = React.useRef(true);

  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const isSeeker = getRole(session?.user) === "seeker";
  const [savedIds, setSavedIds] = React.useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let cancelled = false;
    fetchSavedJobIds()
      .then((ids) => {
        if (!cancelled) setSavedIds(new Set(ids));
      })
      .catch(() => {
        /* keep the current saved set */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!userId || !isSeeker) return;
    let cancelled = false;
    fetchAppliedJobIds()
      .then((ids) => {
        if (!cancelled) setAppliedIds(new Set(ids));
      })
      .catch(() => {
        /* keep the current applied set */
      });
    return () => {
      cancelled = true;
    };
  }, [userId, isSeeker]);

  const runFetch = React.useCallback(async (nextFilters: JobsFiltersState) => {
    setLoading(true);
    try {
      const res = await fetchJobs({
        q: nextFilters.q || undefined,
        type: nextFilters.types.length ? nextFilters.types : undefined,
        workMode: nextFilters.workMode || undefined,
        level: nextFilters.level || undefined,
        salaryMin: nextFilters.salaryMin || undefined,
        sort: nextFilters.sort,
        page: nextFilters.page,
        limit: DEFAULT_JOB_LIMIT,
      });
      setJobs(res.data);
      setMeta(res.meta);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchKey = JSON.stringify([
    filters.q,
    filters.types,
    filters.workMode,
    filters.level,
    filters.salaryMin,
    filters.sort,
    filters.page,
  ]);

  React.useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    void runFetch(filters);
  }, [fetchKey, runFetch, filters]);

  const toggleSave = React.useCallback(
    async (jobId: string, saved: boolean) => {
      const prevSaved = savedIds.has(jobId);
      const optimistic = saved;
      setSavedIds((prevIds) => {
        const next = new Set(prevIds);
        if (optimistic) next.add(jobId);
        else next.delete(jobId);
        return next;
      });
      try {
        const nowSaved = await toggleSavedJob(jobId, saved);
        setSavedIds((prevIds) => {
          const next = new Set(prevIds);
          if (nowSaved) next.add(jobId);
          else next.delete(jobId);
          return next;
        });
      } catch {
        // Roll back on failure.
        setSavedIds((prevIds) => {
          const next = new Set(prevIds);
          if (prevSaved) next.add(jobId);
          else next.delete(jobId);
          return next;
        });
      }
    },
    [savedIds],
  );

  const updateFilters = React.useCallback(
    (next: Partial<JobsFiltersState>) => {
      router.replace(
        `?${jobsParamsToQueryString({ ...filters, ...next, page: 1 })}`,
        { scroll: false },
      );
    },
    [filters, router],
  );

  const goToPage = React.useCallback(
    (page: number) => {
      router.replace(
        `?${jobsParamsToQueryString({ ...filters, page })}`,
        { scroll: false },
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [filters, router],
  );

  const handleSortChange = React.useCallback(
    (sort: JobsSortValue) => {
      updateFilters({ sort, page: 1 });
    },
    [updateFilters],
  );

  const retry = React.useCallback(() => {
    setError(false);
    void runFetch(filters);
  }, [filters, runFetch]);

  /* ---------- states ---------- */

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
          onClick={() =>
            updateFilters({
              q: "",
              types: [],
              workMode: "",
              level: "",
              salaryMin: "",
              page: 1,
            })
          }
          className="mt-6 inline-flex h-10 items-center justify-center rounded-[10px] bg-white px-5 text-sm font-medium text-black hover:bg-white/80"
        >
          Clear filters
        </button>
      </div>
    );
  }

  /* ---------- results ---------- */

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
          <SortDropdown value={filters.sort} onChange={handleSortChange} />
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
            onToggleSave={toggleSave}
          />
        ))}
      </div>

      <Pagination page={filters.page} totalPages={Math.max(1, meta.totalPages)} onChange={goToPage} />
    </>
  );
}
