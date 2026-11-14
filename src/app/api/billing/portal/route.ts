import { ObjectId } from "mongodb";

import { authorizeApi, json, logApiError } from "@/lib/dashboard/http";
import { db } from "@/lib/mongodb";

export async function POST(request: Request) {
  const access = await authorizeApi(["seeker", "admin", "recruiter"]);
  if (access.response) return access.response;

  const user = access.session.user;
  const userId = user.id;

  try {
    const body = (await request.json().catch(() => ({}))) as { returnUrl?: string };
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
    const serverEndpoint = `${apiUrl.replace(/\/+$/, "").replace(/\/api$/i, "")}/api/billing/portal?userId=${encodeURIComponent(userId)}`;

    try {
      const serverRes = await fetch(serverEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          returnUrl: body.returnUrl || "/billing",
          userId,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });

      if (serverRes.ok) {
        const payload = (await serverRes.json().catch(() => null)) as {
          data?: { url: string };
        } | null;

        if (payload?.data?.url) {
          return json({ data: payload.data }, 201);
        }
      }
    } catch {
      // Server not reachable
    }

    // Check if user has stripeCustomerId in DB
    const userIds: Array<string | ObjectId> = [userId];
    if (ObjectId.isValid(userId)) {
      userIds.push(new ObjectId(userId));
    }
    const userFilter = {
      $or: [
        { userId: { $in: userIds } },
        ...(user.email ? [{ userEmail: user.email }, { customerEmail: user.email }] : []),
      ],
    };

    const latest = await db
      .collection("payments")
      .findOne(userFilter, { sort: { createdAt: -1 } });

    if (!latest?.stripeCustomerId) {
      // Guide user to pricing page to select a plan & register payment method
      return json({ data: { url: "/pricing" } }, 200);
    }

    return json({ data: { url: "/pricing" } }, 200);
  } catch (error) {
    return logApiError("POST /api/billing/portal", error);
  }
}
