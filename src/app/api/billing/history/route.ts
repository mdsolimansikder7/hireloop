import { ObjectId } from "mongodb";

import { API_BASE } from "@/lib/api/base";
import { authorizeApi, json, logApiError } from "@/lib/dashboard/http";
import { db } from "@/lib/mongodb";

export async function GET() {
  const access = await authorizeApi(["seeker", "admin", "recruiter"]);
  if (access.response) return access.response;

  const user = access.session.user;
  const userId = user.id;

  try {
    // 1. Try querying the express server on port 5000 if running
    const serverEndpoint = `${API_BASE}/billing/history?userId=${encodeURIComponent(userId)}`;

    try {
      const serverRes = await fetch(serverEndpoint, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      });

      if (serverRes.ok) {
        const payload = (await serverRes.json().catch(() => null)) as {
          data?: Array<{
            id?: string | null;
            date?: string | null;
            planName?: string | null;
            interval?: string | null;
            amount?: number;
            currency?: string;
            status?: string;
            transactionId?: string | null;
            receiptUrl?: string | null;
          }>;
        } | null;

        if (Array.isArray(payload?.data) && payload.data.length > 0) {
          return json({ data: payload.data });
        }
      }
    } catch {
      // Fallback to MongoDB
    }

    // 2. Direct MongoDB lookup
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

    const docs = await db
      .collection("payments")
      .find(userFilter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const statusMap: Record<string, string> = {
      success: "paid",
      paid: "paid",
      pending: "pending",
      failed: "failed",
      refunded: "refunded",
    };

    const history = docs.map((doc) => ({
      id: doc.transactionId ? String(doc.transactionId) : doc._id ? String(doc._id) : null,
      date: doc.createdAt
        ? new Date(doc.createdAt).toISOString()
        : doc.updatedAt
          ? new Date(doc.updatedAt).toISOString()
          : null,
      planName: doc.planName ?? (doc.plan === "premium" ? "Premium" : doc.plan === "growth" ? "Growth" : "Pro"),
      interval: doc.interval ?? (doc.billing === "yearly" ? "year" : "month"),
      amount: doc.amount ?? 0,
      currency: String(doc.currency ?? "USD").toUpperCase(),
      status: statusMap[String(doc.status)] ?? String(doc.status ?? "paid"),
      transactionId: doc.transactionId ? String(doc.transactionId) : null,
      receiptUrl: doc.receiptUrl ? String(doc.receiptUrl) : null,
    }));

    return json({ data: history });
  } catch (error) {
    return logApiError("GET /api/billing/history", error);
  }
}
