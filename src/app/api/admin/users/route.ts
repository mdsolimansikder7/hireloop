import { authorizeApi, json, logApiError, pagination } from "@/lib/dashboard/http";
import { db } from "@/lib/mongodb";

const USER_ROLES = ["seeker", "recruiter", "admin"] as const;

export async function GET(request: Request) {
  const access = await authorizeApi(["admin"]);
  if (access.response) return access.response;

  const searchParams = new URL(request.url).searchParams;
  const search = (searchParams.get("q") ?? "").trim().slice(0, 100);
  const role = searchParams.get("role") ?? "all";
  const status = searchParams.get("status") ?? "all";

  if (
    (role !== "all" && !USER_ROLES.includes(role as (typeof USER_ROLES)[number])) ||
    !["all", "active", "suspended"].includes(status)
  ) {
    return json({ error: "Invalid user filter" }, 400);
  }

  const { page, limit, skip } = pagination(searchParams, 20);
  const users = db.collection("user");
  const filter: Record<string, unknown> = {};

  if (role !== "all") filter.role = role;
  if (status === "active") filter.suspended = { $ne: true };
  if (status === "suspended") filter.suspended = true;
  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { email: { $regex: escapedSearch, $options: "i" } },
      { companyName: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [totalUsers, activeUsers, recruiterCount, suspendedUsers, newThisMonth, totalMatching, rows] =
      await Promise.all([
        users.countDocuments({}),
        users.countDocuments({ suspended: { $ne: true } }),
        users.countDocuments({ role: "recruiter" }),
        users.countDocuments({ suspended: true }),
        users.countDocuments({ createdAt: { $gte: monthStart } }),
        users.countDocuments(filter),
        users
          .find(filter, {
            projection: {
              name: 1,
              email: 1,
              role: 1,
              companyName: 1,
              createdAt: 1,
              suspended: 1,
            },
          })
          .sort({ createdAt: -1, _id: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
      ]);

    return json({
      data: {
        stats: { totalUsers, activeUsers, recruiterCount, suspendedUsers, newThisMonth },
        users: rows.map((user) => ({
          id: String(user._id),
          name: typeof user.name === "string" ? user.name : "",
          email: typeof user.email === "string" ? user.email : "",
          role: typeof user.role === "string" ? user.role : "seeker",
          companyName: typeof user.companyName === "string" ? user.companyName : null,
          createdAt:
            user.createdAt instanceof Date
              ? user.createdAt.toISOString()
              : typeof user.createdAt === "string"
                ? user.createdAt
                : null,
          suspended: user.suspended === true,
        })),
        pagination: {
          page,
          limit,
          total: totalMatching,
          totalPages: Math.ceil(totalMatching / limit),
        },
      },
    });
  } catch (error) {
    return logApiError("GET /api/admin/users", error);
  }
}
