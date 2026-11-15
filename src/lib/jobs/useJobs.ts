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
import { useSession } from "@/lib/auth-client";
import { getRole } from "@/lib/roles";

export interface UseJobsOptions {
  basePath?: string;
  initialJobs?: Job[];
  initialMeta?: JobsMeta;
  initialError?: boolean;
}

export function useJobs({
  basePath = "/jobs",
  initialJobs = [],
  initialMeta,
  initialError = false,
}: UseJobsOptions = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();

  const filters = React.useMemo(
    () => parseJobsFilters(new URLSearchParams(paramsString)),
    [paramsString],
  );

  const [jobs, setJobs] = React.useState<Job[]>(initialJobs);
  const [meta, setMeta] = React.useState<JobsMeta>(
    initialMeta ?? {
      page: filters.page,
      limit: DEFAULT_JOB_LIMIT,
      total: 0,
      totalPages: 0,
    },
  );
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
    (sort: JobsFiltersState["sort"]) => {
      updateFilters({ sort, page: 1 });
    },
    [updateFilters],
  );

  const retry = React.useCallback(() => {
    setError(false);
    void runFetch(filters);
  }, [filters, runFetch]);

  return {
    jobs,
    meta,
    error,
    loading,
    filters,
    savedIds,
    appliedIds,
    toggleSave,
    updateFilters,
    goToPage,
    handleSortChange,
    retry,
    basePath,
  };
}