"use client";

import { Suspense } from "react";

import { useJobs } from "@/lib/jobs/useJobs";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobSearchBar } from "@/components/jobs/JobSearchBar";
import { JobsResults } from "@/components/jobs/JobsResults";

interface JobsBrowserProps {
  basePath?: string;
  initialJobs?: import("@/lib/api/jobs").Job[];
  initialMeta?: import("@/lib/api/jobs").JobsMeta;
  initialError?: boolean;
}

export function JobsBrowser({
  basePath = "/jobs",
  initialJobs = [],
  initialMeta,
  initialError = false,
}: JobsBrowserProps) {
  const {
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
    basePath: hookBasePath,
  } = useJobs({ basePath, initialJobs, initialMeta, initialError });

  const clearAll = () => {
    updateFilters({
      q: "",
      types: [],
      workMode: "",
      level: "",
      salaryMin: "",
      page: 1,
    });
  };

  return (
    <>
      <Suspense fallback={null}>
        <JobSearchBar />
      </Suspense>

      <div className="mt-6 flex items-start gap-6">
        <JobFilters facets={meta.facets} />
        <section aria-label="Job results" className="min-w-0 flex-1">
          <Suspense fallback={null}>
            <JobsResults
              jobs={jobs}
              meta={meta}
              error={error}
              loading={loading}
              filters={filters}
              savedIds={savedIds}
              appliedIds={appliedIds}
              onToggleSave={toggleSave}
              onSortChange={handleSortChange}
              onPageChange={goToPage}
              onRetry={retry}
              onClearFilters={clearAll}
              basePath={hookBasePath}
            />
          </Suspense>
        </section>
      </div>
    </>
  );
}