import { ObjectId } from "mongodb";

import { activitiesCollection } from "@/lib/db/dashboard";
import {
  normalizedActivity,
  syncExternalActivities,
} from "@/lib/dashboard/data";
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
  const { page, limit, skip } = pagination(params);
  const userId = new ObjectId(access.session.user.id);
  const filter = { userId: { $in: [userId, userId.toHexString()] } };

  try {
    await syncExternalActivities(userId);
    const [items, total] = await Promise.all([
      activitiesCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      activitiesCollection.countDocuments(filter),
    ]);
    return json({
      data: items.map(normalizedActivity),
      meta: paginationMeta(page, limit, total),
    });
  } catch (error) {
    return logApiError("GET /api/activity/mine", error);
  }
}
