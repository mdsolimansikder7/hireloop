import { ObjectId } from "mongodb";

import { trackSeekerActivity } from "@/lib/dashboard/data";
import {
  apiError,
  authorizeApi,
  json,
  logApiError,
  readJson,
} from "@/lib/dashboard/http";
import { activityTrackSchema } from "@/lib/dashboard/schemas";

export async function POST(request: Request) {
  const access = await authorizeApi(["seeker"]);
  if (access.response) return access.response;

  const parsed = await readJson(request, activityTrackSchema);
  if (parsed.response) return parsed.response;

  try {
    const userId = new ObjectId(access.session.user.id);
    const jobId = new ObjectId(parsed.data.jobId);
    await trackSeekerActivity(userId, parsed.data.type, jobId);
    return json({ data: { type: parsed.data.type, jobId: jobId.toHexString() } }, 201);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) {
      return apiError("Activity could not be recorded", 409);
    }
    return logApiError("POST /api/activity/track", error);
  }
}
