import type { Metadata } from "next";
import { headers } from "next/headers";

import { CheckoutSuccess } from "@/components/checkout/checkout-success";
import { auth } from "@/lib/auth";
import { db } from "@/lib/mongodb";
import { getPlanPrice, getPlan } from "@/lib/plans";
import type { BillingPeriod, CheckoutSessionRecord } from "@/lib/api/checkout";

export const metadata: Metadata = {
  title: "Checkout Success — hireloop",
  description: "Stripe checkout success confirmation.",
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    paymentIntentId?: string;
    checkoutSessionId?: string;
    session_id?: string;
    plan?: string;
    billing?: string;
  }>;
}) {
  const params = await searchParams;
  const sessionId =
    typeof params.session_id === "string" && params.session_id
      ? params.session_id
      : typeof params.checkoutSessionId === "string" && params.checkoutSessionId
        ? params.checkoutSessionId
        : typeof params.paymentIntentId === "string" && params.paymentIntentId
          ? params.paymentIntentId
          : "";

  const planId =
    typeof params.plan === "string" && params.plan.trim()
      ? params.plan.trim()
      : "growth";
  const billing: BillingPeriod =
    params.billing === "yearly" ? "yearly" : "monthly";

  // Automatically save to database `payments` collection on server
  if (sessionId) {
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      const apiUrl = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
      const normalizedApiUrl = apiUrl.replace(/\/+$/, "").replace(/\/api$/i, "");
      const endpoint = sessionId.startsWith("cs_")
        ? `${normalizedApiUrl}/api/checkout/session/${encodeURIComponent(sessionId)}`
        : `${normalizedApiUrl}/api/checkout/payments/${encodeURIComponent(sessionId)}`;

      const res = await fetch(endpoint, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      }).catch(() => null);

      let record: CheckoutSessionRecord | null = null;
      if (res?.ok) {
        const payload = (await res.json().catch(() => null)) as {
          data?: CheckoutSessionRecord;
        } | null;
        record = payload?.data ?? null;
      }

      const now = new Date();
      const transactionId = record?.transactionId || sessionId;
      // Use static price catalog from plans.ts for consistency
      const planPrice = getPlanPrice(planId as "starter" | "growth" | "premium");
      const plan = record?.plan || planId;
      const planName = record?.planName || getPlan(planId as "starter" | "growth" | "premium").name;
      const interval = record?.interval || (billing === "yearly" ? "year" : "month");
      const amount = Number(record?.amount ?? (billing === "yearly" ? planPrice.yearly : planPrice.monthly));

      const paymentDoc = {
        provider: "stripe",
        transactionId,
        paymentIntentId:
          record?.paymentIntentId ||
          (sessionId.startsWith("pi_") ? sessionId : null),
        userId: session?.user?.id ? String(session.user.id) : null,
        userName: session?.user?.name ? String(session.user.name) : null,
        userEmail: session?.user?.email
          ? String(session.user.email)
          : record?.customerEmail || record?.userEmail || null,
        customerEmail: record?.customerEmail || session?.user?.email || null,
        plan,
        planName,
        billing: record?.billing || billing,
        interval,
        amount,
        currency: String(record?.currency || "USD").toUpperCase(),
        status: record?.status === "failed" ? "failed" : "success",
        stripeStatus: record?.stripeStatus || "succeeded",
        receiptUrl: record?.receiptUrl || null,
        updatedAt: now,
      };

      await db.collection("payments").updateOne(
        { transactionId },
        {
          $set: paymentDoc,
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
    } catch (e) {
      console.error("[checkout-success] Error saving payment to database:", e);
    }
  }

  return <CheckoutSuccess sessionId={sessionId} planId={planId} billing={billing} />;
}
