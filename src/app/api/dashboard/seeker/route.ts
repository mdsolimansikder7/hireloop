import { ObjectId } from "mongodb";

import { seekerDashboard } from "@/lib/dashboard/data";
import { authorizeApi, json, logApiError } from "@/lib/dashboard/http";

export async function GET() {
  const access = await authorizeApi(["seeker"]);
  if (access.response) return access.response;

  try {
    const data = await seekerDashboard(new ObjectId(access.session.user.id));
    return json({ data });
  } catch (error) {
    return logApiError("GET /api/dashboard/seeker", error);
  }
}
