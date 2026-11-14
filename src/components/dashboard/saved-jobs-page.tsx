"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpRight,
  Banknote,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  LayoutDashboard,
  MapPin,
  Search,
  Settings,
  Upload,
  X,
} from "lucide-react";

import { ApplyButton } from "@/components/jobs/details/ApplyButton";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { Logo } from "@/components/logo";
import { SeekerSidebarActions } from "@/components/dashboard/seeker-sidebar-actions";
import { useToast } from "@/components/toast-provider";
import {
  fetchJobs,
  fetchSavedJobs,
  toggleSavedJob,
  type Job,
  type SavedJobRecord,
} from "@/lib/api/jobs";

type SortMode = "recent" | "closing" | "salary";

function normalizeId(value: string) {
  return value.trim().toLowerCase();
}

function titleCase(value: string | null | undefined) {
  if (!value) return null;
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readClosingDate(job: Job): Date | null {
  const fields = job as Job & {
    closingAt?: unknown;
    closeAt?: unknown;
    expiresAt?: unknown;
  };
  const value = fields.closingAt ?? fields.closeAt ?? fields.expiresAt;
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function relativeSavedDate(value: string | null, now: number) {
  const safeDate = value ? new Date(value) : null;
  if (!safeDate || Number.isNaN(safeDate.getTime())) return "Saved";
  const hours = Math.max(0, Math.floor((now - safeDate.getTime()) / 3_600_000));
  if (hours < 1) return "Saved just now";
  if (hours < 24) return `Saved ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Saved ${days}d ago`;
}

function closingLabel(date: Date | null, now: number) {
  if (!date) return null;
  const days = Math.ceil((date.getTime() - now) / 86_400_000);
  if (days < 0) return "Closed";
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes in 1 day";
  return `Closes in ${days} days`;
}

function formatSalary(job: Job) {
  if (job.salaryMin == null && job.salaryMax == null) return null;
  const currency =
    typeof job.currency === "string" && /^[A-Z]{3}$/i.test(job.currency)
      ? job.currency.toUpperCase()
      : null;
  const formatter = new Intl.NumberFormat(undefined, {
    ...(currency ? { style: "currency" as const, currency } : {}),
    maximumFractionDigits: 0,
  });
  if (job.salaryMin != null && job.salaryMax != null) {
    return `${formatter.format(job.salaryMin)} – ${formatter.format(job.salaryMax)}`;
  }
  return formatter.format(job.salaryMin ?? job.salaryMax ?? 0);
}

export function SavedJobsPage({
  userId,
  name,
  image,
}: {
  userId: string;
  name: string;
  image: string | null;
}) {
  const { showToast } = useToast();
  const [records, setRecords] = useState<SavedJobRecord[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [visibleCount, setVisibleCount] = useState(8);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  const loadSavedJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [savedRecords, jobsResponse] = await Promise.all([
        fetchSavedJobs(userId),
        fetchJobs({ page: 1, limit: 100 }),
      ]);
      setRecords(savedRecords);
      setJobs(jobsResponse.data);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load saved jobs.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSavedJobs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSavedJobs]);

  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const savedSet = useMemo(
    () => new Set(records.map((record) => normalizeId(record.jobId))),
    [records],
  );

  const savedJobs = useMemo(() => {
    const recordMap = new Map(
      records.map((record) => [normalizeId(record.jobId), record]),
    );
    return jobs
      .filter((job) => savedSet.has(normalizeId(job.id)))
      .map((job) => ({
        job,
        savedAt: recordMap.get(normalizeId(job.id))?.createdAt ?? null,
        closesAt: readClosingDate(job),
      }));
  }, [jobs, records, savedSet]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { job } of savedJobs) {
      const category =
        job.companyOverview?.industry?.trim() || titleCase(job.type) || "Other";
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return [
      { id: "all", label: "All Saved", count: savedJobs.length },
      ...Array.from(counts, ([label, count]) => ({
        id: label.toLowerCase(),
        label,
        count,
      })),
    ];
  }, [savedJobs]);

  const closingSoonCount =
    now === null
      ? null
      : savedJobs.filter(({ closesAt }) => {
          if (!closesAt) return false;
          const remaining = closesAt.getTime() - now;
          return remaining >= 0 && remaining <= 7 * 86_400_000;
        }).length;

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const categoryLabel = categories.find(
      (category) => category.id === activeCategory,
    )?.label;
    const matching = savedJobs.filter(({ job }) => {
      const category =
        job.companyOverview?.industry?.trim() || titleCase(job.type) || "Other";
      if (activeCategory !== "all" && category !== categoryLabel) return false;
      if (!query) return true;
      return [job.title, job.companyName, job.location, category]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    });

    return matching.sort((a, b) => {
      if (sort === "salary") {
        return (b.job.salaryMax ?? b.job.salaryMin ?? 0) -
          (a.job.salaryMax ?? a.job.salaryMin ?? 0);
      }
      if (sort === "closing") {
        return (a.closesAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (b.closesAt?.getTime() ?? Number.MAX_SAFE_INTEGER);
      }
      const aDate = a.savedAt ? new Date(a.savedAt).getTime() : 0;
      const bDate = b.savedAt ? new Date(b.savedAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [activeCategory, categories, savedJobs, search, sort]);

  const handleToggleSave = useCallback(
    async (jobId: string, saved: boolean) => {
      const previous = records;
      setRecords((current) =>
        saved
          ? current
          : current.filter(
              (record) => normalizeId(record.jobId) !== normalizeId(jobId),
            ),
      );
      try {
        await toggleSavedJob(jobId, saved);
        showToast(
          saved ? "Job saved" : "Job removed from saved jobs",
          "success",
        );
      } catch (caught) {
        setRecords(previous);
        showToast(
          caught instanceof Error
            ? caught.message
            : "Could not update saved jobs.",
          "error",
        );
      }
    },
    [records, showToast],
  );

  const onResumeSelected = (file: File | undefined) => {
    if (file) setUploadName(file.name);
  };

  return (
    <main className="min-h-screen bg-[#0b0b0d] p-2.5 text-white sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.25rem)] max-w-[1600px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d10] shadow-2xl sm:min-h-[calc(100vh-2rem)]">
        <aside className="hidden w-[228px] shrink-0 flex-col border-r border-white/[0.07] bg-[#09090b] p-4 lg:flex">
          <Logo className="mb-7 px-1 [&_img]:h-[28px]" />
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#151519] px-3 py-2.5">
            <Avatar name={name} image={image} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{name}</p>
              <p className="mt-0.5 text-[10px] text-[#85858e]">Job Seeker</p>
            </div>
          </div>
          <nav className="space-y-1">
            <SidebarLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} />
            <SidebarLink href="/jobs" label="Jobs" icon={BriefcaseBusiness} />
            <SidebarLink
              href="/saved-jobs"
              label="Saved Jobs"
              icon={Bookmark}
              active
            />
            <SidebarLink
              href="/applications"
              label="Applications"
              icon={FileText}
            />
            <SidebarLink href="/billing" label="Billing" icon={CreditCard} />
            <SidebarLink
              href="/settings"
              label="Settings"
              icon={Settings}
            />
          </nav>
          <div className="mt-auto">
            <Link
              href="/jobs"
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-white text-xs font-semibold text-black transition hover:bg-[#e8e8ed]"
            >
              <Search className="size-4" />
              Browse Jobs
            </Link>
            <SeekerSidebarActions />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-4 sm:px-6">
            <Logo className="mr-auto [&_img]:h-[26px] lg:hidden" />
            <label className="hidden h-9 w-full max-w-[390px] items-center gap-2 rounded-lg border border-white/[0.08] bg-[#111115] px-3 sm:flex">
              <Search className="size-4 shrink-0 text-[#777781]" />
              <input
                aria-label="Search saved jobs"
                placeholder="Search jobs, companies, or skills..."
                value={search}
                onChange={(event) => {
                  setSearch(event.currentTarget.value);
                  setVisibleCount(8);
                }}
                className="w-full bg-transparent text-xs outline-none placeholder:text-[#686872]"
              />
            </label>
            <button
              type="button"
              aria-label="Notifications"
              className="grid size-8 place-items-center rounded-lg text-[#aaaab3] hover:bg-white/[0.06] hover:text-white"
            >
              <Clock3 className="size-4" />
            </button>
            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-[#151519] px-2.5 text-[10px] font-medium text-white transition hover:bg-[#202025] sm:h-9 sm:px-3 sm:text-xs">
              <Upload className="size-3.5" />
              <span className="hidden sm:inline">
                {uploadName ? "Resume selected" : "Upload Resume"}
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="sr-only"
                onChange={(event) =>
                  onResumeSelected(event.currentTarget.files?.[0])
                }
              />
            </label>
            <Avatar name={name} image={image} />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-6 sm:pt-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-[22px] font-semibold tracking-tight sm:text-[25px]">
                  Saved Jobs
                </h1>
                <p className="mt-1 text-[11px] text-[#9696a0]">
                  Manage and track your bookmarked opportunities.
                </p>
              </div>
              <div className="flex gap-2">
                <SummaryCard
                  icon={Bookmark}
                  label="Total Saved"
                  value={loading ? "—" : records.length}
                  tone="text-white"
                />
                <SummaryCard
                  icon={Clock3}
                  label="Closing Soon"
                  value={loading || closingSoonCount === null ? "—" : closingSoonCount}
                  tone="text-amber-300"
                />
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-xs text-rose-200"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => void loadSavedJobs()}
                  className="rounded-md border border-rose-200/20 px-3 py-1.5 text-white hover:bg-rose-200/10"
                >
                  Retry
                </button>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#131317] px-3 py-2">
              <div className="flex max-w-full items-center gap-1 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] transition ${
                      activeCategory === category.id
                        ? "bg-[#29292f] text-white"
                        : "text-[#92929b] hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    {category.label}{" "}
                    <span className="ml-0.5 text-[#777781]">
                      ({category.count})
                    </span>
                  </button>
                ))}
              </div>
              <label className="flex shrink-0 items-center gap-2 text-[10px] text-[#85858e]">
                <ArrowDownWideNarrow className="size-3.5" />
                Sort by:
                <select
                  value={sort}
                  onChange={(event) => setSort(event.currentTarget.value as SortMode)}
                  className="h-7 rounded-md border border-white/10 bg-[#19191e] px-2 text-[10px] text-white outline-none"
                >
                  <option value="recent">Recently Saved</option>
                  <option value="closing">Closing Soon</option>
                  <option value="salary">Highest Salary</option>
                </select>
                <ChevronDown className="pointer-events-none -ml-6 size-3" />
              </label>
            </div>

            {loading ? (
              <div className="mt-3 space-y-3">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-[88px] animate-pulse rounded-xl border border-white/[0.06] bg-[#131317]"
                  />
                ))}
              </div>
            ) : error ? null : filteredJobs.length ? (
              <div className="mt-3 space-y-2.5">
                {filteredJobs.slice(0, visibleCount).map(({ job, savedAt, closesAt }) => (
                  <SavedJobCard
                    key={job.id}
                    job={job}
                    savedAt={savedAt}
                    closesAt={closesAt}
                    onToggleSave={handleToggleSave}
                    now={now ?? 0}
                  />
                ))}
              </div>
            ) : records.length ? (
              <EmptySavedJobs
                title="No jobs match this view"
                detail="Try another category or search term."
                onClear={() => {
                  setActiveCategory("all");
                  setSearch("");
                }}
              />
            ) : (
              <EmptySavedJobs
                title="No saved jobs yet"
                detail="Save interesting roles while browsing to keep them handy."
                href="/jobs"
                action="Browse jobs"
              />
            )}

            {!loading && !error && visibleCount < filteredJobs.length ? (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + 8)}
                className="mx-auto mt-5 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] text-[#aaaab3] transition hover:bg-white/[0.05] hover:text-white"
              >
                Load More <ChevronDown className="size-3" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#24242b] text-[10px] font-semibold text-white">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        name
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      )}
    </span>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${
        active
          ? "bg-[#29292f] text-white"
          : "text-[#92929b] hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Bookmark;
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <div className="flex h-[54px] min-w-[92px] items-center gap-2 rounded-lg border border-white/[0.07] bg-[#131317] px-2.5 sm:min-w-[112px] sm:px-3">
      <span className={`grid size-7 shrink-0 place-items-center rounded-md bg-white/[0.06] ${tone}`}>
        <Icon className="size-3.5" />
      </span>
      <div>
        <p className="whitespace-nowrap text-[9px] text-[#85858e]">{label}</p>
        <p className="mt-0.5 text-xs font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function SavedJobCard({
  job,
  savedAt,
  closesAt,
  onToggleSave,
  now,
}: {
  job: Job;
  savedAt: string | null;
  closesAt: Date | null;
  onToggleSave: (jobId: string, saved: boolean) => void | Promise<void>;
  now: number;
}) {
  const salary = formatSalary(job);
  const location = [
    job.location,
    job.remote ? "Remote" : titleCase(job.workMode),
  ]
    .filter(Boolean)
    .join(", ");
  const closes = now ? closingLabel(closesAt, now) : null;

  return (
    <article className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.07] bg-[#131317] px-3 py-3 transition hover:border-white/[0.14] sm:gap-4 sm:px-4">
      <Link
        href={`/jobs/${job.id}`}
        aria-label={`View ${job.title}`}
        className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/[0.07] bg-[#1c1c22] text-[#d0d0d8]"
      >
        {job.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={job.logoUrl} alt="" className="size-full object-cover" />
        ) : (
          <Building2 className="size-4" />
        )}
      </Link>
      <div className="min-w-[155px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className="text-xs font-semibold text-white hover:text-sky-200"
          >
            {job.title}
          </Link>
          {job.companyName ? (
            <span className="rounded border border-white/[0.07] bg-white/[0.04] px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-[#8d8d96]">
              {job.companyName}
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {location ? <MetaChip icon={MapPin}>{location}</MetaChip> : null}
          {salary ? <MetaChip icon={Banknote}>{salary}</MetaChip> : null}
          {job.type ? <MetaChip icon={BriefcaseBusiness}>{titleCase(job.type)}</MetaChip> : null}
        </div>
      </div>
      <div className="ml-auto flex w-full items-center justify-end gap-2 sm:w-auto sm:min-w-[210px]">
        <div className="mr-auto text-right sm:mr-1">
          <p className="text-[9px] text-[#85858e]">
            {now ? relativeSavedDate(savedAt, now) : "Saved"}
          </p>
          {closes ? (
            <p
              className={`mt-0.5 text-[9px] ${
                closes === "Closed" ? "text-rose-300" : "text-amber-300"
              }`}
            >
              {closes}
            </p>
          ) : null}
        </div>
        <SaveJobButton
          jobId={job.id}
          saved
          onToggle={onToggleSave}
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] text-[#a3a3ad] transition hover:bg-white/[0.06] hover:text-white"
          iconClassName="size-3.5"
          redirectPath="/saved-jobs"
        />
        <ApplyButton
          jobId={job.id}
          initialHasApplied={job.hasApplied}
          status={job.status}
          className="h-8 rounded-md bg-white px-2.5 text-[10px] font-semibold text-black hover:bg-[#e8e8ed]"
        />
      </div>
    </article>
  );
}

function MetaChip({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.07] bg-[#1a1a1f] px-1.5 py-1 text-[9px] text-[#a5a5ae]">
      <Icon className="size-2.5" />
      {children}
    </span>
  );
}

function EmptySavedJobs({
  title,
  detail,
  href,
  action,
  onClear,
}: {
  title: string;
  detail: string;
  href?: string;
  action?: string;
  onClear?: () => void;
}) {
  return (
    <div className="mt-3 flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-[#101013] px-4 text-center">
      <span className="grid size-9 place-items-center rounded-lg bg-white/[0.05] text-[#aaaab3]">
        {onClear ? <X className="size-4" /> : <Bookmark className="size-4" />}
      </span>
      <p className="mt-3 text-xs font-medium">{title}</p>
      <p className="mt-1 text-[10px] text-[#85858e]">{detail}</p>
      {href && action ? (
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-sky-300 hover:text-sky-200"
        >
          {action} <ArrowUpRight className="size-3" />
        </Link>
      ) : onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-sky-300 hover:text-sky-200"
        >
          Clear filters <Check className="size-3" />
        </button>
      ) : null}
    </div>
  );
}
