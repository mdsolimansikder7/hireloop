"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  CreditCard,
  Download,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  Users,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { SeekerSidebarActions } from "@/components/dashboard/seeker-sidebar-actions";

type Application = {
  id: string | null;
  jobId: string | null;
  jobTitle: string | null;
  companyName: string | null;
  logoUrl: string | null;
  status: string;
  createdAt: string | null;
};

type ApiResponse = {
  data: Application[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  stats: {
    total: number;
    shortlisted: number;
    interviews: number;
    successRate: number;
  };
};

type ViewMode = "active" | "archived";
const PAGE_SIZE = 5;

const activeStatuses = new Set(["applied", "reviewing", "shortlisted", "interview", "offer"]);
const archivedStatuses = new Set(["rejected", "hired"]);

function statusLabel(status: string) {
  switch (status) {
    case "reviewing":
      return "Review";
    case "shortlisted":
      return "Shortlisted";
    case "interview":
      return "Interview";
    case "offer":
      return "Offer";
    case "hired":
      return "Hired";
    case "rejected":
      return "Rejected";
    default:
      return "Applied";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "reviewing":
      return "border-amber-400/25 bg-amber-400/10 text-amber-300";
    case "shortlisted":
      return "border-sky-400/25 bg-sky-400/10 text-sky-300";
    case "interview":
      return "border-violet-400/25 bg-violet-400/10 text-violet-300";
    case "offer":
    case "hired":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
    case "rejected":
      return "border-rose-400/25 bg-rose-400/10 text-rose-300";
    default:
      return "border-white/10 bg-white/[0.05] text-[#aaaab3]";
  }
}

function relativeDate(value: string | null, now: number) {
  if (!now) return "—";
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  const hours = Math.max(0, Math.floor((now - date.getTime()) / 3_600_000));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export function ApplicationsPage({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("active");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState<number | null>(null);
  const [stats, setStats] = useState<ApiResponse["stats"]>({
    total: 0,
    shortlisted: 0,
    interviews: 0,
    successRate: 0,
  });

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/applications/mine?page=1&limit=100`,
        { credentials: "same-origin", cache: "no-store" },
      );
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(result?.error ?? "Could not load applications.");
      }
      const result = (await response.json()) as ApiResponse;
      setApplications(result.data);
      setTotal(result.meta.total);
      setStats(result.stats);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load applications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadApplications();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadApplications]);

  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const statuses = view === "active" ? activeStatuses : archivedStatuses;
    const query = search.trim().toLowerCase();
    return applications.filter((application) => {
      if (!statuses.has(application.status.toLowerCase())) return false;
      if (!query) return true;
      return [application.jobTitle, application.companyName]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [applications, search, view]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleApplications = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const exportPdf = () => window.print();

  return (
    <main className="min-h-screen bg-[#0b0b0d] p-2.5 text-white sm:p-4 print:bg-white print:p-0 print:text-black">
      <div className="mx-auto flex min-h-[calc(100vh-1.25rem)] max-w-[1600px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d10] shadow-2xl sm:min-h-[calc(100vh-2rem)] print:min-h-screen print:max-w-none print:rounded-none print:border-0 print:bg-white print:shadow-none">
        <aside className="hidden w-[228px] shrink-0 flex-col border-r border-white/[0.07] bg-[#09090b] p-4 lg:flex print:hidden">
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
            <SidebarLink href="/saved-jobs" label="Saved Jobs" icon={Bookmark} />
            <SidebarLink
              href="/applications"
              label="Applications"
              icon={FileText}
              active
            />
            <SidebarLink href="/billing" label="Billing" icon={CreditCard} />
            <SidebarLink href="/settings" label="Settings" icon={Settings} />
          </nav>
          <div className="mt-auto">
            <Link
              href="/jobs"
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-white text-xs font-semibold text-black transition hover:bg-[#e8e8ed]"
            >
              <BriefcaseBusiness className="size-4" />
              Find a job
            </Link>
            <SeekerSidebarActions />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-4 sm:px-6 print:hidden">
            <Logo className="mr-auto [&_img]:h-[26px] lg:hidden" />
            <label className="hidden h-9 w-full max-w-[390px] items-center gap-2 rounded-lg border border-white/[0.08] bg-[#111115] px-3 sm:flex">
              <Search className="size-4 shrink-0 text-[#777781]" />
              <input
                aria-label="Search applications"
                placeholder="Search applications..."
                value={search}
                onChange={(event) => {
                  setSearch(event.currentTarget.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-xs outline-none placeholder:text-[#686872]"
              />
            </label>
            <button
              type="button"
              aria-label="Notifications"
              className="grid size-8 place-items-center rounded-lg text-[#aaaab3] hover:bg-white/[0.06] hover:text-white"
            >
              <Bell className="size-4" />
            </button>
            <Avatar name={name} image={image} />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-6 sm:pt-7 print:overflow-visible">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-[22px] font-semibold tracking-tight sm:text-[25px]">
                  My Applications
                </h1>
                <p className="mt-1 text-[11px] text-[#9696a0]">
                  Track your job applications and interview progress in real-time.
                </p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <div className="flex rounded-lg border border-white/[0.08] bg-[#141418] p-0.5">
                  {(["active", "archived"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setView(item);
                        setPage(1);
                      }}
                      className={`rounded-md px-3 py-1.5 text-[10px] capitalize transition ${
                        view === item
                          ? "bg-[#29292f] text-white"
                          : "text-[#85858e] hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={exportPdf}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-white px-2.5 text-[10px] font-semibold text-black transition hover:bg-[#e8e8ed] sm:h-9 sm:px-3 sm:text-xs"
                >
                  <Download className="size-3.5" />
                  Export PDF
                </button>
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-xs text-rose-200 print:hidden"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => void loadApplications()}
                  className="rounded-md border border-rose-200/20 px-3 py-1.5 text-white hover:bg-rose-200/10"
                >
                  Retry
                </button>
              </div>
            ) : null}

            <section aria-label="Application statistics" className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Applied" value={stats.total} tone="text-white" icon={FileText} loading={loading} />
              <StatCard label="Shortlisted" value={stats.shortlisted} tone="text-violet-300" icon={Check} loading={loading} />
              <StatCard label="Interviews" value={stats.interviews} tone="text-amber-300" icon={Users} loading={loading} />
              <StatCard label="Success Rate" value={`${stats.successRate}%`} tone="text-emerald-400" icon={CircleCheck} loading={loading} />
            </section>

            <section className="mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-[#131317] print:border-gray-300 print:bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[9px] text-[#777781] print:border-gray-300 print:text-gray-600">
                      <th className="px-4 py-3 font-medium">Job Title</th>
                      <th className="px-3 py-3 font-medium">Company</th>
                      <th className="px-3 py-3 font-medium">Applied</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: PAGE_SIZE }, (_, index) => (
                        <tr key={index} className="border-b border-white/[0.05] last:border-0">
                          {Array.from({ length: 5 }, (_, cell) => (
                            <td key={cell} className="px-3 py-4">
                              <span className="block h-3 animate-pulse rounded bg-white/[0.06]" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : error ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-14 text-center text-xs text-[#8f8f99]">
                          Could not load applications. Please try again.
                        </td>
                      </tr>
                    ) : visibleApplications.length ? (
                      visibleApplications.map((application) => (
                        <ApplicationRow
                          key={application.id ?? `${application.jobTitle}-${application.createdAt}`}
                          application={application}
                          now={now ?? 0}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-14 text-center">
                          <span className="mx-auto grid size-9 place-items-center rounded-lg bg-white/[0.05] text-[#85858e]">
                            {view === "active" ? <FileText className="size-4" /> : <Clock3 className="size-4" />}
                          </span>
                          <p className="mt-3 text-xs font-medium">
                            {search ? "No applications match your search" : `No ${view} applications`}
                          </p>
                          <p className="mt-1 text-[10px] text-[#777781]">
                            {search
                              ? "Try another job title or company."
                              : "Applications you submit will appear here."}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-3 py-2.5 print:hidden">
                <p className="text-[9px] text-[#85858e]">
                  Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                  {filtered.length !== total ? ` (${total} total applications)` : " applications"}
                </p>
                <div className="flex items-center gap-1">
                  <PaginationButton
                    label="Previous page"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="size-3.5" />
                  </PaginationButton>
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .slice(Math.max(0, page - 2), Math.min(totalPages, page + 1))
                    .map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`grid size-7 place-items-center rounded-md text-[10px] ${
                          page === pageNumber
                            ? "bg-white font-semibold text-black"
                            : "text-[#92929b] hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  <PaginationButton
                    label="Next page"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    <ChevronRight className="size-3.5" />
                  </PaginationButton>
                </div>
              </div>
            </section>
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

function StatCard({
  label,
  value,
  tone,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | string;
  tone: string;
  icon: typeof FileText;
  loading: boolean;
}) {
  return (
    <div className="min-h-[76px] rounded-xl border border-white/[0.07] bg-[#131317] px-3.5 py-3">
      <div className="flex items-start justify-between">
        <span className="text-[9px] text-[#85858e]">{label}</span>
        <Icon className={`size-3.5 ${tone}`} />
      </div>
      <p className={`mt-2 text-[18px] font-semibold leading-none tabular-nums ${tone}`}>
        {loading ? <span className="inline-block h-5 w-8 animate-pulse rounded bg-white/10" /> : value}
      </p>
    </div>
  );
}

function ApplicationRow({
  application,
  now,
}: {
  application: Application;
  now: number;
}) {
  const status = application.status.toLowerCase();
  return (
    <tr className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.015] print:border-gray-200">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <CompanyMark name={application.companyName} image={application.logoUrl} />
          <div className="min-w-0">
            <p className="max-w-[200px] truncate text-[10px] font-medium text-white print:text-black">
              {application.jobTitle ?? "Job title unavailable"}
            </p>
            <p className="mt-0.5 text-[8px] text-[#85858e] print:text-gray-600">
              {status === "interview" ? "Interview stage" : "Job application"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-[9px] text-[#d0d0d6] print:text-gray-800">
        {application.companyName ?? "Company unavailable"}
      </td>
      <td className="px-3 py-3 text-[9px] text-[#92929b] print:text-gray-600">
        {relativeDate(application.createdAt, now)}
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex rounded-full border px-2 py-1 text-[8px] ${statusClass(status)} print:border-gray-300 print:bg-white print:text-gray-800`}>
          {statusLabel(status)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {application.jobId ? (
          <Link
            href={`/jobs/${application.jobId}`}
            className="text-[9px] text-[#c5c5ce] transition hover:text-white print:text-black"
          >
            Details
          </Link>
        ) : (
          <span className="text-[9px] text-[#6e6e77]">—</span>
        )}
      </td>
    </tr>
  );
}

function CompanyMark({
  name,
  image,
}: {
  name: string | null;
  image: string | null;
}) {
  return (
    <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-md border border-white/[0.07] bg-[#1d1d23] text-[9px] font-semibold text-[#d4d4db] print:border-gray-300 print:bg-gray-100 print:text-gray-700">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        name?.trim().charAt(0).toUpperCase() || <BriefcaseBusiness className="size-3" />
      )}
    </span>
  );
}

function PaginationButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-md text-[#92929b] transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
