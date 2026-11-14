import { Banknote, BarChart3, Clock, MapPin } from "lucide-react";

import { formatSalaryValue } from "@/lib/format";
import type { Job } from "@/lib/api/jobs";

interface JobStatsProps {
  job: Job;
}

function formatJobType(type?: string | null): string {
  if (!type) return "Full-time";
  if (type.toLowerCase() === "full-time") return "Full-time";
  if (type.toLowerCase() === "part-time") return "Part-time";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function JobStats({ job }: JobStatsProps) {
  const salaryText = formatSalaryValue(job.salaryMin, job.salaryMax) ?? "Competitive";
  const locationText = job.location ?? (job.remote ? "Remote" : "On-site");
  const jobTypeText = formatJobType(job.type);
  const experienceText =
    job.experience ??
    (job.level ? `${job.level.charAt(0).toUpperCase() + job.level.slice(1)} Level` : "5+ Years");

  const stats = [
    {
      icon: Banknote,
      label: "SALARY RANGE",
      value: salaryText,
    },
    {
      icon: MapPin,
      label: "LOCATION",
      value: locationText,
    },
    {
      icon: Clock,
      label: "JOB TYPE",
      value: jobTypeText,
    },
    {
      icon: BarChart3,
      label: "EXPERIENCE",
      value: experienceText,
    },
  ];

  return (
    <section aria-label="Job highlights" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex flex-col justify-center rounded-[14px] border border-white/[0.08] bg-[#111111] p-4 shadow-sm"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-[#9ca3af]">
              <Icon className="size-3.5 text-[#9ca3af]" aria-hidden="true" />
              <span>{stat.label}</span>
            </div>
            <div className="mt-2 text-[15px] font-semibold tracking-tight text-white">
              {stat.value}
            </div>
          </div>
        );
      })}
    </section>
  );
}
