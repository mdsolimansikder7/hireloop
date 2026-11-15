import { redirect } from "next/navigation";

import { Suspense } from "react";
import { DashboardJobsContent } from "@/components/dashboard/dashboard-jobs-content";
import { requireRoleAccess } from "@/lib/require-role";
import { getRole, redirectForRole } from "@/lib/roles";
import {
  DEFAULT_JOB_LIMIT,
  fetchJobs,
  parseJobsFilters,
  type Job,
  type JobsMeta,
} from "@/lib/api/jobs";

export default async function DashboardJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRoleAccess("/dashboard");
  const role = getRole(session.user);

  if (role !== "seeker") redirect(redirectForRole(role));

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
    <Suspense fallback={null}>
      <DashboardJobsContent
        initialJobs={initialJobs}
        initialMeta={initialMeta}
        initialError={initialError}
      />
    </Suspense>
  );
}