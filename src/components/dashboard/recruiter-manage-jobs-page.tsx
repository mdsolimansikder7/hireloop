"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  CircleCheck,
  Clock3,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/toast-provider";

type ManagedJob = {
  id: string;
  title: string;
  category: string;
  companyName: string;
  location: string;
  type: string;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  salaryFrequency: string | null;
  applicants: number;
  status: "active" | "closed";
  deadline: string | null;
  postedAt: string | null;
};

type StatusFilter = "all" | "active" | "closed";

const navigation = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Add Job", href: "/recruiter/jobs/new", icon: Plus },
  { label: "Manage Jobs", href: "/recruiter/jobs", icon: BriefcaseBusiness },
  { label: "Applications", href: "/recruiter/applications", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

function formatMoney(value: number, currency: string | null) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency && /^[A-Z]{3}$/i.test(currency) ? currency : "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency ?? ""}`.trim();
  }
}

function salaryLabel(job: ManagedJob) {
  if (job.salaryMin === null && job.salaryMax === null) return "Not specified";
  const min = job.salaryMin === null ? null : formatMoney(job.salaryMin, job.currency);
  const max = job.salaryMax === null ? null : formatMoney(job.salaryMax, job.currency);
  const range = min && max ? `${min} – ${max}` : min ?? max ?? "";
  const frequency = job.salaryFrequency?.replace(/^per\s+/i, "/") ?? "";
  return `${range}${frequency ? ` ${frequency}` : ""}`;
}

