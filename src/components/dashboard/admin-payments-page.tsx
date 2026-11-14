"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CreditCard,
  Download,
  FileText,
  Filter,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/toast-provider";

type PaymentData = {
  revenueAvailable: boolean;
  transactions: Array<{
    id: string;
    transactionId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    plan: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    receiptUrl: string | null;
  }>;
  stats: {
    totalRevenue: number | null;
    monthlyRevenue: number | null;
    activeProUsers: number | null;
    enterpriseUsers: number | null;
    transactionCount: number;
    applicationCount: number;
    usersCount: number;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const navigation = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Companies", href: "#companies", icon: Building2 },
  { label: "Jobs", href: "/admin/jobs", icon: FileText },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Settings", href: "/settings/sessions", icon: Settings },
];

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

function formatCurrency(value: number | null) {
  if (value === null) return "Unavailable";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminPaymentsPage({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [signingOut, setSigningOut] = useState(false);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: search.trim(),
        status,
        page: String(page),
      });
      const response = await fetch(`/api/admin/payments?${params}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = (await response.json()) as
        | { data: PaymentData }
        | { error: string };
      if (!response.ok || !("data" in result)) {
        throw new Error(
          "error" in result ? result.error : "Could not load payment information.",
        );
      }
      setData(result.data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load payment information.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => void loadPayments(),
      search ? 250 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [loadPayments, search]);

  const exportCsv = () => {
      if (!data || !data.transactions.length) return;
    const rows = [
        ["User Name", "User Email", "Plan", "Amount", "Currency", "Date", "Transaction ID", "Status", "Receipt URL"],
        ...data.transactions.map((t) => [
          t.user.name,
          t.user.email,
          t.plan,
          String(t.amount),
          t.currency,
          t.date,
          t.transactionId,
          t.status,
          t.receiptUrl ?? "",
        ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hireloop-transactions.csv";
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

  const metrics = [
    {
      label: "Total Revenue",
      value: formatCurrency(data?.stats.totalRevenue ?? null),
        note:
          data && data.stats.transactionCount > 0
            ? `${data.stats.transactionCount.toLocaleString()} paid transactions`
            : "No transactions yet",
      icon: CreditCard,
      iconTone: "text-violet-200",
      noteTone: "text-[#85858e]",
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(data?.stats.monthlyRevenue ?? null),
        note:
          data && data.stats.monthlyRevenue !== null
            ? "Last 30 days of successful payments"
            : "No revenue this month",
      icon: FileText,
      iconTone: "text-sky-200",
      noteTone: "text-[#85858e]",
    },
    {
        label: "Active Subscribers",
      value: data?.stats.activeProUsers?.toLocaleString() ?? "Unavailable",
        note:
          data && data.stats.activeProUsers
            ? `${data.stats.activeProUsers.toLocaleString()} users with successful payments`
            : "No active subscribers",
      icon: Users,
      iconTone: "text-amber-200",
      noteTone: "text-[#85858e]",
    },
    {
        label: "Premium Users",
      value: data?.stats.enterpriseUsers?.toLocaleString() ?? "Unavailable",
        note:
          data && data.stats.enterpriseUsers
            ? `${data.stats.enterpriseUsers.toLocaleString()} premium subscriptions`
            : "No premium subscriptions",
      icon: Building2,
      iconTone: "text-emerald-200",
      noteTone: "text-[#85858e]",
    },
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
                aria-current={label === "Payments" ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${
                  label === "Payments"
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
              <p className="mt-0.5 text-[9px] text-[#85858e]">Systems Admin</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              disabled={signingOut}
              aria-label={signingOut ? "Logging out" : "Log out"}
              className="text-[#85858e] hover:text-white disabled:opacity-50"
            >
              {signingOut ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <LogOut className="size-3.5" />
              )}
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-4 sm:px-6">
            <Logo className="mr-auto [&_img]:h-[26px] lg:hidden" />
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 text-xs text-[#9a9aa3] hover:text-white sm:flex"
            >
              <ArrowLeft className="size-3.5" />
              Admin dashboard
            </Link>
            <button
              type="button"
              aria-label="Help"
                          title="Payment data is fetched from the database"
              className="ml-auto text-[#aaaab2] hover:text-white"
            >
              <span className="text-sm">?</span>
            </button>
            <div className="hidden h-5 border-l border-white/10 sm:block" />
            <span className="hidden text-[10px] text-[#c8c8ce] sm:block">
              Admin View
            </span>
            <Avatar name={name} image={image} />
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1200px]">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">
                  Payments &amp; Subscriptions
                </h1>
                <p className="mt-1 text-xs text-[#90909a]">
                  Overview of platform revenue and active subscriptions.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-xs text-rose-200"
                >
                  {error}
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3 2xl:grid-cols-4">
                {metrics.map(
                  ({ label, value, note, icon: Icon, iconTone, noteTone }) => (
                    <article
                      key={label}
                      className="min-w-0 rounded-xl border border-white/[0.07] bg-[#141417] p-3.5 sm:p-4"
                    >
                      <div className="flex size-7 items-center justify-center rounded-md border border-white/[0.08] bg-[#202024]">
                        <Icon className={`size-3.5 ${iconTone}`} />
                      </div>
                      <p className="mt-3 truncate text-[9px] text-[#9a9aa3]">
                        {label}
                      </p>
                      <p className="mt-1.5 truncate text-lg font-semibold tabular-nums sm:text-xl">
                        {loading && !data ? "—" : value}
                      </p>
                      <p className={`mt-1 truncate text-[9px] ${noteTone}`}>
                        {note}
                      </p>
                    </article>
                  ),
                )}
              </div>

              <section className="mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-[#141417]">
                <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                  <div className="mr-auto">
                    <h2 className="text-sm font-semibold">Recent Transactions</h2>
                    <p className="mt-1 text-[9px] text-[#85858e]">
                                        Live payment records from the database.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFilterOpen((open) => !open)}
                      aria-expanded={filterOpen}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#19191d] px-2 text-[9px] text-[#c4c4cb] hover:bg-white/[0.07]"
                    >
                      <Filter className="size-3" />
                      Filter
                    </button>
                    <button
                      type="button"
                      onClick={exportCsv}
                      disabled={!data || data.stats.transactionCount === 0}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white px-2 text-[9px] font-medium text-[#29292f] hover:bg-[#e8e8ed] disabled:opacity-50"
                    >
                      <Download className="size-3" />
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-b border-white/[0.05] px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                  <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border border-white/[0.07] bg-[#101013] px-2.5 sm:max-w-[330px]">
                    <Search className="size-3.5 shrink-0 text-[#777781]" />
                    <input
                      aria-label="Search transactions, users, or IDs"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                      placeholder="Search transactions, users, or IDs..."
                      className="w-full bg-transparent text-[10px] text-white outline-none placeholder:text-[#686871]"
                    />
                  </label>
                  {filterOpen && (
                    <div className="flex items-center gap-2">
                      <select
                        aria-label="Filter by transaction status"
                        value={status}
                        onChange={(event) => {
                          setStatus(event.target.value);
                          setPage(1);
                        }}
                        className="h-8 rounded-md border border-white/[0.07] bg-[#101013] px-2 text-[10px] text-[#d5d5da] outline-none"
                      >
                        <option value="all">All statuses</option>
                        <option value="success">Success</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                      </select>
                      {(search || status !== "all") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setStatus("all");
                            setPage(1);
                          }}
                          className="inline-flex items-center gap-1 text-[9px] text-[#a2a2ab] hover:text-white"
                        >
                          <X className="size-3" />
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                  <span className="text-[9px] text-[#777781] sm:ml-auto">
                    {data?.stats.applicationCount.toLocaleString() ?? "—"} applications tracked
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/[0.05] text-[8px] font-medium uppercase tracking-[0.12em] text-[#777781]">
                        <th className="px-4 py-3 font-medium sm:px-5">User Email</th>
                        <th className="px-3 py-3 font-medium">Plan</th>
                        <th className="px-3 py-3 font-medium">Amount</th>
                        <th className="px-3 py-3 font-medium">Date</th>
                        <th className="px-3 py-3 font-medium">Transaction ID</th>
                        <th className="px-4 py-3 text-right font-medium sm:px-5">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && !data ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-14 text-center text-xs text-[#85858e]"
                          >
                            <LoaderCircle className="mx-auto mb-2 size-4 animate-spin" />
                            Loading payment data…
                          </td>
                        </tr>
                                          ) : data && data.transactions.length > 0 ? (
                                            data.transactions.map((tx) => (
                                              <tr
                                                key={tx.id}
                                                className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                                              >
                                                <td className="px-5 py-3">
                                                  <p className="text-[11px] font-medium text-white">
                                                    {tx.user.name}
                                                  </p>
                                                  <p className="mt-0.5 text-[10px] text-[#85858e]">
                                                    {tx.user.email}
                                                  </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                  <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#c8c8ce]">
                                                    {tx.plan}
                                                  </span>
                                                </td>
                                                <td className="px-3 py-3 text-[11px] tabular-nums text-white">
                                                  ${tx.amount.toFixed(2)}{" "}
                                                  <span className="text-[#85858e]">{tx.currency}</span>
                                                </td>
                                                <td className="px-3 py-3 text-[10px] text-[#9a9aa3]">
                                                  {new Date(tx.date).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                  })}
                                                </td>
                                                <td className="px-3 py-3 font-mono text-[10px] text-[#9a9aa3]">
                                                  {tx.transactionId.length > 18
                                                    ? `${tx.transactionId.slice(0, 14)}…${tx.transactionId.slice(-6)}`
                                                    : tx.transactionId}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                  <span
                                                    className={
                                                      tx.status === "success"
                                                        ? "inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300"
                                                        : tx.status === "pending"
                                                          ? "inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300"
                                                          : "inline-flex items-center rounded-full border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-[10px] font-medium text-red-300"
                                                    }
                                                  >
                                                    {tx.status}
                                                  </span>
                                                </td>
                                              </tr>
                                            ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-14 text-center">
                            <CreditCard className="mx-auto mb-2 size-5 text-[#777781]" />
                            <p className="text-xs font-medium text-[#d0d0d5]">
                              No transaction history available
                            </p>
                            <p className="mx-auto mt-1 max-w-md text-[10px] leading-5 text-[#777781]">
                                                  No payments match your current filters. Try
                                                  adjusting the search or status filter.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <footer className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 sm:px-5">
                  <p className="text-[10px] text-[#85858e]">
                    {data?.pagination.total ?? 0} transactions
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
                      {data?.pagination.totalPages
                        ? `${page} / ${data.pagination.totalPages}`
                        : "0 / 0"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((current) => current + 1)}
                      disabled={
                        !data || page >= data.pagination.totalPages || loading
                      }
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
