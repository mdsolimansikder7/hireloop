import { ObjectId } from "mongodb";

import { applicationsCollection, jobsCollection } from "@/lib/db/dashboard";
import {
  authorizeApi,
  idValues,
  json,
  logApiError,
  readDate,
  readText,
} from "@/lib/dashboard/http";
import { newObjectId } from "@/lib/dashboard/data";
import { db } from "@/lib/mongodb";

function isClosedJob(job: Record<string, unknown>) {
  const status = readText(job.status)?.toLowerCase();
  return (
    job.isActive === false ||
    (status !== undefined &&
      ["closed", "expired", "filled", "archived"].includes(status))
  );
}

export async function GET() {
  const access = await authorizeApi(["recruiter"]);
  if (access.response) return access.response;

  try {
    const recruiterId = new ObjectId(access.session.user.id);
    const jobs = await jobsCollection
      .find({ recruiterId: { $in: idValues(recruiterId) } })
      .toArray();
    const visibleJobs = jobs.filter((job) => job.isDeleted !== true);
    const jobIds = jobs
      .map((job) => newObjectId(job._id))
      .filter((id): id is ObjectId => id !== null);
    const jobIdValues = jobIds.flatMap(idValues);

    const applicationFilter = jobIdValues.length
      ? { jobId: { $in: jobIdValues } }
      : { _id: { $exists: false } };

    const [applications, totalApplicants] = await Promise.all([
      applicationsCollection
        .find(applicationFilter)
        .sort({ createdAt: -1 })
        .limit(8)
        .toArray(),
      applicationsCollection.countDocuments(applicationFilter),
    ]);

    const candidateIds = applications
      .map((application) => newObjectId(application.seekerId ?? application.userId))
      .filter((id): id is ObjectId => id !== null);
    const uniqueCandidateIds = [
      ...new Map(candidateIds.map((id) => [id.toHexString(), id])).values(),
    ];
    const candidates = uniqueCandidateIds.length
      ? await db
          .collection("user")
          .find(
            {
              $or: [
                { _id: { $in: uniqueCandidateIds } },
                { id: { $in: uniqueCandidateIds.map((id) => id.toHexString()) } },
              ],
            },
            { projection: { name: 1, image: 1 } },
          )
          .toArray()
      : [];
    const candidatesById = new Map(
      candidates.map((candidate) => [String(candidate._id), candidate] as const),
    );
    const jobsById = new Map(
      jobs.map((job) => [String(job._id), job] as const),
    );
    const closedJobs = visibleJobs.filter((job) =>
      isClosedJob(job as Record<string, unknown>),
    ).length;

    return json({
      data: {
        stats: {
          totalJobs: visibleJobs.length,
          totalApplicants,
          activeJobs: visibleJobs.length - closedJobs,
          closedJobs,
        },
        recentApplications: applications.map((application) => {
          const seekerId = newObjectId(application.seekerId ?? application.userId);
          const jobId = newObjectId(application.jobId);
          const candidate = seekerId
            ? candidatesById.get(seekerId.toHexString())
            : null;
          const job = jobId ? jobsById.get(jobId.toHexString()) : null;

          return {
            id: String(application._id),
            candidateName: readText(candidate?.name) ?? "Candidate",
            candidateImage: readText(candidate?.image),
            role: readText(application.jobTitle) ?? readText(job?.title) ?? "Role not specified",
            appliedAt: readDate(application.createdAt)?.toISOString() ?? null,
            experience:
              readText(application.experience) ??
              readText(application.experienceLevel) ??
              "—",
            status:
              readText(application.status)?.toLowerCase() ?? "applied",
          };
        }),
      },
    });
  } catch (error) {
    return logApiError("GET /api/recruiter/dashboard", error);
  }
}