function formatDate(value: string | null) {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function RecruiterManageJobsPage({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<ManagedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmingJob, setConfirmingJob] = useState<ManagedJob | null>(null);
  const [deletingJob, setDeletingJob] = useState<ManagedJob | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/recruiter/jobs", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = (await response.json()) as
        | { data: ManagedJob[] }
        | { error: string };
      if (!response.ok || !("data" in result)) {
        throw new Error(
          "error" in result ? result.error : "Could not load your job posts.",
        );
      }
      setJobs(result.data);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load your job posts.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadJobs(), 0);
    return () => window.clearTimeout(timer);
  }, [loadJobs]);

  const visibleJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesStatus =
        statusFilter === "all" || job.status === statusFilter;
      const matchesQuery =
        !query ||
        [job.title, job.category, job.companyName, job.location]
          .some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [jobs, search, statusFilter]);

  const changeStatus = async (job: ManagedJob) => {
    const nextStatus = job.status === "active" ? "closed" : "open";
    setUpdatingId(job.id);
    setError(null);
    try {
      const response = await fetch(`/api/recruiter/jobs/${job.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Could not update this job.");
      }
      setJobs((current) =>
        current.map((item) =>
          item.id === job.id
            ? { ...item, status: nextStatus === "open" ? "active" : "closed" }
            : item,
        ),
      );
      setConfirmingJob(null);
      showToast(
        nextStatus === "open" ? "Job listing reopened" : "Job listing closed",
        "success",
      );
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : "Could not update this job.",
        "error",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteJob = async (job: ManagedJob) => {
    setDeletingId(job.id);
    setError(null);
    try {
      const response = await fetch(`/api/recruiter/jobs/${job.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Could not delete this job.");
      }
      setJobs((current) => current.filter((item) => item.id !== job.id));
      setDeletingJob(null);
      showToast("Job post deleted. Existing applications were kept.", "success");
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : "Could not delete this job.",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
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
          <Logo className="mb-7 px-1 [&_img]:h-[28px]" />
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#151519] px-3 py-2.5">
            <Avatar name={name} image={image} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{name}</p>
              <p className="mt-0.5 text-[10px] text-[#85858e]">Recruiter</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navigation.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                aria-current={label === "Manage Jobs" ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${
                  label === "Manage Jobs"
                    ? "bg-[#29292f] text-white"
                    : "text-[#92929b] hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={signingOut}
            className="mt-auto flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-[#92929b] transition hover:bg-white/[0.05] hover:text-white disabled:opacity-60"
          >
            <LogOut className="size-4" />
            {signingOut ? "Logging out…" : "Log out"}
          </button>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-white/[0.07] px-4 sm:px-6 lg:justify-end">
            <Logo className="lg:hidden [&_img]:h-[26px]" />
            <Avatar name={name} image={image} />
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-5 sm:px-6 sm:pt-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[9px] text-[#85858e]">
                  Manage Jobs <span className="px-1.5">›</span> Job Listings &amp; Postings
                </p>
                <h1 className="mt-1 text-[21px] font-semibold tracking-tight sm:text-[24px]">
                  Manage Job Posts
                </h1>
                <p className="mt-1 text-[10px] text-[#85858e]">
                  Review live listings, monitor applicants, and update your job details.
                </p>
              </div>
              <Link
                href="/recruiter/jobs/new"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 text-[10px] font-semibold text-white transition hover:bg-violet-500"
              >
                <Plus className="size-3.5" />
                New Job Post
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#111115] px-3 sm:max-w-sm">
                <Search className="size-3.5 text-[#777781]" />
                <input
                  aria-label="Search job posts"
                  value={search}
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  placeholder="Search title, department, location..."
                  className="w-full bg-transparent text-[10px] outline-none placeholder:text-[#686872]"
                />
              </label>
              <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-[#111115] p-1">
                {(["all", "active", "closed"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    aria-pressed={statusFilter === filter}
                    className={`rounded-md px-2.5 py-1.5 text-[9px] capitalize transition ${
                      statusFilter === filter
                        ? "bg-[#29292f] text-white"
                        : "text-[#85858e] hover:text-white"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-xs text-rose-200">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => void loadJobs()}
                  className="rounded-md border border-rose-200/20 px-3 py-1.5 text-white hover:bg-rose-200/10"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.07] bg-[#131317]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead className="bg-[#1a1a1f]">
                    <tr className="text-[8px] font-medium uppercase tracking-wide text-[#777781]">
                      <th className="px-3 py-3">Job Title &amp; Dept</th>
                      <th className="px-3 py-3">Company &amp; Location</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Compensation</th>
                      <th className="px-3 py-3">Applicants</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Deadline</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {loading ? (
                      Array.from({ length: 5 }, (_, index) => (
                        <tr key={index} aria-hidden="true">
                          <td colSpan={8} className="px-3 py-4">
                            <div className="h-4 animate-pulse rounded bg-white/[0.04]" />
                          </td>
                        </tr>
                      ))
                    ) : visibleJobs.length ? (
                      visibleJobs.map((job) => (
                        <tr key={job.id} className="text-[9px] text-[#c5c5cd] transition hover:bg-white/[0.02]">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-violet-300">
                                <BriefcaseBusiness className="size-3.5" />
                              </span>
                              <span>
                                <span className="block font-medium text-white">{job.title}</span>
                                <span className="mt-0.5 block text-[8px] text-violet-300">{job.category}</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="block text-[#e1e1e6]">{job.companyName}</span>
                            <span className="mt-0.5 block text-[8px] text-[#85858e]">{job.location}{job.remote ? " · Remote" : ""}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[8px]">{job.type}</span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">{salaryLabel(job)}</td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[#c8c8d0]">
                              <Users className="size-3" />
                              {job.applicants} Candidate{job.applicants === 1 ? "" : "s"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] ${
                              job.status === "active"
                                ? "bg-emerald-400/10 text-emerald-300"
                                : "bg-white/[0.07] text-[#9999a3]"
                            }`}>
                              <span className={`size-1.5 rounded-full ${job.status === "active" ? "bg-emerald-400" : "bg-[#777781]"}`} />
                              {job.status === "active" ? "Active" : "Closed"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="block whitespace-nowrap">{formatDate(job.deadline)}</span>
                            <span className="mt-0.5 block text-[8px] text-[#777781]">
                              {job.postedAt ? `Posted ${formatDate(job.postedAt)}` : "Post date unavailable"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/recruiter/jobs/new?edit=${job.id}`}
                                className="rounded-md bg-violet-500/15 px-2.5 py-1.5 text-[8px] font-medium text-violet-200 transition hover:bg-violet-500/25"
                              >
                                Update
                              </Link>
                              <button
                                type="button"
                                aria-label={`Delete ${job.title}`}
                                title="Delete job post"
                                onClick={() => setDeletingJob(job)}
                                disabled={deletingId === job.id}
                                className="grid size-7 place-items-center rounded-md border border-rose-400/15 text-rose-300 transition hover:bg-rose-400/10 hover:text-rose-200 disabled:opacity-50"
                              >
                                {deletingId === job.id ? (
                                  <LoaderCircle className="size-3 animate-spin" />
                                ) : (
                                  <Trash2 className="size-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                title={job.status === "active" ? "Close job" : "Reopen job"}
                                onClick={() => setConfirmingJob(job)}
                                disabled={updatingId === job.id}
                                className="grid size-7 place-items-center rounded-md border border-white/[0.08] text-[#85858e] transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                              >
                                {updatingId === job.id ? (
                                  <LoaderCircle className="size-3 animate-spin" />
                                ) : job.status === "active" ? (
                                  <X className="size-3" />
                                ) : (
                                  <CircleCheck className="size-3" />
                                )}
                              </button>
                              <span className="relative group">
                                <button
                                  type="button"
                                  aria-label={`More details for ${job.title}`}
                                  className="grid size-7 place-items-center rounded-md text-[#85858e] hover:bg-white/[0.06] hover:text-white"
                                >
                                  <ChevronDown className="size-3.5" />
                                </button>
                                <span className="pointer-events-none absolute right-0 top-full z-10 mt-1 hidden w-32 rounded-md border border-white/10 bg-[#1a1a1f] p-2 text-[8px] text-[#aaaab3] shadow-lg group-hover:block">
                                  Posted {formatDate(job.postedAt)}
                                </span>
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-14 text-center">
                          <BriefcaseBusiness className="mx-auto size-5 text-[#676771]" />
                          <p className="mt-2 text-xs font-medium text-[#c8c8d0]">
                            {jobs.length ? "No matching job posts" : "No job posts yet"}
                          </p>
                          <p className="mt-1 text-[10px] text-[#777781]">
                            {jobs.length
                              ? "Try another search or status filter."
                              : "Create your first listing to start receiving applicants."}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2.5 text-[9px] text-[#777781]">
                <span>
                  {loading
                    ? "Loading job posts…"
                    : `Showing ${visibleJobs.length} of ${jobs.length} job posts`}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3" />
                  Updated just now
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {confirmingJob && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-status-dialog-title"
            className="w-full max-w-sm rounded-xl border border-white/10 bg-[#17171b] p-5 shadow-2xl"
          >
            <h2 id="job-status-dialog-title" className="text-sm font-semibold">
              {confirmingJob.status === "active" ? "Close this job post?" : "Reopen this job post?"}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#a3a3ad]">
              {confirmingJob.status === "active"
                ? `“${confirmingJob.title}” will no longer accept new applications.`
                : `“${confirmingJob.title}” will be marked active again.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingJob(null)}
                className="h-8 rounded-md border border-white/10 px-3 text-[10px] text-[#c8c8d0] hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void changeStatus(confirmingJob)}
                disabled={updatingId === confirmingJob.id}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-violet-600 px-3 text-[10px] font-medium text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {updatingId === confirmingJob.id && <LoaderCircle className="size-3 animate-spin" />}
                {confirmingJob.status === "active" ? "Close Job" : "Reopen Job"}
              </button>
            </div>
          </div>
        </div>
      )}
      {deletingJob && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="presentation">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="job-delete-dialog-title"
            className="w-full max-w-sm rounded-xl border border-white/10 bg-[#17171b] p-5 shadow-2xl"
          >
            <h2 id="job-delete-dialog-title" className="text-sm font-semibold">
              Delete this job post?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#a3a3ad]">
              “{deletingJob.title}” will be removed from job listings. Existing
              applications and their history will be kept.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingJob(null)}
                disabled={deletingId === deletingJob.id}
                className="h-8 rounded-md border border-white/10 px-3 text-[10px] text-[#c8c8d0] hover:bg-white/[0.04] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteJob(deletingJob)}
                disabled={deletingId === deletingJob.id}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-rose-600 px-3 text-[10px] font-medium text-white hover:bg-rose-500 disabled:opacity-60"
              >
                {deletingId === deletingJob.id && <LoaderCircle className="size-3 animate-spin" />}
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}
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
          .filter(Boolean)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "R"
      )}
    </span>
  );
}
