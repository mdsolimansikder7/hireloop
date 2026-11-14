"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Calendar,
  CalendarClock,
  Check,
  CircleHelp,
  CreditCard,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  Plus,
  RefreshCw,
  Settings,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { SeekerSidebarActions } from "@/components/dashboard/seeker-sidebar-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createBillingPortal,
  fetchBillingHistory,
  fetchBillingSummary,
  type BillingHistoryItem,
  type BillingSummary,
} from "@/lib/api/billing";

const PAGE_SIZE = 10;

const STATUS_BADGE_CLASS: Record<string, string> = {
  paid: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  failed: "border-red-400/30 bg-red-400/10 text-red-300",
  canceled: "border-white/[0.12] bg-white/[0.06] text-[#9a9aa3]",
  refunded: "border-white/[0.12] bg-white/[0.06] text-[#9a9aa3]",
};

function shortenId(id: string | null): string {
  if (!id) return "—";
  const clean = id.replace(/^cs_/, "cs_");
  if (clean.length <= 18) return clean;
  return `${clean.slice(0, 14)}…${clean.slice(-6)}`;
}

function formatMoney(amount: number | null, currency: string | null): string {
  const value = Number(amount ?? 0) / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: String(currency ?? "USD").toUpperCase(),
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

function formatBillingDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysRemaining(renewalDate: string | null): number | null {
  if (!renewalDate) return null;
  const target = new Date(renewalDate).getTime();
  if (Number.isNaN(target)) return null;
  const now = Date.now();
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export function BillingPage({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [history, setHistory] = useState<BillingHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  async function loadSummary() {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await fetchBillingSummary();
      setSummary(data);
    } catch {
      setSummaryError("Could not load your billing summary.");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await fetchBillingHistory();
      setHistory(data.data ?? []);
    } catch {
      setHistoryError("Could not load your billing history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching billing data on mount
    void loadSummary();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching billing history on mount
    void loadHistory();
  }, []);

  async function handleManagePlan() {
    if (!summary?.hasStripeCustomer) {
      window.location.href = "/pricing";
      return;
    }
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await createBillingPortal({ returnUrl: "/billing" });
      if (res.data?.url) {
        window.location.href = res.data.url;
        return;
      }
      setPortalError("Could not start the billing portal.");
    } catch {
      setPortalError("Could not start the billing portal.");
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleAddPaymentMethod() {
    if (!summary?.hasStripeCustomer) {
      window.location.href = "/pricing";
      return;
    }
    await handleManagePlan();
  }

  async function handleCopyTransactionId(transactionId: string) {
    try {
      await navigator.clipboard.writeText(transactionId);
      setCopiedId(transactionId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard unavailable
    }
  }

  function exportHistoryCsv(rows: BillingHistoryItem[]) {
    const header = [
      "Date",
      "Plan",
      "Interval",
      "Amount",
      "Currency",
      "Status",
      "Transaction ID",
      "Receipt URL",
    ];
    const lines = rows.map((row) =>
      [
        row.date ? new Date(row.date).toLocaleDateString("en-US", { dateStyle: "medium" }) : "",
        row.planName ?? "",
        row.interval ?? "",
        row.amount ? (Number(row.amount) / 100).toFixed(2) : "",
        row.currency ?? "",
        row.status ?? "",
        row.transactionId ?? "",
        row.receiptUrl ?? "",
      ]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.map((h) => `"${h}"`).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hireloop-billing-history.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (item.planName && item.planName.toLowerCase().includes(q)) ||
      (item.transactionId && item.transactionId.toLowerCase().includes(q)) ||
      (item.status && item.status.toLowerCase().includes(q)) ||
      (item.date && item.date.toLowerCase().includes(q)) ||
      (item.interval && item.interval.toLowerCase().includes(q))
    );
  });

  const visibleHistory = filteredHistory.slice(
    (historyPage - 1) * PAGE_SIZE,
    historyPage * PAGE_SIZE,
  );
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));

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
            <SidebarLink href="/saved-jobs" label="Saved Jobs" icon={Bookmark} />
            <SidebarLink href="/applications" label="Applications" icon={FileText} />
            <SidebarLink href="/billing" label="Billing" icon={CreditCard} active />
            <SidebarLink href="/settings" label="Settings" icon={Settings} />
          </nav>
          <div className="mt-auto">
            <Link
              href="/jobs"
              className="flex h-10 items-center justify-center rounded-lg bg-white text-xs font-semibold text-black transition hover:bg-[#e8e8ed]"
            >
              Find a job
            </Link>
            <SeekerSidebarActions />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-4 sm:px-6">
            <Logo className="mr-auto [&_img]:h-[26px] lg:hidden" />
            <label className="hidden h-9 w-full max-w-[390px] items-center gap-2 rounded-lg border border-white/[0.08] bg-[#111115] px-3 sm:flex">
              <span className="text-sm text-[#777781]">⌕</span>
              <input
                aria-label="Search billing"
                placeholder="Search invoices or plans..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHistoryPage(1);
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
            <button
              type="button"
              aria-label="Messages"
              className="hidden size-8 place-items-center rounded-lg text-[#aaaab3] hover:bg-white/[0.06] hover:text-white sm:grid"
            >
              <Mail className="size-4" />
            </button>
            <Avatar name={name} image={image} />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-6 sm:pt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-[22px] font-semibold tracking-tight sm:text-[25px]">
                  Subscription &amp; Billing
                </h1>
                <p className="mt-1 text-[11px] text-[#9696a0]">
                  Manage your professional tier features, recurring payments, and billing history.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void loadSummary();
                  void loadHistory();
                }}
                className="h-8 gap-1.5 rounded-lg border-white/[0.08] bg-[#131317] px-3 text-[10px] text-[#b4b4be] hover:bg-white/[0.05] hover:text-white"
              >
                <RefreshCw className={`size-3 ${summaryLoading || historyLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1.25fr_0.85fr]">
              {/* Current plan */}
              <section className="rounded-xl border border-white/[0.07] bg-[#131317] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded bg-white px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-[#222]">
                      Current plan
                    </span>
                    {summaryLoading ? (
                      <div className="mt-3 space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
                        <div className="h-3 w-48 animate-pulse rounded bg-white/[0.04]" />
                      </div>
                    ) : summaryError ? (
                      <div className="mt-3">
                        <h2 className="text-sm font-medium text-red-300">Summary unavailable</h2>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void loadSummary()}
                          className="mt-2 h-7 rounded border-white/10 text-[9px]"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : summary?.currentPlan ? (
                      <>
                        <h2 className="mt-3 text-sm font-semibold text-white">
                          {summary.currentPlan.name} Plan
                        </h2>
                        <p className="mt-1 text-[10px] text-[#85858e]">
                          {summary.currentPlan.isFree
                            ? "Free tier"
                            : summary.currentPlan.interval === "year"
                              ? "Billed yearly"
                              : "Billed monthly"}
                        </p>
                        <div className="mt-2 flex items-baseline">
                          <span className="text-[24px] font-semibold leading-none text-[#b8b8c0]">
                            {summary.currentPlan.isFree
                              ? "$0.00"
                              : formatMoney(summary.price, summary.currency)}
                          </span>
                          <span className="ml-1 text-[10px] text-[#85858e]">
                            /{summary.currentPlan.interval === "year" ? "yr" : "mo"}
                          </span>
                        </div>
                        <div className="mt-2">
                          <Badge
                            className={
                              summary.status === "Active"
                                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/10"
                                : summary.status === "Canceled"
                                  ? "border-white/[0.12] bg-white/[0.06] text-[#9a9aa3] hover:bg-white/[0.06]"
                                  : "border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/10"
                            }
                          >
                            {summary.status || "Active"}
                          </Badge>
                        </div>
                        {summary.renewalDate ? (
                          <p className="mt-2 text-[10px] text-[#85858e]">
                            {summary.cancelAtPeriodEnd ? "Ends on" : "Renews on"}{" "}
                            {formatBillingDate(summary.renewalDate)}
                          </p>
                        ) : summary.currentPlan.isFree ? (
                          <p className="mt-2 text-[10px] text-[#85858e]">
                            Free tier forever · Upgrade anytime for recruiter access and AI tools
                          </p>
                        ) : null}
                                                {summary.currentPlan.isFree &&
                                                typeof summary.remainingApplications === "number" ? (
                                                  <p className="mt-2 text-[10px] text-[#85858e]">
                                                    Applications: {summary.applicationCount} of{" "}
                                                    {summary.freePlanApplicationLimit ?? 10} used ·{" "}
                                                    {summary.remainingApplications} remaining
                                                  </p>
                                                ) : null}
                      </>
                    ) : (
                      <>
                        <h2 className="mt-3 text-sm font-medium">Starter Plan</h2>
                        <p className="mt-1 text-[10px] text-[#85858e]">
                          Free forever · Upgrade anytime
                        </p>
                        <div className="mt-2 flex items-baseline">
                          <span className="text-[24px] font-semibold leading-none text-[#b8b8c0]">
                            $0.00
                          </span>
                          <span className="ml-1 text-[10px] text-[#85858e]">/mo</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    {summaryLoading ? (
                      <span className="inline-block h-6 w-24 animate-pulse rounded bg-white/[0.06]" />
                    ) : summaryError ? (
                      <span className="text-[10px] text-red-300">—</span>
                    ) : summary?.currentPlan ? (
                      <span className="text-[24px] font-semibold leading-none text-[#b8b8c0]">
                        {summary.currentPlan.isFree
                          ? "$0.00"
                          : formatMoney(summary.price, summary.currency)}
                      </span>
                    ) : (
                      <span className="text-[24px] font-semibold leading-none text-[#b8b8c0]">$0.00</span>
                    )}
                    <span className="ml-1 text-[10px] text-[#85858e]">
                      /{summary?.currentPlan?.interval === "year" ? "yr" : "mo"}
                    </span>
                  </div>
                </div>

                {/* Dynamic Renewal Date Highlight Card */}
                {summary?.currentPlan?.isFree ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0d0d10] p-3.5">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-400/10 text-emerald-400">
                      <Calendar className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#85858e]">
                          Billing &amp; Renewal
                        </span>
                        <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-medium text-emerald-400">
                          Lifetime Free
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] font-semibold text-white">
                        Free Plan — No renewal or payment required
                      </p>
                      <p className="text-[9px] text-[#71717a]">
                        Upgrade anytime to unlock unlimited applications &amp; premium features.
                      </p>
                    </div>
                  </div>
                ) : summary?.renewalDate ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#0a66ff]/20 bg-[#0a66ff]/[0.05] p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#0a66ff]/15 text-[#3b82f6]">
                        <CalendarClock className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9aa0a6]">
                            {summary.cancelAtPeriodEnd ? "Subscription Ends" : "Next Renewal Date"}
                          </span>
                          {getDaysRemaining(summary.renewalDate) !== null ? (
                            <span className="rounded bg-[#0a66ff]/20 px-1.5 py-0.5 text-[8px] font-semibold text-[#60a5fa]">
                              {getDaysRemaining(summary.renewalDate)} days remaining
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-[14px] font-bold text-white">
                          {formatBillingDate(summary.renewalDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider text-[#85858e]">Next charge</span>
                      <p className="text-[12px] font-semibold text-[#e4e4e7]">
                        {formatMoney(summary.price, summary.currency)}
                        <span className="text-[9px] text-[#85858e]">
                          /{summary.currentPlan?.interval === "year" ? "yr" : "mo"}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : null}

                {summary?.currentPlan?.features?.length ? (
                  <div className="mt-5 grid gap-x-5 gap-y-3 sm:grid-cols-2">
                    {summary.currentPlan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-[10px] text-[#a6a6af]">
                        <span className="grid size-3.5 place-items-center rounded-full bg-emerald-400/15 text-emerald-400">
                          <Check className="size-2.5" />
                        </span>
                        {feature}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href="/pricing"
                    className="inline-flex h-8 items-center rounded-md bg-white px-3 text-[10px] font-medium text-black transition hover:bg-[#e8e8ed]"
                  >
                    {summary?.currentPlan?.isFree ? "Upgrade plan" : "Explore plans"}
                  </Link>
                  <Button
                    type="button"
                    onClick={handleManagePlan}
                    disabled={portalLoading}
                    title={
                      summary?.hasStripeCustomer
                        ? "Manage your subscription via Stripe"
                        : "Change or select a plan"
                    }
                    className="h-8 rounded-md border border-white/[0.08] bg-white/[0.06] px-3 text-[10px] text-[#e0e0e6] transition hover:bg-white/[0.1]"
                  >
                    {portalLoading
                      ? "Opening..."
                      : summary?.hasStripeCustomer
                        ? "Manage plan"
                        : "Change plan"}
                  </Button>
                </div>
                {portalError ? (
                  <p className="mt-2 text-[9px] text-red-300">{portalError}</p>
                ) : null}
              </section>

              {/* Payment method */}
              <section className="rounded-xl border border-white/[0.07] bg-[#131317] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-medium">Payment Method</h2>
                  <span className="inline-flex items-center gap-1 rounded border border-white/[0.06] px-1.5 py-1 text-[7px] uppercase tracking-wide text-[#777781]">
                    <LockKeyhole className="size-2.5" />
                    Secure
                  </span>
                </div>
                {summaryLoading ? (
                  <div className="mt-4 min-h-[100px] rounded-lg border border-dashed border-white/[0.1] bg-[#0d0d10] px-3 py-6">
                    <div className="h-4 w-40 animate-pulse rounded bg-white/[0.06]" />
                  </div>
                ) : summary?.paymentMethod ? (
                  <div className="mt-4 rounded-lg border border-white/[0.09] bg-[#0d0d10] px-3 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 items-center rounded-md bg-white px-2 text-[8px] font-bold uppercase tracking-wide text-[#222]">
                        {String(summary.paymentMethod.brand ?? "CARD").slice(0, 4)}
                      </span>
                      <span className="text-[12px] font-medium text-white">
                        •••• {summary.paymentMethod.last4 ?? "—"}
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] text-[#85858e]">
                      Expires {summary.paymentMethod.expMonth ? String(summary.paymentMethod.expMonth).padStart(2, "0") : "--"}
                      /{summary.paymentMethod.expYear ? String(summary.paymentMethod.expYear).slice(-2) : "--"}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 flex min-h-[100px] flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.1] bg-[#0d0d10] px-3 text-center">
                    <CreditCard className="size-5 text-[#777781]" />
                    <p className="mt-2 text-[10px] font-medium text-[#d0d0d6]">
                      No payment method on file
                    </p>
                    <p className="mt-1 text-[9px] text-[#777781]">
                      Payment setup will appear here after your first checkout.
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddPaymentMethod}
                  disabled={portalLoading}
                  className="mt-3 flex w-full items-center justify-center gap-1 text-[9px] text-[#a0a0ab] hover:text-white transition"
                >
                  <Plus className="size-3" />
                  {summary?.paymentMethod ? "Update Payment Method" : "Add New Payment Method"}
                </button>
              </section>
            </div>

            {/* Billing history */}
            <section className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Billing History</h2>
                  {searchQuery ? (
                    <p className="text-[9px] text-[#7f7f89]">
                      Showing results for &ldquo;{searchQuery}&rdquo; ({filteredHistory.length})
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => exportHistoryCsv(filteredHistory)}
                  disabled={filteredHistory.length === 0}
                  title={filteredHistory.length === 0 ? "There are no invoices to export" : "Export billing history as CSV"}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-white/[0.08] bg-[#131317] px-2.5 text-[9px] text-[#c9c9d2] transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText className="size-3" />
                  Export CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#131317]">
                {historyLoading ? (
                  <div className="flex min-h-[86px] flex-col justify-center gap-2 px-4">
                    <div className="h-3 w-40 animate-pulse rounded bg-white/[0.06]" />
                    <div className="h-8 w-full animate-pulse rounded bg-white/[0.06]" />
                  </div>
                ) : historyError ? (
                  <div className="flex min-h-[86px] flex-col items-center justify-center gap-2 px-4 text-center">
                    <p className="text-[10px] font-medium text-[#c8c8d0]">{historyError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void loadHistory()}
                      className="h-8 rounded-md border-white/15 bg-transparent px-3 text-[9px] text-white hover:bg-white/[0.06] hover:text-white"
                    >
                      Retry
                    </Button>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="flex min-h-[86px] flex-col items-center justify-center px-4 text-center">
                    <FileText className="size-4 text-[#676771]" />
                    <p className="mt-2 text-[10px] font-medium text-[#c8c8d0]">
                      {searchQuery ? "No matching invoices found" : "No billing history yet"}
                    </p>
                    <p className="mt-1 text-[9px] text-[#777781]">
                      {searchQuery ? "Try a different search term." : "Your invoices will appear here when available."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <div className="min-w-[680px]">
                        <div className="grid grid-cols-[1fr_1.2fr_0.75fr_1.2fr_0.6fr] border-b border-white/[0.06] px-3 py-2.5 text-[8px] text-[#777781] sm:px-4">
                          <span>Date</span>
                          <span>Plan</span>
                          <span>Amount</span>
                          <span>Transaction ID</span>
                          <span className="text-right">Status</span>
                        </div>
                        {visibleHistory.map((row, index) => (
                          <div
                            key={row.id ?? row.transactionId ?? `row-${index}`}
                            className="grid min-w-[680px] grid-cols-[1fr_1.2fr_0.75fr_1.2fr_0.6fr] items-center gap-2 border-b border-white/[0.06] px-3 py-3 last:border-b-0 sm:px-4"
                          >
                            <span className="text-[10px] text-[#a6a6af]">
                              {formatBillingDate(row.date)}
                            </span>
                            <span className="flex items-center gap-2 text-[10px] text-[#c8c8d0]">
                              {row.planName ?? "Plan"}
                              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-[#85858e]">
                                {row.interval === "year" ? "Yearly" : "Monthly"}
                              </span>
                            </span>
                            <span className="text-[10px] font-medium text-[#e6e6ea]">
                              {formatMoney(row.amount, row.currency)}
                            </span>
                            <span className="flex items-center gap-2 text-[10px] text-[#a6a6af]">
                              <span className="font-mono">{shortenId(row.transactionId)}</span>
                              {row.transactionId ? (
                                <button
                                  type="button"
                                  onClick={() => handleCopyTransactionId(row.transactionId as string)}
                                  className="inline-flex items-center rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[8px] text-[#b9b9c2] transition hover:bg-white/[0.08] hover:text-white"
                                  aria-label="Copy transaction id"
                                >
                                  {copiedId === row.transactionId ? "Copied" : "Copy"}
                                </button>
                              ) : null}
                            </span>
                            <span className="flex items-center justify-end gap-2">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[8px] font-semibold tracking-wide uppercase ${STATUS_BADGE_CLASS[row.status] ?? STATUS_BADGE_CLASS.paid}`}
                              >
                                {row.status}
                              </span>
                              {row.receiptUrl ? (
                                <a
                                  href={row.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-medium text-[#b9b9c2] underline-offset-2 hover:text-white hover:underline"
                                >
                                  Receipt
                                </a>
                              ) : null}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {filteredHistory.length > PAGE_SIZE ? (
                      <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2.5 sm:px-4">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={historyPage <= 1}
                          onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                          className="h-7 rounded-md border-white/15 bg-transparent px-2.5 text-[9px] text-white hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                        >
                          Previous
                        </Button>
                        <span className="text-[9px] text-[#85858e]">
                          Page {historyPage} of {totalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={historyPage >= totalPages}
                          onClick={() => setHistoryPage((page) => Math.min(totalPages, page + 1))}
                          className="h-7 rounded-md border-white/15 bg-transparent px-2.5 text-[9px] text-white hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                        >
                          Next
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </section>

            <section className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-[#131317] p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-[#b1b1ba]">
                  <CircleHelp className="size-4" />
                </span>
                <div>
                  <h2 className="text-[11px] font-medium">Need help with your invoice?</h2>
                  <p className="mt-1 max-w-[420px] text-[9px] leading-relaxed text-[#85858e]">
                    Billing support is available to help with payment questions and account details.
                  </p>
                </div>
              </div>
              <a
                href="mailto:support@hireloop.com?subject=Billing%20support"
                className="inline-flex h-8 items-center rounded-md border border-white/10 px-3 text-[9px] text-white transition hover:bg-white/[0.05]"
              >
                Contact Support
              </a>
            </section>

            <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-[8px] text-[#777781]">
              <span>© HireLoop Inc. All rights reserved.</span>
              <div className="flex gap-4">
                <Link href="/#terms" className="hover:text-white">Terms of Service</Link>
                <Link href="/#privacy" className="hover:text-white">Privacy Policy</Link>
              </div>
            </footer>
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
