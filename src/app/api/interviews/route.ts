import { ObjectId } from "mongodb";

import {
  applicationsCollection,
  ensureDashboardIndexes,
  interviewsCollection,
  type ApplicationDocument,
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
import { interviewCreateSchema } from "@/lib/dashboard/schemas";

export async function POST(request: Request) {
  const access = await authorizeApi(["recruiter", "admin"]);
  if (access.response) return access.response;
  const parsed = await readJson(request, interviewCreateSchema);
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
    const interview = {
      applicationId,
      jobId,
      seekerId,
      recruiterId,
      jobTitle: typeof job.title === "string" ? job.title : "Untitled role",
      companyName:
        typeof job.companyName === "string" ? job.companyName : "Company",
      scheduledAt: parsed.data.scheduledAt,
      durationMinutes: parsed.data.durationMinutes,
      mode: parsed.data.mode,
      meetingLink: parsed.data.meetingLink ?? null,
      location: parsed.data.location ?? null,
      status: "scheduled" as const,
      notes: parsed.data.notes ?? null,
      createdAt: now,
    };
    const result = await interviewsCollection.insertOne(interview);
    await applicationsCollection.updateOne(
      { _id: applicationId } as Partial<ApplicationDocument>,
      { $set: { status: "interview", updatedAt: now } },
    );
    await appendActivity({
      userId: seekerId,
      type: "interview_scheduled",
      title: "Interview scheduled",
      description: `An interview for ${interview.jobTitle}${interview.companyName ? ` at ${interview.companyName}` : ""} has been scheduled.`,
      jobTitle: interview.jobTitle,
      companyName: interview.companyName,
      jobId,
      applicationId,
      createdAt: now,
    });

    return json(
      {
        data: {
          id: result.insertedId.toHexString(),
          ...interview,
          applicationId: applicationId.toHexString(),
          jobId: jobId.toHexString(),
          seekerId: seekerId.toHexString(),
          recruiterId: recruiterId.toHexString(),
          scheduledAt: interview.scheduledAt.toISOString(),
          createdAt: now.toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    return logApiError("POST /api/interviews", error);
  }
}
