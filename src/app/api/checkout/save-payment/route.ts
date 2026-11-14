import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { apiError, json, logApiError } from "@/lib/dashboard/http";
import { db } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const record = ((body?.record as Record<string, unknown>) || body) as Record<string, unknown>;

    const transactionId = String(record?.transactionId || record?.id || "").trim();
    if (!transactionId) {
      return apiError("Transaction ID is required", 400);
    }

    const now = new Date();
    const createdAt = record?.createdAt ? new Date(String(record.createdAt)) : now;

    const userId = session?.user?.id ? String(session.user.id) : (record?.userId ? String(record.userId) : null);
    const userName = session?.user?.name ? String(session.user.name) : (record?.userName ? String(record.userName) : null);
    const userEmail = session?.user?.email
      ? String(session.user.email)
      : (record?.customerEmail ? String(record.customerEmail) : (record?.userEmail ? String(record.userEmail) : null));
    const customerEmail = record?.customerEmail
      ? String(record.customerEmail)
      : (session?.user?.email ? String(session.user.email) : null);

    const plan = String(record?.plan || "growth").toLowerCase();
    const planName = String(
      record?.planName || (plan === "premium" ? "Premium" : plan === "growth" ? "Growth" : "Pro"),
    );
    const billing = String(record?.billing || "monthly").toLowerCase();
    const interval = String(record?.interval || (billing === "yearly" ? "year" : "month")).toLowerCase();
    const amount = Number(record?.amount ?? 0);
    const currency = String(record?.currency || "USD").toUpperCase();
    const status = record?.status === "failed" ? "failed" : "success";
    const stripeStatus = String(record?.stripeStatus || "succeeded");
    const receiptUrl = record?.receiptUrl ? String(record.receiptUrl) : null;
    const stripeCustomerId = record?.stripeCustomerId ? String(record.stripeCustomerId) : null;

    // Calculate dynamic renewal date (1 month or 1 year from payment date)
    const isYearly = interval === "year" || billing === "yearly";
    const calcRenewal = new Date(createdAt);
    if (isYearly) {
      calcRenewal.setFullYear(calcRenewal.getFullYear() + 1);
    } else {
      calcRenewal.setMonth(calcRenewal.getMonth() + 1);
    }

    // Guard: reject if user already has an active payment for the same plan
    const existingPayment = await db.collection("payments").findOne({
      userId: userId,
      plan: plan,
      status: { $in: ["success", "paid"] },
      renewalDate: { $gt: new Date() }, // still active
    });

    if (existingPayment) {
      // User already has an active/subscription for this plan; ignore the new payment
      return json({
        success: true,
        duplicate: true,
        message: "You already have an active subscription for this plan.",
        existingPayment: {
          planName: existingPayment.planName,
          renewalDate: existingPayment.renewalDate,
        },
      });
    }

    const renewalDate = record?.renewalDate
      ? new Date(String(record.renewalDate))
      : calcRenewal;

    const paymentDoc = {
      provider: "stripe",
      transactionId,
      paymentIntentId: record?.paymentIntentId
        ? String(record.paymentIntentId)
        : transactionId.startsWith("pi_")
          ? transactionId
          : null,
      userId,
      userName,
      userEmail,
      customerEmail,
      stripeCustomerId,
      plan,
      planName,
      billing,
      interval,
      amount,
      currency,
      status,
      stripeStatus,
      renewalDate,
      receiptUrl,
      updatedAt: now,
    };

    await db.collection("payments").updateOne(
      { transactionId },
      {
        $set: paymentDoc,
        $setOnInsert: {
          createdAt,
        },
      },
      { upsert: true },
    );

    return json({
      success: true,
      transactionId,
      status,
      renewalDate: renewalDate.toISOString(),
    });
  } catch (error) {
    return logApiError("POST /api/checkout/save-payment", error);
  }
}
