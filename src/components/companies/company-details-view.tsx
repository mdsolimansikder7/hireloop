"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, ExternalLink, MapPin } from "lucide-react";

import type { CompanyDetails } from "@/lib/api/jobs";
import { formatSalaryValue } from "@/lib/format";

export function CompanyDetailsView({ company, jobs }: CompanyDetails) {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-5 pb-16 pt-28 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/company" className="inline-flex items-center gap-2 text-xs text-[#92929b] transition hover:text-white">
          <ArrowLeft className="size-3.5" />
          All companies
        </Link>

        <section className="mt-6 rounded-2xl border border-white/[0.08] bg-[#111111] p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <CompanyLogo name={company.name} image={company.logoUrl} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-violet-300">
                Company profile
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{company.name}</h1>
              {company.industry ? <p className="mt-2 text-sm text-[#92929b]">{company.industry}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {company.size ? <InfoChip>{company.size} employees</InfoChip> : null}
                <InfoChip>{company.jobCount} posted {company.jobCount === 1 ? "job" : "jobs"}</InfoChip>
                <InfoChip>{company.openJobCount} open {company.openJobCount === 1 ? "role" : "roles"}</InfoChip>
                {company.locations.map((location) => (
                  <InfoChip key={location}><MapPin className="size-3" />{location}</InfoChip>
                ))}
              </div>
              {company.description ? (
                <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-6 text-[#aaaab3]">
                  {company.description}
                </p>
              ) : null}
              {company.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-violet-200 hover:text-violet-100"
                >
                  Visit company website
                  <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-violet-300">Company openings</p>
              <h2 className="mt-2 text-xl font-semibold">Jobs at {company.name}</h2>
            </div>
            <span className="text-xs text-[#85858e]">
              {jobs.length} {jobs.length === 1 ? "job post" : "job posts"}
            </span>
          </div>

          {jobs.length ? (
            <div className="mt-4 space-y-3">
              {jobs.map((job) => {
                const salary = formatSalaryValue(job.salaryMin, job.salaryMax);
                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    aria-disabled={job.status !== "open"}
                    className={`group flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-[#111111] p-4 transition sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
                      job.status === "open"
                        ? "hover:border-violet-300/30"
                        : "opacity-70 hover:border-white/[0.12]"
                    }`}
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold group-hover:text-violet-200 sm:text-base">{job.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#85858e]">
                        {job.location ? <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{job.location}</span> : null}
                        {job.type ? <span>{job.type}</span> : null}
                        {job.remote ? <span>Remote</span> : null}
                        {salary ? <span>{salary}{job.salaryFrequency ? ` / ${job.salaryFrequency.replace(/^per\s+/i, "")}` : ""}</span> : null}
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                      job.status === "open" ? "text-violet-200" : "text-[#92929b]"
                    }`}>
                      {job.status === "open" ? (
                        <>View job <ArrowUpRight className="size-3.5" /></>
                      ) : (
                        <>Closed <BriefcaseBusiness className="size-3.5" /></>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-[#111111] px-5 py-12 text-center">
              <BriefcaseBusiness className="mx-auto size-6 text-[#676771]" />
              <h3 className="mt-3 text-sm font-medium">No job posts yet</h3>
              <p className="mt-1 text-xs text-[#777781]">
                Check back later to see roles from {company.name}.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function CompanyLogo({ name, image }: { name: string; image: string | null }) {
  return (
    <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[#202027] text-lg font-semibold text-violet-200">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "C"
      )}
    </span>
  );
}

function InfoChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] text-[#aaaab3]">
      {children}
    </span>
  );
}
