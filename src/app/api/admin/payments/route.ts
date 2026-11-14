import { applicationsCollection } from "@/lib/db/dashboard";
import { authorizeApi, json, logApiError } from "@/lib/dashboard/http";
import { db } from "@/lib/mongodb";

export async function GET(request: Request) {
  const access = await authorizeApi(["admin"]);
  if (access.response) return access.response;

  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? "").trim().slice(0, 100).toLowerCase();
  const status = params.get("status") ?? "all";
  if (!["all", "success", "pending", "failed"].includes(status)) {
    return json({ error: "Invalid payment status filter" }, 400);
  }
  const parsedPage = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const limit = 10;

  try {
    const filter: Record<string, unknown> = {};
    if (status !== "all") {
      filter.status = status;
    }
    if (query) {
      filter.$or = [
        { transactionId: { $regex: query, $options: "i" } },
        { userEmail: { $regex: query, $options: "i" } },
        { userName: { $regex: query, $options: "i" } },
        { planName: { $regex: query, $options: "i" } },
      ];
    }

    const [applicationCount, usersCount, totalCount, payments, allSuccessPayments] = await Promise.all([
      applicationsCollection.countDocuments({}),
      db.collection("user").countDocuments({}),
      db.collection("payments").countDocuments(filter),
      db
        .collection("payments")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      db.collection("payments").find({ status: { $in: ["success", "paid"] } }).toArray(),
    ]);

    const totalRevenueCents = allSuccessPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    );
    const totalRevenue = totalRevenueCents / 100;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const monthlyRevenueCents = allSuccessPayments
      .filter((p) => p.createdAt && new Date(p.createdAt) >= oneMonthAgo)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const monthlyRevenue = monthlyRevenueCents / 100;

    const activeProUsers = new Set(
      allSuccessPayments.map((p) => String(p.userId || p.userEmail)).filter(Boolean),
    ).size;

    const enterpriseUsers = allSuccessPayments.filter(
      (p) => String(p.plan || "").toLowerCase() === "premium",
    ).length;

    const transactions = payments.map((p) => ({
      id: String(p.transactionId || p._id),
      transactionId: String(p.transactionId || p._id),
      user: {
        id: String(p.userId || ""),
        name: p.userName ? String(p.userName) : "User",
        email: p.userEmail ? String(p.userEmail) : "user@hireloop.com",
      },
      plan: String(p.planName || p.plan || "Pro"),
      amount: (Number(p.amount) || 0) / 100,
      currency: String(p.currency || "USD").toUpperCase(),
      status: String(p.status || "success"),
      date: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      receiptUrl: p.receiptUrl ? String(p.receiptUrl) : null,
    }));

    return json({
      data: {
        revenueAvailable: true,
        transactions,
        stats: {
          totalRevenue,
          monthlyRevenue,
          activeProUsers,
          enterpriseUsers,
          transactionCount: allSuccessPayments.length,
          applicationCount,
          usersCount,
        },
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        },
        filters: {
          query: query || null,
          status,
        },
      },
    });
  } catch (error) {
    return logApiError("GET /api/admin/payments", error);
  }
}
