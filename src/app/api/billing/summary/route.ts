import { ObjectId } from "mongodb";

import { applicationsCollection } from "@/lib/db/dashboard";
import { seekerApplicationFilter } from "@/lib/dashboard/data";
import { authorizeApi, json, logApiError } from "@/lib/dashboard/http";
import { db } from "@/lib/mongodb";
import { FREE_PLAN_APPLICATION_LIMIT, PLAN_CATALOG, PLAN_PRICES, type PlanId } from "@/lib/plans";

export async function GET() {
  const access = await authorizeApi(["seeker", "admin", "recruiter"]);
  if (access.response) return access.response;

  const user = access.session.user;
  const userId = user.id;

  try {
    // 1. Try querying the express server on port 5000 if running
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
    const serverEndpoint = `${apiUrl.replace(/\/+$/, "").replace(/\/api$/i, "")}/api/billing/summary?userId=${encodeURIComponent(userId)}`;

    try {
      const serverRes = await fetch(serverEndpoint, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      });

      if (serverRes.ok) {
        const payload = (await serverRes.json().catch(() => null)) as {
          data?: {
            currentPlan?: {
              id?: string | null;
              name?: string | null;
              interval?: string | null;
              amount?: number;
              currency?: string;
              status?: string | null;
            } | null;
            billingInterval?: string | null;
            price?: number;
            currency?: string;
            status?: string;
            renewalDate?: string | null;
            cancelAtPeriodEnd?: boolean;
            paymentMethod?: unknown;
            hasStripeCustomer?: boolean;
            stripeCustomerId?: string | null;
          };
        } | null;

        if (payload?.data) {
          const sData = payload.data;
          const planKey = (sData.currentPlan?.id ?? "starter").toLowerCase() as PlanId;

          // Use shared plan catalog instead of duplicated constants
          const features = PLAN_CATALOG[planKey]?.features ?? PLAN_CATALOG.starter.features;

          let renewalDate = sData.renewalDate ?? null;
          if (!renewalDate && planKey !== "starter") {
            const d = new Date();
            if (sData.currentPlan?.interval === "year" || sData.billingInterval === "year") {
              d.setFullYear(d.getFullYear() + 1);
            } else {
              d.setMonth(d.getMonth() + 1);
            }
            renewalDate = d.toISOString();
          }

          return json({
            data: {
              ...sData,
              renewalDate,
              currentPlan: sData.currentPlan
                ? {
                    ...sData.currentPlan,
                    features,
                    isFree: planKey === "starter" || sData.price === 0,
                  }
                : {
                    id: "starter",
                    name: "Starter",
                    interval: "month",
                    amount: 0,
                    currency: "USD",
                    status: "Active",
                    features: PLAN_CATALOG.starter?.features ?? [],
                    isFree: true,
                  },
            },
          });
        }
      }
    } catch {
      // Express server not responding or timed out, fallback to direct MongoDB
    }

    // 2. Direct MongoDB fallback
    const userIds: Array<string | ObjectId> = [userId];
    if (ObjectId.isValid(userId)) {
      userIds.push(new ObjectId(userId));
    }

    const userFilter = {
      $or: [
        { userId: { $in: userIds } },
        ...(user.email
          ? [
              { userEmail: user.email },
              { customerEmail: user.email },
              { "metadata.email": user.email },
            ]
          : []),
      ],
    };

    const applicationCount = await applicationsCollection.countDocuments(
      seekerApplicationFilter(new ObjectId(userId)),
    );
    const isFree =
      !latest ||
      !latest.plan ||
      String(latest.plan).toLowerCase() === "starter";
    const remainingApplications = isFree
      ? Math.max(0, FREE_PLAN_APPLICATION_LIMIT - applicationCount)
      : null;

    const latest = await db
      .collection("payments")
      .findOne(userFilter, { sort: { createdAt: -1 } });

    if (latest && latest.plan && latest.plan !== "starter") {
      const planKey = String(latest.plan).toLowerCase() as PlanId;
      const planInfo = PLAN_CATALOG[planKey] ?? {
        name: latest.planName ?? "Pro",
      };
      const isYearly = latest.interval === "year" || latest.billing === "yearly";
      const amount = latest.amount ?? (isYearly ? PLAN_PRICES[planKey].yearly : PLAN_PRICES[planKey].monthly);

      let renewalDate = latest.renewalDate ? new Date(latest.renewalDate).toISOString() : null;
      if (!renewalDate) {
        const d = latest.createdAt ? new Date(latest.createdAt) : new Date();
        if (isYearly) d.setFullYear(d.getFullYear() + 1);
        else d.setMonth(d.getMonth() + 1);
        renewalDate = d.toISOString();
      }

      // Use shared plan features from catalog
      const planFeatures = PLAN_CATALOG[planKey]?.features ?? PLAN_CATALOG.starter.features;

      return json({
        data: {
          currentPlan: {
            id: planKey,
            name: latest.planName ?? planInfo.name,
            interval: isYearly ? "year" : "month",
            amount,
            currency: String(latest.currency ?? "USD").toUpperCase(),
            status: latest.status === "failed" ? "Past due" : "Active",
            features: planFeatures,
            isFree: false,
          },
          billingInterval: isYearly ? "year" : "month",
          price: amount,
          currency: String(latest.currency ?? "USD").toUpperCase(),
          status: latest.status === "failed" ? "Past due" : "Active",
          renewalDate,
          cancelAtPeriodEnd: Boolean(latest.cancelAtPeriodEnd),
          paymentMethod: latest.paymentMethod ?? null,
          hasStripeCustomer: Boolean(latest.stripeCustomerId),
          stripeCustomerId: latest.stripeCustomerId ?? null,
          freePlanApplicationLimit: isFree ? FREE_PLAN_APPLICATION_LIMIT : null,
          applicationCount,
          remainingApplications,
        },
      });
    }

    // 3. Default Free Starter plan for active registered users
    return json({
      data: {
        currentPlan: {
          id: "starter",
          name: PLAN_CATALOG.starter.name,
          interval: "month",
          amount: PLAN_PRICES.starter.monthly,
          currency: "USD",
          status: "Active",
          features: PLAN_CATALOG.starter?.features ?? [],
          isFree: true,
        },
        billingInterval: "month",
        price: 0,
        currency: "USD",
        status: "Active",
        renewalDate: null,
        cancelAtPeriodEnd: false,
        paymentMethod: null,
        hasStripeCustomer: false,
        stripeCustomerId: null,
        freePlanApplicationLimit: 10,
        applicationCount: 0,
        remainingApplications: 10,
      },
    });
  } catch (error) {
    return logApiError("GET /api/billing/summary", error);
  }
}
