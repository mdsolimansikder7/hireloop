"use client";

import Link from "next/link";
import {
  Banknote,
  Briefcase,
  Building2,
  Clock,
  Flame,
  GraduationCap,
  Repeat,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { formatSalaryValue } from "@/lib/format";
import type { Job } from "@/lib/api/jobs";
import { cn } from "@/lib/utils";

const JOB_TYPE_ICONS: Record<string, LucideIcon> = {
  "Full-time": Clock,
  "Part-time": Clock,
  Contract: Repeat,
  Freelance: Briefcase,
  Internship: GraduationCap,
};

function CompanyInitials({ name }: { name?: string | null }) {
  const initials = (
    name
      ?.split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("") ?? ""
  )
    .slice(0, 2)
    .toUpperCase();

  return <span className="text-sm font-semibold">{initials || "?"}</span>;
}

function Chip({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[8px] border border-white/[0.08] bg-[#1a1a1a] px-2 py-1 text-[11px] font-medium text-[#9ca3af]",
        className,
      )}
    >
      <Icon className="size-3 text-[#9ca3af]" aria-hidden="true" />
      {children}
    </span>
  );
}

function EasyApplyChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#34d399]/30 bg-[#34d399]/10 px-2 py-1 text-[11px] font-medium text-[#34d399]">
      <Zap className="size-3" aria-hidden="true" />
      Easy Apply
    </span>
  );
}

function HotJobChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#fbbf24]/30 bg-[#fbbf24]/10 px-2 py-1 text-[11px] font-medium text-[#fbbf24]">
      <Flame className="size-3" aria-hidden="true" />
      Hot Job
    </span>
  );
}

interface JobCardProps {
  job: Job;
  saved: boolean;
  onToggleSave: (jobId: string, saved: boolean) => void | Promise<void>;
}

export function JobCard({ job, saved, onToggleSave }: JobCardProps) {
  const salary = formatSalaryValue(job.salaryMin, job.salaryMax);
  const TypeIcon = job.type ? JOB_TYPE_ICONS[job.type] ?? Briefcase : undefined;
  const location = [job.companyName, job.location, job.remote ? "(Remote)" : null]
    .filter(Boolean)
    .join(" • ");

  return (
    <article className="relative rounded-2xl border border-white/[0.08] bg-[#111111] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15">
      <Link
        href={`/jobs/${job.id}`}
        className="block rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4ff5]"
      >
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/10 bg-gradient-to-br from-[#262626] to-[#171717] text-sm font-semibold text-[#c7d2ff]">
            {job.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={job.logoUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <CompanyInitials name={job.companyName} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-semibold tracking-tight text-white">
              {job.title}
            </h3>
            {location ? (
              <p className="mt-1 text-[13px] text-[#6b7280]">{location}</p>
            ) : null}

            {(salary || job.type || job.easyApply || job.workMode === "Hybrid" || job.level || job.hot) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {salary ? <Chip icon={Banknote}>{salary}</Chip> : null}
                {job.type && TypeIcon ? (
                  <Chip icon={TypeIcon}>{job.type}</Chip>
                ) : null}
                {job.easyApply ? <EasyApplyChip /> : null}
                {job.workMode === "Hybrid" ? (
                  <Chip icon={Building2}>Hybrid</Chip>
                ) : null}
                {job.level ? <Chip icon={Star}>{job.level}</Chip> : null}
                {job.hot ? <HotJobChip /> : null}
              </div>
            )}
          </div>
        </div>
      </Link>

      <SaveJobButton jobId={job.id} saved={saved} onToggle={onToggleSave} />
    </article>
  );
}
