import { ObjectId } from "mongodb";

import { ensureDashboardIndexes, offersCollection } from "@/lib/db/dashboard";
import { normalizedOffer } from "@/lib/dashboard/data";
import { authorizeApi, json, logApiError } from "@/lib/dashboard/http";

export async function GET() {
  const access = await authorizeApi(["seeker"]);
  if (access.response) return access.response;

  try {
    await ensureDashboardIndexes();
    const items = await offersCollection
      .find({ seekerId: new ObjectId(access.session.user.id) })
      .sort({ createdAt: -1 })
      .toArray();
    return json({ data: items.map(normalizedOffer) });
  } catch (error) {
    return logApiError("GET /api/offers/mine", error);
  }
}
