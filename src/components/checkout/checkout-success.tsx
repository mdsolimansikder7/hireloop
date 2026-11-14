"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Hash,
  LoaderCircle,
  Mail,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  fetchCheckoutPayment,
  fetchCheckoutSession,
  type BillingPeriod,
  type CheckoutSessionRecord,
} from "@/lib/api/checkout";

const CONFETTI_PIECES = [
  { left: "12%", delay: "0ms", duration: "1.9s", color: "#10b981", size: "6px", dx: "-70px", dy: "-130px" },
  { left: "22%", delay: "90ms", duration: "2.1s", color: "#34d399", size: "5px", dx: "-50px", dy: "-110px" },
  { left: "34%", delay: "40ms", duration: "1.7s", color: "#fbbf24", size: "5px", dx: "-80px", dy: "-150px" },
  { left: "45%", delay: "140ms", duration: "2.2s", color: "#60a5fa", size: "6px", dx: "-60px", dy: "-120px" },
  { left: "56%", delay: "60ms", duration: "1.8s", color: "#f472b6", size: "5px", dx: "-40px", dy: "-100px" },
  { left: "67%", delay: "120ms", duration: "2.0s", color: "#34d399", size: "6px", dx: "-90px", dy: "-160px" },
  { left: "76%", delay: "30ms", duration: "1.6s", color: "#fbbf24", size: "5px", dx: "-55px", dy: "-105px" },
  { left: "85%", delay: "110ms", duration: "1.9s", color: "#60a5fa", size: "5px", dx: "-75px", dy: "-140px" },
];

