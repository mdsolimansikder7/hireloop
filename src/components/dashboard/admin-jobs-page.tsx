"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  BriefcaseBusiness,
  Building2,
  Check,
  CircleHelp,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/toast-provider";

type AdminJob = {
  id: string;
  title: string;
  companyName: string;
  category: string;
  type: string;
  postedAt: string | null;
  status: "active" | "closed";
  applications: number;
};

type JobsData = {
  jobs: AdminJob[];
  categories: string[];
  stats: {
    totalJobs: number;
    activeJobs: number;
    closedJobs: number;
    totalApplications: number;
    averageApplications: number;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const navigation = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Companies", href: "#companies", icon: Building2 },
  { label: "Jobs", href: "/admin/jobs", icon: BriefcaseBusiness },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Settings", href: "/settings/sessions", icon: Settings },
];

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className="size-8 rounded-full border border-white/10 object-cover"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2c2c34] text-[10px] font-semibold text-white">
      {initials || "A"}
    </span>
  );
}

export function AdminJobsPage({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<JobsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: search.trim(),
        category,
        status,
        page: String(page),
      });
      const response = await fetch(`/api/admin/jobs?${params}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = (await response.json()) as
        | { data: JobsData }
        | { error: string };
      if (!response.ok || !("data" in result)) {
        throw new Error("error" in result ? result.error : "Could not load jobs.");
      }
      setData(result.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load jobs.");
    } finally {
      setLoading(false);
    }
  }, [category, page, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadJobs(), search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [loadJobs, search]);

  const changeStatus = async (job: AdminJob) => {
    const nextStatus = job.status === "active" ? "closed" : "open";
    const message =
      nextStatus === "closed"
        ? `Close “${job.title}”? It will no longer be active, but its history will be preserved.`
        : `Reopen “${job.title}”?`;
    if (!window.confirm(message)) return;

    setPendingId(job.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not update this job.");
      await loadJobs();
      showToast(
        nextStatus === "closed" ? "Job listing closed" : "Job listing reopened",
        "success",
      );
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : "Could not update this job.",
        "error",
      );
    } finally {
      setPendingId(null);
    }
  };

  const exportJobs = () => {
    if (!data?.jobs.length) return;
    const rows = [
      ["Title", "Company", "Category", "Type", "Date Posted", "Status", "Applications"],
      ...data.jobs.map((job) => [
        job.title,
        job.companyName,
        job.category,
        job.type,
        formatDate(job.postedAt),
        job.status === "active" ? "Active" : "Closed",
        String(job.applications),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
            return `"${safe.replaceAll('"', '""')}"`;
          })
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hireloop-jobs-page-${page}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const logout = async () => {
    setSigningOut(true);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        showToast(result.error.message ?? "Could not log out.", "error");
        setSigningOut(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "Could not log out.", "error");
      setSigningOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0b0d] p-2.5 text-white sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.25rem)] max-w-[1600px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d10] shadow-2xl sm:min-h-[calc(100vh-2rem)]">
        <aside className="hidden w-[210px] shrink-0 flex-col border-r border-white/[0.07] bg-[#09090b] p-4 lg:flex">
          <Logo className="mb-1 px-1 [&_img]:h-[28px]" />
          <p className="mb-6 px-1 text-[9px] text-[#777781]">Admin Console</p>
          <nav className="space-y-1">
            {navigation.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                aria-current={label === "Jobs" ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${
                  label === "Jobs"
                    ? "bg-[#29292f] text-white"
                    : "text-[#92929b] hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#151519] px-3 py-2.5">
            <Avatar name={name} image={image} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold">{name}</p>
              <p className="mt-0.5 text-[9px] text-[#85858e]">Super Admin</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              disabled={signingOut}
              aria-label={signingOut ? "Logging out" : "Log out"}
              className="text-[#85858e] hover:text-white disabled:opacity-50"
            >
              {signingOut ? <LoaderCircle className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-4 sm:px-6">
            <Logo className="mr-auto [&_img]:h-[26px] lg:hidden" />
            <label className="hidden h-8 w-full max-w-[300px] items-center gap-2 rounded-lg border border-white/[0.08] bg-[#111115] px-2.5 sm:flex">
              <Search className="size-3.5 text-[#777781]" />
              <input
                aria-label="Search all jobs"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search jobs, companies..."
                className="w-full bg-transparent text-[10px] text-white outline-none placeholder:text-[#686871]"
              />
            </label>
            <button type="button" aria-label="Notifications" className="text-[#aaaab2] hover:text-white">
              <CircleHelp className="size-3.5" />
            </button>
            <div className="hidden h-5 border-l border-white/10 sm:block" />
            <button type="button" className="hidden items-center gap-2 text-[10px] text-[#c8c8ce] sm:flex">
              Admin View
              <span className="text-[#777781]">⌄</span>
            </button>
            <Avatar name={name} image={image} />
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1200px]">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">Manage Jobs</h1>
                  <p className="mt-1 text-xs text-[#90909a]">
                    Oversee all active listings and historical job posts across the platform.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportJobs}
                  disabled={!data?.jobs.length}
                  className="inline-flex h-8 items-center gap-1.5 self-start rounded-lg border border-white/10 bg-[#151519] px-3 text-[10px] font-medium text-[#d3d3d8] hover:bg-white/[0.07] disabled:opacity-40 sm:self-auto"
                >
                  <Plus className="size-3.5" />
                  Export Jobs
                </button>
              </div>

              {error && (
                <div role="alert" className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-xs text-rose-200">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-end">
                <label className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#111115] px-3 sm:hidden">
                  <Search className="size-3.5 shrink-0 text-[#777781]" />
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search jobs, companies..."
                    aria-label="Search jobs"
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#686871]"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-1">
                  <label className="block">
                    <span className="mb-1.5 block text-[9px] text-[#85858e]">Category</span>
                    <select
                      aria-label="Filter by category"
                      value={category}
                      onChange={(event) => {
                        setCategory(event.target.value);
                        setPage(1);
                      }}
                      className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#111115] px-3 text-xs text-[#d5d5da] outline-none xl:max-w-[220px]"
                    >
                      <option value="all">All Categories</option>
                      {data?.categories.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <div>
                    <span className="mb-1.5 block text-[9px] text-[#85858e]">Status</span>
                    <div className="flex h-9 items-center gap-1 rounded-lg border border-white/[0.08] bg-[#111115] p-1">
                      {([
                        ["all", "All Jobs", data?.stats.totalJobs],
                        ["active", "Active", data?.stats.activeJobs],
                        ["closed", "Closed", data?.stats.closedJobs],
                      ] as const).map(([value, label, count]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setStatus(String(value));
                            setPage(1);
                          }}
                          className={`h-7 whitespace-nowrap rounded-md px-2.5 text-[10px] transition ${
                            status === value
                              ? "bg-[#25252b] text-white"
                              : "text-[#92929b] hover:text-white"
                          }`}
                        >
                          {label} {count === undefined ? "" : `(${count})`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="pb-2 text-[10px] text-[#777781] xl:ml-auto">
                  {loading ? "Updating…" : `${data?.pagination.total.toLocaleString() ?? 0} listings`}
                </p>
              </div>

              <section className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-[#111115]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[790px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[9px] font-medium uppercase tracking-[0.12em] text-[#777781]">
                        <th className="px-4 py-3 font-medium sm:px-5">Title</th>
                        <th className="px-3 py-3 font-medium">Company</th>
                        <th className="px-3 py-3 font-medium">Category</th>
                        <th className="px-3 py-3 font-medium">Type</th>
                        <th className="px-3 py-3 font-medium">Date Posted</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium sm:px-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {loading && !data ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-16 text-center text-xs text-[#85858e]">
                            <LoaderCircle className="mx-auto mb-2 size-4 animate-spin" />
                            Loading job listings…
                          </td>
                        </tr>
                      ) : data?.jobs.length ? (
                        data.jobs.map((job) => (
                          <tr key={job.id} className="text-xs hover:bg-white/[0.015]">
                            <td className="px-4 py-3.5 sm:px-5">
                              <Link href={`/jobs/${job.id}`} className="font-medium text-[#ededf0] hover:text-violet-200">
                                {job.title}
                              </Link>
                              <p className="mt-1 text-[9px] text-[#777781]">Ref: HL-{job.id.slice(-6).toUpperCase()}</p>
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#25252b] text-[9px] font-semibold text-[#d5d5da]">
                                  {job.companyName.charAt(0).toUpperCase() || "C"}
                                </span>
                                <span className="max-w-32 truncate text-[#c5c5cc]">{job.companyName}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-[9px] text-[#b8b8c0]">
                                {job.category}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-[10px] text-[#b4b4bd]">{job.type}</td>
                            <td className="whitespace-nowrap px-3 py-3.5 text-[10px] text-[#92929b]">{formatDate(job.postedAt)}</td>
                            <td className="px-3 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] ${
                                job.status === "active"
                                  ? "bg-emerald-400/[0.09] text-emerald-300"
                                  : "bg-white/[0.08] text-[#a2a2ab]"
                              }`}>
                                <span className={`size-1.5 rounded-full ${job.status === "active" ? "bg-emerald-400" : "bg-[#777781]"}`} />
                                {job.status === "active" ? "Active" : "Closed"}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 sm:px-5">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={`/jobs/${job.id}`}
                                  aria-label={`View ${job.title}`}
                                  title="View listing"
                                  className="text-[#a5a5ae] hover:text-white"
                                >
                                  <Eye className="size-3.5" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => void changeStatus(job)}
                                  disabled={pendingId === job.id}
                                  aria-label={job.status === "active" ? `Close ${job.title}` : `Reopen ${job.title}`}
                                  title={job.status === "active" ? "Close listing (preserve history)" : "Reopen listing"}
                                  className="ml-1 text-[#a5a5ae] hover:text-rose-300 disabled:opacity-50"
                                >
                                  {pendingId === job.id ? (
                                    <LoaderCircle className="size-3.5 animate-spin" />
                                  ) : job.status === "active" ? (
                                    <Ban className="size-3.5" />
                                  ) : (
                                    <Check className="size-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-5 py-16 text-center">
                            <BriefcaseBusiness className="mx-auto mb-2 size-5 text-[#777781]" />
                            <p className="text-xs font-medium text-[#d0d0d5]">No job listings found</p>
                            <p className="mt-1 text-[10px] text-[#777781]">Try changing your search or filters.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <footer className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 sm:px-5">
                  <p className="text-[10px] text-[#85858e]">
                    {data?.pagination.total
                      ? `Showing ${(page - 1) * data.pagination.limit + 1}–${Math.min(page * data.pagination.limit, data.pagination.total)} of ${data.pagination.total}`
                      : "No results"}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page <= 1 || loading}
                      aria-label="Previous page"
                      className="flex size-7 items-center justify-center rounded-md border border-white/10 text-[#b8b8c0] hover:bg-white/[0.06] disabled:opacity-35"
                    >
                      <ArrowLeft className="size-3.5" />
                    </button>
                    <span className="min-w-12 text-center text-[10px] text-[#a2a2ab]">
                      {data?.pagination.totalPages ? `${page} / ${data.pagination.totalPages}` : "0 / 0"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((current) => current + 1)}
                      disabled={!data || page >= data.pagination.totalPages || loading}
                      aria-label="Next page"
                      className="flex size-7 items-center justify-center rounded-md border border-white/10 text-[#b8b8c0] hover:bg-white/[0.06] disabled:opacity-35"
                    >
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </footer>
              </section>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <article className="rounded-xl border border-white/[0.07] bg-[#121216] p-4">
                  <p className="flex items-center gap-2 text-[10px] text-[#9a9aa3]"><BriefcaseBusiness className="size-3.5" /> Active Listings</p>
                  <p className="mt-3 text-xl font-semibold tabular-nums">{data?.stats.activeJobs.toLocaleString() ?? "—"}</p>
                  <p className="mt-1 text-[9px] text-[#73737c]">Currently open across the platform</p>
                </article>
                <article className="rounded-xl border border-white/[0.07] bg-[#121216] p-4">
                  <p className="flex items-center gap-2 text-[10px] text-[#9a9aa3]"><Clock3 className="size-3.5" /> Applications</p>
                  <p className="mt-3 text-xl font-semibold tabular-nums">{data?.stats.totalApplications.toLocaleString() ?? "—"}</p>
                  <p className="mt-1 text-[9px] text-[#73737c]">Total submitted applications</p>
                </article>
                <article className="rounded-xl border border-white/[0.07] bg-[#121216] p-4">
                  <p className="flex items-center gap-2 text-[10px] text-[#9a9aa3]"><FileText className="size-3.5" /> Avg. Applications / Job</p>
                  <p className="mt-3 text-xl font-semibold tabular-nums">{data?.stats.averageApplications.toLocaleString() ?? "—"}</p>
                  <p className="mt-1 text-[9px] text-[#73737c]">Platform average across all listings</p>
                </article>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
