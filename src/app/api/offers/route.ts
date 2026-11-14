import { ObjectId } from "mongodb";

import {
  applicationsCollection,
  ensureDashboardIndexes,
  offersCollection,
} from "@/lib/db/dashboard";
import {
  appendActivity,
  findJob,
  isRecruiterJobOwner,
  newObjectId,
} from "@/lib/dashboard/data";
import {
  apiError,
  authorizeApi,
  json,
  logApiError,
  readJson,
} from "@/lib/dashboard/http";
import { offerCreateSchema } from "@/lib/dashboard/schemas";

export async function POST(request: Request) {
  const access = await authorizeApi(["recruiter", "admin"]);
  if (access.response) return access.response;
  const parsed = await readJson(request, offerCreateSchema);
  if (parsed.response) return parsed.response;

  try {
    await ensureDashboardIndexes();
    const applicationId = new ObjectId(parsed.data.applicationId);
    const application = await applicationsCollection.findOne({ _id: applicationId });
    if (!application) return apiError("Application not found", 404);
    const jobId = newObjectId(application.jobId);
    const seekerId = newObjectId(application.seekerId);
    if (!jobId || !seekerId) {
      return apiError("Application is missing valid job or seeker information", 422);
    }

    const job = await findJob(jobId);
    if (!job) return apiError("Job not found", 404);
    const userId = new ObjectId(access.session.user.id);
    if (
      access.session.user.role !== "admin" &&
      !(await isRecruiterJobOwner(job, userId))
    ) {
      return apiError("You do not own this job", 403);
    }

    const recruiterId = newObjectId(job.recruiterId);
    if (!recruiterId) return apiError("Job has no valid recruiter owner", 422);

    const now = new Date();
    const offer = {
      applicationId,
      jobId,
      seekerId,
      recruiterId,
      jobTitle: typeof job.title === "string" ? job.title : "Untitled role",
      companyName:
        typeof job.companyName === "string" ? job.companyName : "Company",
      salary: parsed.data.salary ?? null,
      currency: parsed.data.currency ?? null,
      startDate: parsed.data.startDate ?? null,
      expiresAt: parsed.data.expiresAt ?? null,
      status: "pending" as const,
      createdAt: now,
      respondedAt: null,
    };
    const result = await offersCollection.insertOne(offer);
    await applicationsCollection.updateOne(
      { _id: applicationId },
      { $set: { status: "offer", updatedAt: now } },
    );
    await appendActivity({
      userId: seekerId,
      type: "offer_received",
      title: "Offer received",
      description: `You received an offer for ${offer.jobTitle}${offer.companyName ? ` at ${offer.companyName}` : ""}.`,
      jobTitle: offer.jobTitle,
      companyName: offer.companyName,
      jobId,
      applicationId,
      createdAt: now,
    });

    return json(
      {
        data: {
          id: result.insertedId.toHexString(),
          ...offer,
          applicationId: applicationId.toHexString(),
          jobId: jobId.toHexString(),
          seekerId: seekerId.toHexString(),
          recruiterId: recruiterId.toHexString(),
          startDate: offer.startDate?.toISOString() ?? null,
          expiresAt: offer.expiresAt?.toISOString() ?? null,
          createdAt: now.toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    return logApiError("POST /api/offers", error);
  }
}
