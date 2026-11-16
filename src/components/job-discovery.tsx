import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Clock,
  MapPin,
  RotateCw,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchJobs, JobsApiError, type Job } from "@/lib/api/jobs";

function salaryLabel(job: Job) {
  const { salaryMin, salaryMax, currency } = job;
  if (salaryMin == null && salaryMax == null) return null;

  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency && /^[A-Z]{3}$/i.test(currency) ? currency : "USD",
    maximumFractionDigits: 0,
  });
  const min = salaryMin == null ? null : formatter.format(salaryMin);
  const max = salaryMax == null ? null : formatter.format(salaryMax);
  const range = min && max ? `${min}–${max}` : min ?? max;
  const frequency = job.salaryFrequency?.replace(/^per\s+/i, "/");
  return `${range}${frequency ? ` ${frequency}` : ""}`;
}

function workplaceLabel(job: Job) {
  if (job.workMode?.trim()) return job.workMode;
  if (job.remote) return "Remote";
  return job.type ?? null;
}

function jobDescription(job: Job) {
  const description =
    job.description?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() ?? "";
  if (!description) return "Explore this opportunity and view the full job details.";
  return description.length > 140 ? `${description.slice(0, 137).trimEnd()}…` : description;
}

function MetaPill({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 text-xs font-medium text-white/60">
      <Icon
        className="size-3.5 text-fuchsia-300"
        strokeWidth={2}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

export async function JobDiscovery() {
  let jobs: Job[] = [];
  let loadFailed = false;

  try {
    const response = await fetchJobs({
      status: "open",
      sort: "newest",
      page: 1,
      limit: 6,
    });
    jobs = response.data.slice(0, 6);
  } catch (error) {
    const status = error instanceof JobsApiError ? error.status : undefined;
    const url =
      typeof window === "undefined"
        ? `${process.env.API_URL ?? "https://hireloop-server-blush.vercel.app/api"}/jobs?status=open&sort=newest&page=1&limit=6`
        : `/backend/jobs?status=open&sort=newest&page=1&limit=6`;
    console.error(
      `[job-discovery] Could not load recent jobs status=${status ?? "n/a"} url=${url}`,
      error,
    );
    loadFailed = true;
  }

  return (
    <section
      id="jobs"
      className="relative bg-[#010102] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#050506] to-transparent"
      />

      <div className="relative mx-auto w-full max-w-[1200px] px-5 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-[2px] bg-[#5c53fe]"
            />
            <span className="text-[10px] font-medium tracking-[0.22em] text-white/70 uppercase sm:text-[11px]">
              Smart Job Discovery
            </span>
            <span
              aria-hidden="true"
              className="size-1.5 rounded-[2px] bg-[#5c53fe]"
            />
          </div>

          <h2 className="mt-4 max-w-xl text-balance text-3xl leading-[1.15] font-medium tracking-tight text-white sm:mt-5 sm:max-w-2xl sm:text-5xl">
            The roles you&rsquo;d never find by searching
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 sm:mt-12 sm:gap-4 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="rounded-2xl bg-[#151516] ring-0"
              style={{ "--card-spacing": "0px" } as React.CSSProperties}
            >
              <div className="flex h-full flex-col p-5 sm:p-6 lg:p-7">
                <h3 className="text-lg font-medium tracking-tight text-white sm:text-xl">
                  {job.title}
                </h3>

                <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-white/50">
                  {jobDescription(job)}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-2">
                  {job.location && <MetaPill icon={MapPin}>{job.location}</MetaPill>}
                  {workplaceLabel(job) && (
                    <MetaPill icon={Briefcase}>{workplaceLabel(job)}</MetaPill>
                  )}
                  {salaryLabel(job) && <MetaPill icon={Clock}>{salaryLabel(job)}</MetaPill>}
                </div>

                <Link
                  href={`/jobs/${job.id}`}
                  className="mt-auto inline-flex items-center gap-1.5 pt-10 text-sm font-medium text-white/90 transition-colors hover:text-white"
                >
                  Apply Now
                  <ArrowRight
                    className="size-4 text-white/50 transition-transform duration-200 group-hover/card:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="mt-10 rounded-2xl border border-white/[0.08] bg-[#151516] px-6 py-10 text-center">
            {loadFailed ? (
              <>
                <h3 className="text-base font-medium text-white">
                  Recent jobs are temporarily unavailable
                </h3>
                <p className="mt-2 text-sm text-white/50">
                  Please try again or browse all job listings.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
                >
                  <RotateCw className="size-4" />
                  Retry
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-base font-medium text-white">
                  No recent jobs available
                </h3>
                <p className="mt-2 text-sm text-white/50">
                  New opportunities will appear here when recruiters post them.
                </p>
              </>
            )}
          </div>
        )}

        <div className="mt-10 flex justify-center sm:mt-12">
          <Button
            nativeButton={false}
            render={<Link href="/jobs" />}
            className="h-10 rounded-lg bg-white px-5 text-sm font-medium text-black hover:bg-white/90"
          >
            View all job open
          </Button>
        </div>
      </div>
    </section>
  );
}
