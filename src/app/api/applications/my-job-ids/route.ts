import { ObjectId } from "mongodb";

import { applicationsCollection } from "@/lib/db/dashboard";
import { authorizeApi, idValues, json, logApiError } from "@/lib/dashboard/http";

export async function GET() {
  const access = await authorizeApi(["seeker"]);
  if (access.response) return access.response;

  const userIds = idValues(new ObjectId(access.session.user.id));

  try {
    const applications = await applicationsCollection
      .find({
        $or: [
          { seekerId: { $in: userIds } },
          { userId: { $in: userIds } },
        ],
      })
      .project({ jobId: 1 })
      .toArray();

    const jobIds = [
      ...new Set(
        applications
          .map((application) => String(application.jobId ?? ""))
          .filter(Boolean),
      ),
    ];

    return json({ data: jobIds });
  } catch (error) {
    return logApiError("GET /api/applications/my-job-ids", error);
  }
}
