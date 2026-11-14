import type { Metadata } from "next";
import { Suspense } from "react";

import {
  DEFAULT_JOB_LIMIT,
  fetchJobs,
  parseJobsFilters,
  type Job,
  type JobsMeta,
} from "@/lib/api/jobs";
import { JobList } from "@/components/jobs/JobList";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobSearchBar } from "@/components/jobs/JobSearchBar";

export const metadata: Metadata = {
  title: "Browse Jobs | hireloop",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseJobsFilters(params);

  let initialJobs: Job[] = [];
  let initialMeta: JobsMeta = {
    page: filters.page,
    limit: DEFAULT_JOB_LIMIT,
    total: 0,
    totalPages: 0,
  };
  let initialError = false;

  try {
    const res = await fetchJobs({
      q: filters.q || undefined,
      type: filters.types.length ? filters.types : undefined,
      workMode: filters.workMode || undefined,
      level: filters.level || undefined,
      salaryMin: filters.salaryMin || undefined,
      sort: filters.sort,
      page: filters.page,
      limit: DEFAULT_JOB_LIMIT,
    });
    initialJobs = res.data;
    initialMeta = res.meta;
  } catch {
    initialError = true;
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto w-full max-w-[1100px] px-6 pt-28 pb-16">
        <Suspense fallback={null}>
          <JobSearchBar />
        </Suspense>

        <div className="mt-6 flex items-start gap-6">
          <JobFilters facets={initialMeta.facets} />
          <section
            aria-label="Job results"
            className="min-w-0 flex-1"
          >
            <Suspense fallback={null}>
              <JobList
                initialJobs={initialJobs}
                initialMeta={initialMeta}
                initialError={initialError}
              />
            </Suspense>
          </section>
        </div>
      </div>
    </main>
  );
}
