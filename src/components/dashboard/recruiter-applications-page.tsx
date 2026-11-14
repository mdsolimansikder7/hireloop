"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/logo";
import { useToast } from "@/components/toast-provider";
import { authClient } from "@/lib/auth-client";

const APPLICATION_STATUSES = [
  "applied",
  "reviewing",
  "shortlisted",
  "interview",
  "offer",
  "rejected",
  "hired",
] as const;
type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
type StatusFilter = "all" | ApplicationStatus;

type RecruiterApplication = {
  id: string;
  candidateName: string;
  candidateImage: string | null;
  jobId: string | null;
  jobTitle: string;
  companyName: string;
  appliedAt: string | null;
  experience: string;
  status: ApplicationStatus;
};

type ApplicationsPayload = {
  data: RecruiterApplication[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

const navigation = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Add Job", href: "/recruiter/jobs/new", icon: BriefcaseBusiness },
  { label: "Manage Jobs", href: "/recruiter/jobs", icon: BriefcaseBusiness },
  { label: "Applications", href: "/recruiter/applications", icon: FileText },
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

function statusLabel(status: string) {
  if (status === "applied") return "New";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusStyle(status: string) {
  switch (status) {
    case "reviewing":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    case "shortlisted":
      return "border-sky-400/20 bg-sky-400/10 text-sky-300";
    case "interview":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";
    case "offer":
    case "hired":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "rejected":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    default:
      return "border-sky-400/20 bg-sky-400/10 text-sky-300";
  }
}

export function RecruiterApplicationsPage({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [applications, setApplications] = useState<RecruiterApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const pageSize = 20;

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        status: statusFilter,
      });
      const response = await fetch(`/api/recruiter/applications?${params}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = (await response.json()) as
        | ApplicationsPayload
        | { error: string };
      if (!response.ok || !("data" in result)) {
        throw new Error(
          "error" in result ? result.error : "Could not load applicants.",
        );
      }
      setApplications(result.data);
      setTotal(result.meta.total);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load applicants.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadApplications(), 0);
    return () => window.clearTimeout(timer);
  }, [loadApplications]);

  const filteredApplications = applications.filter((application) =>
    [application.candidateName, application.jobTitle, application.companyName]
      .some((value) => value.toLowerCase().includes(search.trim().toLowerCase())),
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const updateStatus = async (
    application: RecruiterApplication,
    status: ApplicationStatus,
  ) => {
    if (application.status === status) return;
    setUpdatingId(application.id);
    try {
      const response = await fetch(`/api/applications/${application.id}/status`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not update application.");
      setApplications((current) =>
        current.map((item) =>
          item.id === application.id ? { ...item, status } : item,
        ),
      );
      showToast("Applicant status updated", "success");
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : "Could not update application.",
        "error",
      );
    } finally {
      setUpdatingId(null);
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
                aria-current={label === "Applications" ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${
                  label === "Applications"
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
            <div className="flex items-center gap-3">
              <span className="hidden text-[10px] text-[#85858e] sm:block">Recruiter Portal</span>
              <Avatar name={name} image={image} />
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-6 sm:pt-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[9px] text-[#85858e]">Recruiter Portal <span className="px-1.5">›</span> Applicants</p>
                <h1 className="mt-1 text-[21px] font-semibold tracking-tight sm:text-[24px]">Applications</h1>
                <p className="mt-1 text-[10px] text-[#85858e]">Review candidates who applied to your job posts.</p>
              </div>
              <span className="rounded-lg border border-white/[0.08] bg-[#131317] px-3 py-2 text-[10px] text-[#b8b8c0]">
                {total.toLocaleString()} applicant{total === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#111115] px-3 sm:max-w-sm">
                <Search className="size-3.5 text-[#777781]" />
                <input
                  aria-label="Search applicants"
                  value={search}
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  placeholder="Search candidate or job..."
                  className="w-full bg-transparent text-[10px] outline-none placeholder:text-[#686872]"
                />
              </label>
              <select
                aria-label="Filter by application status"
                value={statusFilter}
                onChange={(event) => {
                  setPage(1);
                  setStatusFilter(event.currentTarget.value as StatusFilter);
                }}
                className="h-9 rounded-lg border border-white/[0.08] bg-[#111115] px-3 text-[10px] text-[#c8c8d0] outline-none"
              >
                <option value="all">All statuses</option>
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>{statusLabel(status)}</option>
                ))}
              </select>
            </div>

            {error ? (
              <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-xs text-rose-200">
                <span>{error}</span>
                <button type="button" onClick={() => void loadApplications()} className="rounded-md border border-rose-200/20 px-3 py-1.5 text-white hover:bg-rose-200/10">Retry</button>
              </div>
            ) : null}

            <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-[#131317]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead className="bg-[#1a1a1f]">
                    <tr className="text-[9px] font-medium uppercase tracking-wide text-[#777781]">
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-3 py-3">Applied for</th>
                      <th className="px-3 py-3">Date applied</th>
                      <th className="px-3 py-3">Experience</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Update status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {loading ? (
                      [0, 1, 2, 3].map((row) => (
                        <tr key={row} aria-hidden="true">
                          <td colSpan={6} className="px-4 py-4"><div className="h-4 animate-pulse rounded bg-white/[0.04]" /></td>
                        </tr>
                      ))
                    ) : filteredApplications.length ? (
                      filteredApplications.map((application) => (
                        <tr key={application.id} className="text-[10px] text-[#c5c5cd] transition hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={application.candidateName} image={application.candidateImage} small />
                              <span className="font-medium text-white">{application.candidateName}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-white">{application.jobTitle}</p>
                            <p className="mt-1 text-[#85858e]">{application.companyName}</p>
                          </td>
                          <td className="px-3 py-3 text-[#9696a0]">{formatDate(application.appliedAt)}</td>
                          <td className="px-3 py-3 text-[#9696a0]">{application.experience}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] ${statusStyle(application.status)}`}>
                              {statusLabel(application.status)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <select
                              aria-label={`Update status for ${application.candidateName}`}
                              value={application.status}
                              disabled={updatingId === application.id}
                              onChange={(event) => void updateStatus(application, event.currentTarget.value as ApplicationStatus)}
                              className="h-8 rounded-md border border-white/[0.08] bg-[#111115] px-2 text-[9px] text-[#c8c8d0] outline-none disabled:opacity-50"
                            >
                              {APPLICATION_STATUSES.map((status) => (
                                <option key={status} value={status}>{statusLabel(status)}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-14 text-center">
                          <Users className="mx-auto size-5 text-[#676771]" />
                          <p className="mt-2 text-xs font-medium text-[#c8c8d0]">
                            {search ? "No applicants match your search" : "No applications yet"}
                          </p>
                          <p className="mt-1 text-[10px] text-[#777781]">
                            {search ? "Try another candidate or job title." : "Applications for your job posts will appear here."}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5 text-[9px] text-[#777781]">
                <span>
                  {total ? `Showing ${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} of ${total}` : "No applications"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="rounded-md border border-white/[0.08] p-1.5 text-[#c8c8d0] disabled:opacity-40"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <span>{page} / {totalPages}</span>
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    className="rounded-md border border-white/[0.08] p-1.5 text-[#c8c8d0] disabled:opacity-40"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Avatar({
  name,
  image,
  small = false,
}: {
  name: string;
  image: string | null;
  small?: boolean;
}) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#24242b] font-semibold text-white ${small ? "size-6 text-[8px]" : "size-8 text-[10px]"}`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "R"
      )}
    </span>
  );
}
