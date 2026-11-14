"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/toast-provider";

type RecruiterDashboardData = {
  stats: {
    totalJobs: number;
    totalApplicants: number;
    activeJobs: number;
    closedJobs: number;
  };
  recentApplications: {
    id: string;
    candidateName: string;
    candidateImage: string | null;
    role: string;
    appliedAt: string | null;
    experience: string;
    status: string;
  }[];
};

const navigation = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Add Job", href: "/recruiter/jobs/new", icon: BriefcaseBusiness },
  { label: "Manage Jobs", href: "/recruiter/jobs", icon: BriefcaseBusiness },
  { label: "Applications", href: "/recruiter/applications", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
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

function statusStyle(status: string) {
  switch (status) {
    case "interview":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";
    case "reviewing":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    case "shortlisted":
      return "border-sky-400/20 bg-sky-400/10 text-sky-300";
    case "rejected":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    case "offer":
    case "hired":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    default:
      return "border-sky-400/20 bg-sky-400/10 text-sky-300";
  }
}

function statusLabel(status: string) {
  if (status === "applied") return "New";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function RecruiterDashboard({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState<RecruiterDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/recruiter/dashboard", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = (await response.json()) as
        | { data: RecruiterDashboardData }
        | { error: string };
      if (!response.ok || !("data" in result)) {
        throw new Error(
          "error" in result ? result.error : "Could not load recruiter dashboard.",
        );
      }
      setDashboard(result.data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load recruiter dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

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

  const stats = dashboard?.stats;
  const cards = [
    { label: "Total Job Posts", value: stats?.totalJobs, icon: FileText },
    { label: "Total Applicants", value: stats?.totalApplicants, icon: Users },
    { label: "Active Jobs", value: stats?.activeJobs, icon: Zap },
    { label: "Jobs Closed", value: stats?.closedJobs, icon: CheckCircle2 },
  ];

  return (
    <main className="min-h-screen bg-[#0b0b0d] p-2.5 text-white sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.25rem)] max-w-[1600px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d10] shadow-2xl sm:min-h-[calc(100vh-2rem)]">
        <aside className="hidden w-[210px] shrink-0 flex-col border-r border-white/[0.07] bg-[#09090b] p-4 lg:flex">
          <Logo className="mb-7 px-1 [&_img]:h-[28px]" />
          <Link href="/settings" className="mb-5 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#151519] px-3 py-2.5 transition hover:bg-[#1b1b20]">
            <Avatar name={name} image={image} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{name}</p>
              <p className="mt-0.5 text-[10px] text-[#85858e]">Recruiter</p>
            </div>
          </Link>
          <nav className="space-y-1">
            {navigation.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                aria-current={label === "Dashboard" ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${
                  label === "Dashboard"
                    ? "bg-[#29292f] text-white"
                    : "text-[#92929b] hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto">
            <button
              type="button"
              onClick={() => void logout()}
              disabled={signingOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-[#92929b] transition hover:bg-white/[0.05] hover:text-white disabled:opacity-60"
            >
              <LogOut className="size-4" />
              {signingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-white/[0.07] px-4 sm:px-6 lg:justify-end">
            <Logo className="lg:hidden [&_img]:h-[26px]" />
            <div className="flex items-center gap-3">
              <Link href="/settings" className="flex items-center gap-2.5 rounded-lg px-2 py-1 transition hover:bg-white/[0.05]">
                <span className="hidden text-right sm:block">
                  <span className="block max-w-[170px] truncate text-[10px] font-medium text-white">{name}</span>
                  <span className="mt-0.5 block text-[9px] text-[#85858e]">Recruiter</span>
                </span>
                <Avatar name={name} image={image} />
              </Link>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-6 sm:pt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-[17px] font-semibold tracking-tight sm:text-[20px]">
                Welcome back, {name}
              </h1>
              <Link
                href="/recruiter/jobs"
                className="rounded-lg border border-white/[0.1] px-3 py-2 text-[10px] font-medium text-[#c8c8d0] transition hover:bg-white/[0.05] hover:text-white lg:hidden"
              >
                Manage Jobs
              </Link>
            </div>

            {error && (
              <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-xs text-rose-200">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => void loadDashboard()}
                  className="rounded-md border border-rose-200/20 px-3 py-1.5 text-white hover:bg-rose-200/10"
                >
                  Retry
                </button>
              </div>
            )}

            <section aria-label="Recruiter statistics" className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {cards.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border border-white/[0.07] bg-[#131317] p-3.5 sm:p-4">
                  <span className="grid size-8 place-items-center rounded-lg bg-white/[0.06] text-[#b8b8c0]">
                    <Icon className="size-4" />
                  </span>
                  <p className="mt-3 text-[10px] text-[#85858e]">{label}</p>
                  <p className="mt-1 text-[19px] font-semibold leading-none">
                    {loading ? <span className="text-[#686872]">—</span> : (value ?? 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </section>

            <section id="recent-applications" className="mt-6 scroll-mt-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Recent Applications</h2>
                <Link
                  href="/recruiter/applications"
                  className="text-[9px] text-[#9b9ba5] transition hover:text-white"
                >
                  View all
                </Link>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#131317]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[690px] border-collapse text-left">
                    <thead className="bg-[#1a1a1f]">
                      <tr className="text-[9px] font-medium uppercase tracking-wide text-[#777781]">
                        <th className="px-4 py-3">Candidate Name</th>
                        <th className="px-3 py-3">Role</th>
                        <th className="px-3 py-3">Date Applied</th>
                        <th className="px-3 py-3">Experience</th>
                        <th className="px-3 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {loading ? (
                        [0, 1, 2, 3].map((row) => (
                          <tr key={row} aria-hidden="true">
                            <td colSpan={5} className="px-4 py-4">
                              <div className="h-4 animate-pulse rounded bg-white/[0.04]" />
                            </td>
                          </tr>
                        ))
                      ) : dashboard?.recentApplications.length ? (
                        dashboard.recentApplications.map((application) => (
                          <tr key={application.id} className="text-[10px] text-[#c5c5cd] transition hover:bg-white/[0.02]">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={application.candidateName} image={application.candidateImage} small />
                                <span className="font-medium text-white">{application.candidateName}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3">{application.role}</td>
                            <td className="px-3 py-3 text-[#9696a0]">{formatDate(application.appliedAt)}</td>
                            <td className="px-3 py-3 text-[#9696a0]">{application.experience}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] ${statusStyle(application.status)}`}>
                                {statusLabel(application.status)}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center">
                            <Users className="mx-auto size-5 text-[#676771]" />
                            <p className="mt-2 text-xs font-medium text-[#c8c8d0]">
                              No applications yet
                            </p>
                            <p className="mt-1 text-[10px] text-[#777781]">
                              Applications for your jobs will appear here.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {dashboard?.recentApplications.length ? (
                  <p className="border-t border-white/[0.06] px-4 py-2 text-[9px] text-[#777781]">
                    Showing the latest {dashboard.recentApplications.length} applications
                  </p>
                ) : null}
              </div>
            </section>
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
