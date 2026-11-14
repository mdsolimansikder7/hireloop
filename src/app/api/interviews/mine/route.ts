import { ObjectId } from "mongodb";

import { ensureDashboardIndexes, interviewsCollection } from "@/lib/db/dashboard";
import { normalizedInterview } from "@/lib/dashboard/data";
import {
  authorizeApi,
  json,
  logApiError,
  pagination,
  paginationMeta,
} from "@/lib/dashboard/http";

export async function GET(request: Request) {
  const access = await authorizeApi(["seeker"]);
  if (access.response) return access.response;

  const params = new URL(request.url).searchParams;
  const upcoming = params.get("upcoming");
  if (upcoming !== null && upcoming !== "true" && upcoming !== "false") {
    return json({ error: "upcoming must be true or false" }, 400);
  }
  const { page, limit, skip } = pagination(params);
  const filter: Record<string, unknown> = {
    seekerId: new ObjectId(access.session.user.id),
  };
  if (upcoming === "true") {
    filter.status = "scheduled";
    filter.scheduledAt = { $gte: new Date() };
  }

  try {
    await ensureDashboardIndexes();
    const [items, total] = await Promise.all([
      interviewsCollection
        .find(filter)
        .sort({ scheduledAt: upcoming === "true" ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      interviewsCollection.countDocuments(filter),
    ]);
    return json({
      data: items.map(normalizedInterview),
      meta: paginationMeta(page, limit, total),
    });
  } catch (error) {
    return logApiError("GET /api/interviews/mine", error);
  }
}
