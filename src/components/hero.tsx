"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Briefcase,
  Building2,
  MapPin,
  Search,
  Sparkle,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { fetchPlatformStats, type PlatformStats } from "@/lib/api/jobs";

const trendingPositions = [
  "Product Designer",
  "AI Engineering",
  "DevOps Engineer",
];

const statCards = [
  { key: "activeJobs", label: "Active Jobs", icon: Briefcase },
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "jobSeekers", label: "Job Seekers", icon: Users },
  { key: "satisfactionRate", label: "Satisfaction Rate", icon: Sparkle },
] as const;

function formatStat(value: number | null | undefined, percent = false) {
  if (value == null) return "—";
  if (percent) return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)}%`;
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function Hero() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPlatformStats()
      .then((result) => {
        if (!cancelled) setStats(result);
      })
      .catch((error: unknown) => {
        console.error("[hero] Could not load platform statistics", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative flex-1 overflow-hidden bg-[#050506]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#262628_0%,#0a0a0b_10%,#010102_28%)]"
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-4 pt-10 text-center sm:px-6 sm:pt-16">
        <div className="mx-auto flex w-full max-w-sm items-center gap-4">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20" />
          <Badge
            variant="outline"
            className="h-8 shrink-0 gap-2 rounded-full border-white/10 bg-[#121214] px-2 pr-3 text-[10px] font-medium text-white/45 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.9)]"
          >
            <span className="grid size-5 place-items-center rounded-md bg-gradient-to-b from-[#ffab5e] to-[#f05a00] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
              <Briefcase
                className="size-3"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </span>
            <span className="text-[11px] font-semibold text-white sm:text-xs">
              {stats ? formatStat(stats.newJobsThisMonth) : "—"}
            </span>
            <span className="text-[9px] font-medium tracking-[0.18em] uppercase sm:text-[10px]">
              New jobs this month
            </span>
          </Badge>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20" />
        </div>

        <h1 className="mx-auto mt-6 max-w-3xl text-balance text-[2rem] leading-[1.1] font-semibold tracking-tight text-white sm:mt-7 sm:text-5xl lg:text-6xl">
          Find Your Dream Job Today
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-6 text-white/55 sm:text-base sm:leading-7">
          HireLoop connects top talent with world-class companies. Browse
          thousands of curated opportunities and land your next role — faster.
        </p>

        <form
          role="search"
          className="mx-auto mt-8 flex w-full max-w-4xl flex-col gap-2 rounded-2xl border border-white/10 bg-[#0b0b0c]/85 p-2 shadow-[0_24px_80px_-32px_rgba(0,0,0,1)] backdrop-blur-md sm:mt-10 min-[520px]:flex-row min-[520px]:items-center min-[520px]:gap-0 min-[520px]:p-1.5"
        >
          <div className="flex flex-1 items-center gap-2.5 px-2 sm:px-3">
            <Search
              className="size-4 shrink-0 text-white/35"
              aria-hidden="true"
            />
            <Input
              type="search"
              name="q"
              aria-label="Job title, skill or company"
              placeholder="Job title, skill or company"
              className="h-11 border-0 bg-transparent px-0 text-sm text-white shadow-none placeholder:text-white/40 focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
            />
          </div>

          <Separator
            orientation="vertical"
            className="mx-1 hidden h-6 self-center bg-white/10 min-[520px]:block"
          />

          <div className="flex flex-1 items-center gap-2.5 border-t border-white/10 px-2 pt-2 min-[520px]:border-t-0 min-[520px]:px-3 min-[520px]:pt-0">
            <MapPin
              className="size-4 shrink-0 text-white/35"
              aria-hidden="true"
            />
            <Input
              type="text"
              name="location"
              aria-label="Location or Remote"
              placeholder="Location or Remote"
              className="h-11 border-0 bg-transparent px-0 text-sm text-white shadow-none placeholder:text-white/40 focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
            />
          </div>

          <Button
            type="submit"
            aria-label="Search jobs"
            className="h-11 w-full shrink-0 rounded-lg bg-[#5c53fe] text-white shadow-[0_10px_30px_-10px_rgba(92,83,254,0.9)] hover:bg-[#6d64ff] min-[520px]:size-11 min-[520px]:w-11 min-[520px]:px-0"
          >
            <Search className="size-4" aria-hidden="true" />
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="mr-1 text-[11px] font-medium text-white/35">
            Trending Position
          </span>
          {trendingPositions.map((position) => (
            <Button
              key={position}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-full border-white/10 bg-white/[0.03] px-3 text-[11px] font-medium text-white/65 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
            >
              {position}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative mt-16 overflow-hidden sm:mt-28">
        <div aria-hidden="true" className="absolute inset-0">
          <Image
            src="/images/globe.png"
            alt=""
            width={1440}
            height={1882}
            priority
            sizes="100vw"
            style={{ top: "calc(60px - min(54vw, 864px))" }}
            className="absolute left-1/2 w-full max-w-[1600px] -translate-x-1/2"
          />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#010102] via-[#010102]/40 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center px-4 pt-24 pb-8 sm:px-6 sm:pt-28 sm:pb-10">
          <p className="mx-auto max-w-md text-balance text-center text-lg leading-snug font-medium text-white/90 sm:max-w-2xl sm:text-2xl lg:text-3xl">
            {stats
              ? `Connecting ${stats.jobSeekers.toLocaleString()} job seekers with their next opportunity.`
              : "Connecting job seekers with their next opportunity."}
          </p>

          <div className="mt-10 grid w-full grid-cols-2 gap-3 min-[520px]:grid-cols-4 sm:mt-12 sm:gap-4">
            {statCards.map(({ key, label, icon: Icon }) => {
              const value = stats?.[key];
              return (
              <Card
                key={label}
                className="min-h-[140px] justify-between gap-0 rounded-2xl border border-white/[0.07] bg-[#0b0b0d]/88 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_60px_-30px_rgba(0,0,0,0.9)] ring-0 backdrop-blur-md min-[520px]:min-h-[150px] sm:min-h-[180px] sm:p-6 lg:min-h-[200px]"
              >
                <span className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/[0.03] sm:size-9">
                  <Icon
                    className="size-4 text-white/80 sm:size-5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <div className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                    {key === "satisfactionRate"
                      ? formatStat(value, true)
                      : formatStat(value)}
                  </div>
                  <div className="mt-1 text-[11px] text-white/45 sm:text-xs">
                    {label}
                  </div>
                </div>
              </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
