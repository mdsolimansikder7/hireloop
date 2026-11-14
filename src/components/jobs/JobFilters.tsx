"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, SlidersHorizontal } from "lucide-react";

import {
  JOB_TYPES,
  jobsParamsToQueryString,
  parseJobsFilters,
  type JobsFiltersState,
} from "@/lib/api/jobs";
import { formatCompactCount } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const WORK_MODES = ["Remote", "Hybrid", "On-site"];
const LEVELS = ["Junior", "Mid", "Senior", "Lead"];
const SALARY_OPTIONS = [
  { value: "", label: "Any" },
  { value: "50", label: "$50k+" },
  { value: "100", label: "$100k+" },
  { value: "150", label: "$150k+" },
];

const TYPE_BY_NORMALIZED_KEY: Record<string, string> = {
  fulltime: "Full-time",
  full: "Full-time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
  intern: "Internship",
  parttime: "Part-time",
  part: "Part-time",
};

function normalizeTypeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z]/g, "");
}

interface JobFiltersProps {
  facets?: Record<string, number>;
}

export function JobFilters({ facets }: JobFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();

  const filters = React.useMemo(
    () => parseJobsFilters(new URLSearchParams(paramsString)),
    [paramsString],
  );

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.workMode !== "" ||
    filters.level !== "" ||
    filters.salaryMin !== "";

  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (facets) {
      for (const [rawKey, count] of Object.entries(facets)) {
        const normalized = normalizeTypeKey(rawKey);
        const type = TYPE_BY_NORMALIZED_KEY[normalized];
        if (type) counts[type] = count;
      }
    }
    return counts;
  }, [facets]);

  const visibleTypes = React.useMemo(
    () => JOB_TYPES.filter((type) => (typeCounts[type] ?? 0) > 0),
    [typeCounts],
  );

  const update = (next: Partial<JobsFiltersState>) => {
    router.replace(
      `?${jobsParamsToQueryString({ ...filters, ...next, page: 1 })}`,
      { scroll: false },
    );
  };

  const toggleType = (type: string) => {
    const types = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    update({ types });
  };

  const selectWorkMode = (mode: string) => {
    update({ workMode: mode });
  };

  const selectLevel = (level: string) => {
    update({ level });
  };

  const selectSalary = (salaryMin: string) => {
    update({ salaryMin });
  };

  const clearAll = () => {
    update({
      types: [],
      workMode: "",
      level: "",
      salaryMin: "",
      q: "",
      page: 1,
    });
  };

  const filterPanel = (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="job-type-heading">
        <h3
          id="job-type-heading"
          className="text-[12px] font-medium text-[#9ca3af]"
        >
          Job Type
        </h3>
        <div className="mt-2 flex flex-col gap-1.5">
          {visibleTypes.map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center justify-between gap-2 py-1.5"
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={filters.types.includes(type)}
                  onChange={() => toggleType(type)}
                />
                <span className="grid size-4 shrink-0 place-items-center rounded-[4px] border border-white/15 bg-[#141414] peer-checked:border-transparent peer-checked:bg-white">
                  <Check
                    className="size-3 text-black opacity-0 peer-checked:opacity-100"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-[13px] text-white">{type}</span>
              </span>
              <span className="text-[11px] text-[#6b7280]">
                {formatCompactCount(typeCounts[type] ?? 0)}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="work-mode-heading">
        <h3
          id="work-mode-heading"
          className="text-[12px] font-medium text-[#9ca3af]"
        >
          Work Mode
        </h3>
        <div className="mt-2 flex flex-col gap-1.5">
          {WORK_MODES.map((mode) => (
            <label
              key={mode}
              className="flex cursor-pointer items-center gap-2.5 py-1.5"
            >
              <input
                type="radio"
                name="workMode"
                value={mode}
                checked={filters.workMode === mode}
                onChange={() => selectWorkMode(mode)}
                className="peer sr-only"
              />
              <span className="grid size-4 shrink-0 place-items-center rounded-[50%] border border-white/15 bg-[#141414] peer-checked:border-transparent peer-checked:bg-white">
                <span className="size-1.5 rounded-full bg-black opacity-0 peer-checked:opacity-100" />
              </span>
              <span className="text-[13px] text-white">{mode}</span>
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="level-heading">
        <h3 id="level-heading" className="text-[12px] font-medium text-[#9ca3af]">
          Experience Level
        </h3>
        <div className="mt-2 flex flex-col gap-1.5">
          {LEVELS.map((levelOption) => (
            <label
              key={levelOption}
              className="flex cursor-pointer items-center gap-2.5 py-1.5"
            >
              <input
                type="radio"
                name="level"
                value={levelOption}
                checked={filters.level === levelOption}
                onChange={() => selectLevel(levelOption)}
                className="peer sr-only"
              />
              <span className="grid size-4 shrink-0 place-items-center rounded-[50%] border border-white/15 bg-[#141414] peer-checked:border-transparent peer-checked:bg-white">
                <span className="size-1.5 rounded-full bg-black opacity-0 peer-checked:opacity-100" />
              </span>
              <span className="text-[13px] text-white">{levelOption}</span>
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="salary-heading">
        <h3 id="salary-heading" className="text-[12px] font-medium text-[#9ca3af]">
          Salary
        </h3>
        <div className="mt-2">
          <label htmlFor="salary-min" className="sr-only">
            Minimum salary
          </label>
          <select
            id="salary-min"
            value={filters.salaryMin}
            onChange={(event) => selectSalary(event.target.value)}
            className="h-10 w-full rounded-[10px] border border-white/10 bg-[#141414] px-3 text-sm text-white outline-none transition-colors focus:border-[#5b4ff5]/60"
          >
            {SALARY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );

  return (
    <>
      <aside className="hidden w-[220px] shrink-0 lg:sticky lg:top-28 lg:block">
        <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-white">Filters</h2>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className="text-[12px] font-medium text-[#9ca3af] transition-colors hover:text-white"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="mt-5">{filterPanel}</div>
        </div>
      </aside>

      <div className="lg:hidden">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                className="h-10 w-full rounded-[10px] border border-white/10 bg-[#111111] text-sm font-medium text-white hover:bg-white/5 hover:text-white"
              />
            }
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-[320px] gap-0 overflow-y-auto border-white/10 bg-[#1b1b1b] text-white"
          >
            <SheetHeader className="border-b border-white/10">
              <SheetTitle className="text-white">Filters</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-5 p-5">{filterPanel}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
