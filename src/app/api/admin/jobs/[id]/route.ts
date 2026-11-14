import { ObjectId } from "mongodb";
import { z } from "zod";

import {
  apiError,
  authorizeApi,
  json,
  logApiError,
  readJson,
} from "@/lib/dashboard/http";
import { jobsCollection } from "@/lib/db/dashboard";

const statusSchema = z.object({
  status: z.enum(["open", "closed"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await authorizeApi(["admin"]);
  if (access.response) return access.response;

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return apiError("Invalid job identifier", 400);
  const parsed = await readJson(request, statusSchema);
  if (parsed.response) return parsed.response;

  try {
    const result = await jobsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: parsed.data.status,
          isActive: parsed.data.status === "open",
          updatedAt: new Date(),
        },
      },
    );
    if (result.matchedCount === 0) return apiError("Job not found", 404);
    return json({ data: { id, status: parsed.data.status } });
  } catch (error) {
    return logApiError("PATCH /api/admin/jobs/[id]", error);
  }
}