function formatMoney(record: CheckoutSessionRecord | null): string | null {
  const amount = Number(record?.amount ?? 0);
  if (!record || !Number.isFinite(amount) || amount <= 0) return null;
  const currencyCode = String(record.currency ?? "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount / 100);
  } catch {
    return null;
  }
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function shortenId(id: string): string {
  const clean = id.replace(/^cs_/, "cs_");
  if (clean.length <= 18) return clean;
  return `${clean.slice(0, 14)}…${clean.slice(-6)}`;
}

export function CheckoutSuccess({
  sessionId,
  planId,
  billing,
}: {
  sessionId: string;
  planId: string;
  billing: BillingPeriod;
}) {
  const [record, setRecord] = useState<CheckoutSessionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!sessionId) {
        if (!signal?.aborted) {
          setError("We could not find this checkout session.");
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = sessionId.startsWith("cs_")
          ? await fetchCheckoutSession(sessionId, signal)
          : await fetchCheckoutPayment(sessionId, signal);
        if (!signal?.aborted) {
          setRecord(data);
          // Persist payment to database `payments` collection
          void fetch("/api/checkout/save-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data,
              plan: data.plan || planId,
              billing: data.billing || billing,
            }),
          }).catch(() => {});
        }
      } catch {
        if (!signal?.aborted) {
          setError("We could not load your payment details. Please refresh this page.");
        }
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [sessionId],
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching checkout data on mount
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // While the checkout is not confirmed yet, poll the payment status a few
  // times (every 2s, max ~10s) so the screen recovers automatically if the
  // Stripe webhook has not landed yet.
  const pollAttemptsRef = useRef(0);
  useEffect(() => {
    if (isLoading || error) return;
    if (record?.status === "success") {
      pollAttemptsRef.current = 0;
      return;
    }
    if (pollAttemptsRef.current >= 5) return;
    pollAttemptsRef.current += 1;
    const timer = setTimeout(() => {
      void load();
    }, 2000);
    return () => clearTimeout(timer);
  }, [record, isLoading, error, load]);

  const amountLabel = useMemo(() => formatMoney(record), [record]);
  const planLabel = record?.planName ?? planId;
  const billingLabel = record?.billing
    ? record.billing === "yearly"
      ? "Billed yearly"
      : "Billed monthly"
    : billing === "yearly"
      ? "Billed yearly"
      : "Billed monthly";
  const customerEmail = record?.customerEmail ?? record?.userEmail ?? null;
  const paymentDate = formatDate(record?.createdAt ?? null);
  const receiptUrl = record?.receiptUrl ?? null;
  const sessionKey = record?.transactionId ?? sessionId;

  async function handleCopySessionId() {
    try {
      await navigator.clipboard.writeText(sessionKey);
      setCopiedId(sessionKey);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard may be unavailable; the id is still displayed for reference.
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#050505] text-white">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[680px] flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
          <Card className="w-full rounded-2xl border border-white/[0.08] bg-[#111111] p-8 text-left sm:p-10">
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-white/[0.06] text-[#9a9aa3]">
                <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
              </span>
              <p className="text-[13px] text-[#9a9aa3]">Loading your receipt…</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#050505] text-white">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[680px] flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
          <Card className="w-full rounded-2xl border border-white/[0.08] bg-[#111111] p-8 text-left sm:p-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-amber-400/10 text-amber-400">
                <span className="text-2xl font-semibold" aria-hidden="true">
                  !
                </span>
              </span>
              <h1 className="text-[22px] font-semibold tracking-tight text-white">
                Payment not confirmed
              </h1>
              <p className="text-[12px] leading-relaxed text-[#9a9aa3]">
                {error} We could not verify this checkout session. No charges
                will be duplicated — please refresh or contact support if the
                payment already went through.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen w-full bg-[#050505] text-white">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[680px] flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
          <Card className="w-full rounded-2xl border border-white/[0.08] bg-[#111111] p-8 text-left sm:p-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-amber-400/10 text-amber-400">
                <span className="text-2xl font-semibold" aria-hidden="true">
                  !
                </span>
              </span>
              <h1 className="text-[22px] font-semibold tracking-tight text-white">
                Payment not found
              </h1>
              <p className="text-[12px] leading-relaxed text-[#9a9aa3]">
                We could not find a payment record for this checkout. If you just
                completed your payment, please wait a moment and refresh.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (record.status !== "success") {
    return (
      <div className="min-h-screen w-full bg-[#050505] text-white">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[680px] flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
          <Card className="w-full rounded-2xl border border-white/[0.08] bg-[#111111] p-8 text-left sm:p-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-amber-400/10 text-amber-400">
                <span className="text-2xl font-semibold" aria-hidden="true">
                  !
                </span>
              </span>
              <h1 className="text-[22px] font-semibold tracking-tight text-white">
                Payment pending
              </h1>
              <p className="text-[12px] leading-relaxed text-[#9a9aa3]">
                Your Stripe payment is{" "}
                <span className="font-medium text-[#e6e6ea]">{record.status}</span>.
                Once Stripe confirms the payment, this page will update
                automatically.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,rgba(10,102,255,0.14),transparent_65%)]" />
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[680px] flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <div className="animate-fade-up relative w-full">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 overflow-hidden">
            {CONFETTI_PIECES.map((piece) => (
              <span
                key={piece.left}
                aria-hidden="true"
                className="absolute top-[42%] block rounded-[2px] opacity-0"
                style={
                  {
                    left: piece.left,
                    width: piece.size,
                    height: piece.size,
                    backgroundColor: piece.color,
                    animationDelay: piece.delay,
                    animationDuration: piece.duration,
                    "--tx": piece.dx,
                    "--ty": piece.dy,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>

          <Card className="w-full rounded-2xl border-0 bg-gradient-to-br from-white/10 via-[#121212] to-white/5 p-px shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            <div className="rounded-2xl bg-[#0d0d0d]/95 p-6 sm:p-8">
              <div className="relative flex flex-col items-center text-center">
                <span className="relative grid size-20 place-items-center rounded-full bg-emerald-400/10 shadow-[0_0_44px_-6px_rgba(16,185,129,0.55)]">
                  <CheckCircle2
                    className="size-9 animate-pop text-emerald-400"
                    aria-hidden="true"
                  />
                </span>

                <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-white sm:text-[26px]">
                  Payment successful
                </h1>

                <p className="mt-2 text-[12px] leading-relaxed text-[#9a9aa3]">
                  Thank you — your payment was confirmed by Stripe and your{" "}
                  <span className="font-medium text-[#d8d8df]">{planLabel}</span>{" "}
                  plan is now active.
                </p>

                <p
                  className="mt-6 text-[38px] font-semibold tracking-tight text-white tabular-nums sm:text-[44px]"
                  aria-label={amountLabel ?? undefined}
                >
                  {amountLabel ?? "—"}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/10">
                    {planLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-white/15 bg-transparent text-[#c9c9d2] hover:bg-transparent hover:text-[#c9c9d2]"
                  >
                    {billingLabel}
                  </Badge>
                </div>

                <div className="mt-6 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <dl className="space-y-3 text-[12px]">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="inline-flex items-center gap-2 text-[#85858e]">
                        <Clock className="size-3.5" aria-hidden="true" />
                        Billing cycle
                      </dt>
                      <dd className="font-medium text-[#e6e6ea]">{billingLabel}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="inline-flex items-center gap-2 text-[#85858e]">
                        <Wallet className="size-3.5" aria-hidden="true" />
                        Plan
                      </dt>
                      <dd className="font-medium text-[#e6e6ea]">
                        {planLabel} · {billingLabel}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="inline-flex items-center gap-2 text-[#85858e]">
                        <Mail className="size-3.5" aria-hidden="true" />
                        Customer email
                      </dt>
                      <dd className="max-w-[240px] truncate text-right font-medium text-[#e6e6ea]">
                        {customerEmail ?? "Not available"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="inline-flex items-center gap-2 text-[#85858e]">
                        <CreditCard className="size-3.5" aria-hidden="true" />
                        Amount paid
                      </dt>
                      <dd className="font-medium text-[#e6e6ea]">{amountLabel ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="inline-flex items-center gap-2 text-[#85858e]">
                        <CalendarDays className="size-3.5" aria-hidden="true" />
                        Payment date
                      </dt>
                      <dd className="font-medium text-[#e6e6ea]">
                        {paymentDate ?? "—"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="inline-flex items-center gap-2 text-[#85858e]">
                        <Hash className="size-3.5" aria-hidden="true" />
                        Transaction ID
                      </dt>
                      <dd className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[#c9c9d2]">
                          {shortenId(sessionKey)}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopySessionId}
                          className="inline-flex items-center gap-1 rounded-md border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium text-[#b9b9c2] transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a66ff]/60"
                          aria-label="Copy transaction id"
                        >
                          {copiedId === sessionKey ? (
                            <Check className="size-3" aria-hidden="true" />
                          ) : (
                            <Copy className="size-3" aria-hidden="true" />
                          )}
                          {copiedId === sessionKey ? "Copied" : "Copy"}
                        </button>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold tracking-wide text-emerald-300 uppercase">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  Paid
                </div>

                <p className="mt-6 text-[10px] leading-relaxed text-[#7b7b85]">
                  A receipt has been sent to your email.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex w-full max-w-[320px] flex-col gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/billing" />}
            className="h-11 w-full rounded-xl bg-gradient-to-r from-[#0a66ff] to-[#0053d0] text-[13px] font-semibold text-white shadow-[0_12px_30px_-10px_rgba(10,102,255,0.8)] hover:-translate-y-0.5 hover:from-[#0b5ae0] hover:to-[#0059e0] transition-all"
          >
            Go to Billing
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/pricing" />}
            variant="outline"
            className="h-11 w-full rounded-xl border-white/15 bg-transparent px-3 text-[13px] font-medium text-white hover:bg-white/[0.06] hover:text-white"
          >
            Back to Plans
          </Button>
          {receiptUrl ? (
            <Button
              nativeButton={false}
              render={
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" />
              }
              variant="ghost"
              className="h-10 w-full rounded-xl text-[12px] font-medium text-[#b9b9c2] hover:bg-white/[0.06] hover:text-white"
            >
              <Download className="size-3.5" aria-hidden="true" />
              Download receipt
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
