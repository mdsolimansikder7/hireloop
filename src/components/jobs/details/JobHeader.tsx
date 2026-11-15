"use client";

import * as React from "react";
import { Building2, CheckCircle2 } from "lucide-react";

import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { ApplyButton } from "@/components/jobs/details/ApplyButton";
import type { Job } from "@/lib/api/jobs";

function CompanyLogo({
  logoUrl,
  companyName,
}: {
  logoUrl?: string | null;
  companyName?: string | null;
}) {
  const initials = (
    companyName
      ?.split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("") ?? ""
  )
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-white/10 bg-gradient-to-br from-[#1c1c1c] to-[#0c0c0c] text-base font-semibold text-[#c7d2ff] shadow-inner">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={companyName ?? "Company logo"}
          className="size-full object-cover"
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <Building2 className="size-6 text-[#9ca3af]" aria-hidden="true" />
      )}
    </div>
  );
}

interface JobHeaderProps {
  job: Job;
  onToggleSave?: (jobId: string, saved: boolean) => void | Promise<void>;
  onApply?: (jobId: string) => void | Promise<void>;
}

export function JobHeader({ job, onToggleSave, onApply }: JobHeaderProps) {
  return (
    <header className="rounded-[16px] border border-white/[0.08] bg-gradient-to-r from-[#161616] to-[#0f0f0f] p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Side: Logo + Title info */}
        <div className="flex items-center gap-5">
          <CompanyLogo logoUrl={job.logoUrl} companyName={job.companyName} />

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[26px]">
              {job.title}
            </h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
              <span className="text-[15px] font-medium text-[#9ca3af] sm:text-base">
                {job.companyName}
              </span>

              {job.verifiedEmployer && (
                <>
                  <span
                    className="size-1 rounded-full bg-[#6b7280]"
                    aria-hidden="true"
                  />
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#34d399]">
                    <CheckCircle2
                      className="size-3.5 fill-[#34d399] text-[#111111]"
                      aria-hidden="true"
                    />
                    Verified Employer
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Bookmark + Apply Now */}
        <div className="flex items-center gap-3 pt-2 sm:pt-0">
          <SaveJobButton
            jobId={job.id}
            saved={job.isSaved === true}
            onToggle={onToggleSave}
            className="relative top-auto right-auto grid size-10 shrink-0 place-items-center rounded-[10px] border border-white/[0.08] bg-[#1a1a1a] text-[#9ca3af] transition-colors hover:bg-[#242424] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4ff5] disabled:pointer-events-none disabled:opacity-40"
            iconClassName="size-[18px]"
          />

          <ApplyButton
            jobId={job.id}
            initialHasApplied={job.hasApplied === true}
            isOwner={job.isOwner === true}
            status={job.status}
            className="flex-1 sm:flex-none"
            onApply={onApply}
          />
        </div>
      </div>
    </header>
  );
}
