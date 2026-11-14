"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Ban,
  BriefcaseBusiness,
  Building2,
  Check,
  CreditCard,
  Download,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Search,
  Settings,
  Shield,
  UserRound,
  Users,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/toast-provider";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName: string | null;
  createdAt: string | null;
  suspended: boolean;
};

type UserStats = {
  totalUsers: number;
  activeUsers: number;
  recruiterCount: number;
  suspendedUsers: number;
  newThisMonth: number;
};

type UserData = {
  stats: UserStats;
  users: ManagedUser[];
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

function displayRole(role: string) {
  if (role === "recruiter") return "Recruiter";
  if (role === "admin") return "Admin";
  return "Job Seeker";
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

export function AdminUsersPage({
  adminId,
  name,
  image,
}: {
  adminId: string;
  name: string;
  image: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: search.trim(),
        role,
        status,
        page: String(page),
      });
      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = (await response.json()) as
        | { data: UserData }
        | { error: string };
      if (!response.ok || !("data" in result)) {
        throw new Error("error" in result ? result.error : "Could not load users.");
      }
      setData(result.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [page, role, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(), search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers, search]);

  const updateUser = async (
    user: ManagedUser,
    action: "role" | "suspend" | "activate",
    nextRole?: "seeker" | "recruiter",
    companyName?: string,
  ) => {
    const message =
      action === "suspend"
        ? `Suspend ${user.name || user.email}? They will be signed out and blocked from HireLoop.`
        : action === "activate"
          ? `Restore access for ${user.name || user.email}?`
          : `Change ${user.name || user.email} to ${nextRole === "recruiter" ? "Recruiter" : "Job Seeker"}?`;
    if (!window.confirm(message)) return;

    setPendingId(user.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "role"
            ? { action, role: nextRole, ...(companyName ? { companyName } : {}) }
            : { action },
        ),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not update this account.");
      await loadUsers();
      showToast(
        action === "suspend"
          ? "User account suspended"
          : action === "activate"
            ? "User account reactivated"
            : "User role updated",
        "success",
      );
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : "Could not update this account.",
        "error",
      );
    } finally {
      setPendingId(null);
    }
  };

  const exportUsers = () => {
    if (!data) return;
    const rows = [
      ["Name", "Email", "Role", "Company", "Status", "Joined"],
      ...data.users.map((user) => [
        user.name,
        user.email,
        displayRole(user.role),
        user.companyName ?? "",
        user.suspended ? "Suspended" : "Active",
        formatDate(user.createdAt),
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
    anchor.download = `hireloop-users-page-${page}.csv`;
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

  const stats = data?.stats;
  const cards = [
    { label: "Total Users", value: stats?.totalUsers, hint: "All platform accounts", icon: Users, tone: "text-violet-300" },
    { label: "Active Users", value: stats?.activeUsers, hint: `${stats?.newThisMonth ?? 0} joined this month`, icon: Check, tone: "text-emerald-300" },
    { label: "Recruiters", value: stats?.recruiterCount, hint: "Recruiter accounts", icon: BriefcaseBusiness, tone: "text-sky-300" },
    { label: "Suspended", value: stats?.suspendedUsers, hint: "Accounts without access", icon: Ban, tone: "text-rose-300" },
  ];

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
                aria-current={label === "Users" ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${
                  label === "Users"
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
              <p className="mt-0.5 text-[9px] text-[#85858e]">Administrator</p>
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
            <Link href="/admin" className="hidden items-center gap-1.5 text-xs text-[#9a9aa3] hover:text-white sm:flex">
              <ArrowLeft className="size-3.5" />
              Admin dashboard
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={exportUsers}
                disabled={!data?.users.length}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-[#151519] px-3 text-[11px] font-medium text-[#d3d3d8] hover:bg-white/[0.07] disabled:opacity-40"
              >
                <Download className="size-3.5" />
                Export page
              </button>
              <Avatar name={name} image={image} />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1200px]">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                    <Shield className="size-3.5" />
                    Platform administration
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">User Management</h1>
                  <p className="mt-1.5 text-xs text-[#90909a]">
                    Search accounts, review access, and manage user roles.
                  </p>
                </div>
                <div className="text-xs text-[#888891]">
                  {loading ? "Updating…" : `${data?.pagination.total.toLocaleString() ?? 0} accounts found`}
                </div>
              </div>

              {error && (
                <div role="alert" className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-xs text-rose-200">
                  {error}
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {cards.map(({ label, value, hint, icon: Icon, tone }) => (
                  <article key={label} className="rounded-xl border border-white/[0.07] bg-[#121216] p-4">
                    <div className="flex items-start justify-between">
                      <p className="text-[11px] text-[#9a9aa3]">{label}</p>
                      <Icon className={`size-4 ${tone}`} />
                    </div>
                    <p className="mt-3 text-2xl font-semibold tabular-nums">
                      {value === undefined ? <span className="text-base text-[#777781]">—</span> : value.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[10px] text-[#73737c]">{hint}</p>
                  </article>
                ))}
              </div>

              <section className="mt-6 overflow-hidden rounded-xl border border-white/[0.07] bg-[#111115]">
                <div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center">
                  <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0d0d10] px-3 sm:max-w-[390px]">
                    <Search className="size-3.5 shrink-0 text-[#777781]" />
                    <input
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                      placeholder="Search name, email, or company..."
                      aria-label="Search users"
                      className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#686871]"
                    />
                  </label>
                  <div className="flex gap-2 sm:ml-auto">
                    <select
                      aria-label="Filter by role"
                      value={role}
                      onChange={(event) => {
                        setRole(event.target.value);
                        setPage(1);
                      }}
                      className="h-9 min-w-28 rounded-lg border border-white/[0.08] bg-[#0d0d10] px-2.5 text-xs text-[#d5d5da] outline-none"
                    >
                      <option value="all">All roles</option>
                      <option value="seeker">Job seekers</option>
                      <option value="recruiter">Recruiters</option>
                      <option value="admin">Admins</option>
                    </select>
                    <select
                      aria-label="Filter by status"
                      value={status}
                      onChange={(event) => {
                        setStatus(event.target.value);
                        setPage(1);
                      }}
                      className="h-9 min-w-28 rounded-lg border border-white/[0.08] bg-[#0d0d10] px-2.5 text-xs text-[#d5d5da] outline-none"
                    >
                      <option value="all">All status</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[790px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[9px] font-medium uppercase tracking-[0.12em] text-[#777781]">
                        <th className="px-4 py-3 font-medium sm:px-5">User</th>
                        <th className="px-3 py-3 font-medium">Role</th>
                        <th className="px-3 py-3 font-medium">Company</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                        <th className="px-3 py-3 font-medium">Joined</th>
                        <th className="px-4 py-3 text-right font-medium sm:px-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {loading && !data ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-16 text-center text-xs text-[#85858e]">
                            <LoaderCircle className="mx-auto mb-2 size-4 animate-spin" />
                            Loading user accounts…
                          </td>
                        </tr>
                      ) : data?.users.length ? (
                        data.users.map((user) => {
                          const isSelf = user.id === adminId;
                          const isPending = pendingId === user.id;
                          return (
                            <tr key={user.id} className="text-xs hover:bg-white/[0.015]">
                              <td className="px-4 py-3.5 sm:px-5">
                                <div className="font-medium text-[#ededf0]">{user.name || "Unnamed user"}</div>
                                <div className="mt-1 text-[10px] text-[#85858e]">{user.email || "Email unavailable"}</div>
                              </td>
                              <td className="px-3 py-3.5">
                                <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] ${
                                  user.role === "admin"
                                    ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-200"
                                    : user.role === "recruiter"
                                      ? "border-sky-300/20 bg-sky-300/[0.07] text-sky-200"
                                      : "border-white/10 bg-white/[0.04] text-[#c2c2ca]"
                                }`}>
                                  {displayRole(user.role)}
                                </span>
                              </td>
                              <td className="px-3 py-3.5 text-[#a2a2ab]">{user.companyName || "—"}</td>
                              <td className="px-3 py-3.5">
                                <span className={`inline-flex items-center gap-1.5 text-[10px] ${
                                  user.suspended ? "text-rose-300" : "text-emerald-300"
                                }`}>
                                  <span className={`size-1.5 rounded-full ${user.suspended ? "bg-rose-400" : "bg-emerald-400"}`} />
                                  {user.suspended ? "Suspended" : "Active"}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3.5 text-[10px] text-[#92929b]">{formatDate(user.createdAt)}</td>
                              <td className="px-4 py-3.5 sm:px-5">
                                <div className="flex items-center justify-end gap-1.5">
                                  {user.role !== "admin" && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (user.role === "recruiter") {
                                            void updateUser(user, "role", "seeker");
                                            return;
                                          }
                                          const companyName = window.prompt(
                                            `Enter the company name for ${user.name || user.email}:`,
                                            user.companyName ?? "",
                                          );
                                          if (companyName?.trim()) {
                                            void updateUser(user, "role", "recruiter", companyName.trim());
                                          }
                                        }}
                                        disabled={isPending || isSelf}
                                        title={`Change role to ${user.role === "recruiter" ? "Job Seeker" : "Recruiter"}`}
                                        className="inline-flex h-7 items-center gap-1 rounded-md border border-white/[0.08] px-2 text-[9px] text-[#b8b8c0] hover:bg-white/[0.06] disabled:opacity-40"
                                      >
                                        {isPending ? <LoaderCircle className="size-3 animate-spin" /> : <ArrowDown className="size-3" />}
                                        {user.role === "recruiter" ? "Seeker" : "Recruiter"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void updateUser(user, user.suspended ? "activate" : "suspend")}
                                        disabled={isPending || isSelf}
                                        className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[9px] disabled:opacity-40 ${
                                          user.suspended
                                            ? "border-emerald-300/20 text-emerald-200 hover:bg-emerald-300/[0.08]"
                                            : "border-rose-300/15 text-rose-200 hover:bg-rose-300/[0.07]"
                                        }`}
                                      >
                                        {user.suspended ? <Check className="size-3" /> : <Ban className="size-3" />}
                                        {user.suspended ? "Activate" : "Suspend"}
                                      </button>
                                    </>
                                  )}
                                  {user.role === "admin" && (
                                    <span className="text-[9px] text-[#777781]">Protected</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-16 text-center">
                            <UserRound className="mx-auto mb-2 size-5 text-[#777781]" />
                            <p className="text-xs font-medium text-[#d0d0d5]">No users found</p>
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
                      ? `Showing ${(page - 1) * (data.pagination.limit) + 1}–${Math.min(page * data.pagination.limit, data.pagination.total)} of ${data.pagination.total}`
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
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
