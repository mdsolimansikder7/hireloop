"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Search,
  Settings,
  Users,
  UserRound,
  CreditCard,
  Download,
  Bell,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/toast-provider";

type AdminStats = {
  totalUsers: number;
  totalRecruiters: number;
  totalSeekers: number;
  totalCompanies: number;
  totalJobs: number;
  totalApplications: number;
};

type ActivityRow = {
  id: string;
  kind: "User joined" | "Job posted" | "Application submitted";
  user: string;
  details: string;
  createdAt: string | null;
};

type DashboardData = { stats: AdminStats; activity: ActivityRow[] };

type AdminPaymentsSummary = {
  stats: {
    totalRevenue: number | null;
    monthlyRevenue: number | null;
    activeProUsers: number | null;
    transactionCount: number;
  };
};

const navigation = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Companies", href: "#companies", icon: Building2 },
  { label: "Jobs", href: "/admin/jobs", icon: BriefcaseBusiness },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
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
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function activityIcon(kind: ActivityRow["kind"]) {
  if (kind === "Job posted") return BriefcaseBusiness;
  if (kind === "Application submitted") return FileText;
  return UserRound;
}

export function AdminDashboard({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [paymentsSummary, setPaymentsSummary] = useState<AdminPaymentsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/dashboard", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = (await response.json()) as
        | { data: DashboardData }
        | { error: string };
      if (!response.ok || !("data" in result)) {
        throw new Error(
          "error" in result ? result.error : "Could not load admin dashboard.",
        );
      }
      setDashboard(result.data);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load admin dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

    const loadPaymentsSummary = useCallback(async () => {
      try {
        const response = await fetch("/api/admin/payments?page=1", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const result = (await response.json()) as
          | { data: AdminPaymentsSummary }
          | { error: string };
        if (response.ok && "data" in result) {
          setPaymentsSummary(result.data);
        }
      } catch {
        // Dashboard can render without payment summary
      }
    }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

    useEffect(() => {
      const timer = window.setTimeout(() => void loadPaymentsSummary(), 0);
      return () => window.clearTimeout(timer);
    }, [loadPaymentsSummary]);

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
    { label: "Total Users", value: stats?.totalUsers, change: stats ? `${stats.totalSeekers.toLocaleString()} seekers` : "", icon: Users },
    { label: "Total Recruiters", value: stats?.totalRecruiters, change: stats ? `${stats.totalRecruiters.toLocaleString()} accounts` : "", icon: UserRound },
    { label: "Total Companies", value: stats?.totalCompanies, change: "Recruiter company profiles", icon: Building2 },
    { label: "Jobs Posted", value: stats?.totalJobs, change: "All job listings", icon: BriefcaseBusiness },
    { label: "Applications", value: stats?.totalApplications, change: "Submitted applications", icon: FileText },
  ];

  const visibleActivity =
    dashboard?.activity.filter((row) =>
      [row.kind, row.user, row.details]
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    ) ?? [];

  const exportReport = () => {
    if (!dashboard) return;
    const rows = [
      ["Metric", "Value"],
      ["Total users", stats?.totalUsers ?? 0],
      ["Total recruiters", stats?.totalRecruiters ?? 0],
      ["Total job seekers", stats?.totalSeekers ?? 0],
      ["Recruiter company profiles", stats?.totalCompanies ?? 0],
      ["Jobs posted", stats?.totalJobs ?? 0],
      ["Applications", stats?.totalApplications ?? 0],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hireloop-admin-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
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
          <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#151519] px-3 py-2.5">
            <Link href="/settings" className="flex min-w-0 flex-1 items-center gap-2.5">
              <Avatar name={name} image={image} />
              <span className="min-w-0">
                <span className="block truncate text-[10px] font-semibold">{name}</span>
                <span className="mt-0.5 block text-[9px] text-[#85858e]">Admin</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              disabled={signingOut}
              aria-label={signingOut ? "Logging out" : "Log out"}
              title={signingOut ? "Logging out" : "Log out"}
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
                aria-label="Search recent platform activity"
                placeholder="Global search..."
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                className="w-full bg-transparent text-[10px] outline-none placeholder:text-[#686872]"
              />
            </label>
            <button type="button" aria-label="Notifications" className="text-[#aaaab3] hover:text-white">
              <Bell className="size-4" />
            </button>
            <button type="button" aria-label="Admin help" className="text-[#aaaab3] hover:text-white">
              <CircleHelp className="size-4" />
            </button>
            <Link href="/settings" className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-white/[0.05]">
              <span className="hidden text-right sm:block">
                <span className="block max-w-[170px] truncate text-[10px] font-medium text-white">{name}</span>
                <span className="mt-0.5 block text-[9px] text-[#85858e]">Admin</span>
              </span>
              <Avatar name={name} image={image} />
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              disabled={signingOut}
              className="ml-1 text-[10px] text-[#92929b] hover:text-white lg:hidden"
            >
              Log out
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-5 sm:px-6 sm:pt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-[20px] font-semibold tracking-tight">Dashboard Overview</h1>
                <p className="mt-1 text-[10px] text-[#85858e]">
                  Live platform accounts, job listings, and application metrics.
                </p>
              </div>
              <button
                type="button"
                onClick={exportReport}
                disabled={!dashboard}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#17171b] px-3 text-[9px] font-medium text-white transition hover:bg-[#222228] disabled:opacity-50"
              >
                <Download className="size-3" />
                Export Report
              </button>
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

            <section aria-label="Platform metrics" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
              {cards.map(({ label, value, change, icon: Icon }) => (
                <div
                  key={label}
                  id={
                    label === "Total Companies"
                      ? "companies"
                      : label === "Jobs Posted"
                        ? "jobs"
                        : undefined
                  }
                  className="scroll-mt-4 rounded-xl border border-white/[0.07] bg-[#131317] p-3.5 sm:p-4"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-white/[0.06] text-[#b8b8c0]">
                    <Icon className="size-4" />
                  </span>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-[9px] text-[#85858e]">{label}</p>
                  </div>
                  <p className="mt-1 text-[19px] font-semibold leading-none">
                    {loading ? <span className="text-[#686872]">—</span> : (value ?? 0).toLocaleString()}
                  </p>
                  <p className="mt-1.5 truncate text-[8px] text-[#777781]">{change}</p>
                </div>
              ))}
            </section>

            <section className="mt-5" id="users">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold">Recent Platform Activity</h2>
                  <p className="mt-0.5 text-[9px] text-[#777781]">
                    Latest account registrations, job posts, and submitted applications.
                  </p>
                </div>
                <span className="text-[9px] text-[#85858e]">
                  {loading ? "Loading…" : `${visibleActivity.length} activities`}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#131317]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] border-collapse text-left">
                    <thead className="bg-[#1a1a1f]">
                      <tr className="text-[8px] font-medium uppercase tracking-wide text-[#777781]">
                        <th className="px-3 py-3">Activity</th>
                        <th className="px-3 py-3">Account / Company</th>
                        <th className="px-3 py-3">Details</th>
                        <th className="px-3 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {loading ? (
                        [0, 1, 2, 3].map((row) => (
                          <tr key={row} aria-hidden="true">
                            <td colSpan={4} className="px-3 py-4">
                              <div className="h-4 animate-pulse rounded bg-white/[0.04]" />
                            </td>
                          </tr>
                        ))
                      ) : visibleActivity.length ? (
                        visibleActivity.map((row) => {
                          const Icon = activityIcon(row.kind);
                          return (
                            <tr key={row.id} className="text-[9px] text-[#c5c5cd] transition hover:bg-white/[0.02]">
                              <td className="px-3 py-3">
                                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                                  <span className="grid size-7 place-items-center rounded-lg bg-white/[0.06] text-[#aaaab3]">
                                    <Icon className="size-3.5" />
                                  </span>
                                  {row.kind}
                                </span>
                              </td>
                              <td className="px-3 py-3 font-medium text-white">{row.user}</td>
                              <td className="px-3 py-3 text-[#aaaab3]">{row.details}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-[#85858e]">{formatDate(row.createdAt)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center">
                            <FileText className="mx-auto size-5 text-[#676771]" />
                            <p className="mt-2 text-xs font-medium text-[#c8c8d0]">
                              {search ? "No matching activity" : "No platform activity yet"}
                            </p>
                            <p className="mt-1 text-[10px] text-[#777781]">
                              Recent account and job activity will appear here.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2.5 text-[9px] text-[#777781]">
                  <span>{loading ? "Loading platform data…" : `Showing ${visibleActivity.length} recent records`}</span>
                  <button
                    type="button"
                    onClick={() => void loadDashboard()}
                    disabled={loading}
                    className="text-[#aaaab3] hover:text-white disabled:opacity-50"
                  >
                    {loading ? "Refreshing…" : "Refresh"}
                  </button>
                </div>
              </div>
            </section>

            <section id="payments" className="mt-4 rounded-xl border border-white/[0.07] bg-[#131317] p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-[#9696a0]">
                  <CreditCard className="size-4" />
                </span>
                            <div className="min-w-0 flex-1">
                  <h2 className="text-[11px] font-medium">Payments &amp; Revenue</h2>
                              {paymentsSummary ? (
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                  <div>
                                    <p className="text-[9px] text-[#85858e]">Total Revenue</p>
                                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">
                                      ${((paymentsSummary.stats.totalRevenue ?? 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-[#85858e]">Monthly Revenue</p>
                                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">
                                      ${((paymentsSummary.stats.monthlyRevenue ?? 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-[#85858e]">Paid Users</p>
                                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">
                                      {paymentsSummary.stats.activeProUsers?.toLocaleString() ?? "0"}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-1 text-[9px] text-[#85858e]">
                                  Loading payment summary…
                                </p>
                              )}
                              <Link
                                href="/admin/payments"
                                className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[#9ca3af] hover:text-white"
                              >
                                View all transactions
                                <ArrowRight className="size-3" />
                              </Link>
                </div>
              </div>
            </section>

            <footer className="mt-5 border-t border-white/[0.06] pt-3 text-[8px] text-[#777781]">
              HireLoop Admin Console
            </footer>
          </div>
        </section>
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
          .filter(Boolean)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "A"
      )}
    </span>
  );
}
