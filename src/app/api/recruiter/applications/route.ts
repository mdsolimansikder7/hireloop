import { ObjectId } from "mongodb";

import {
  applicationsCollection,
  jobsCollection,
} from "@/lib/db/dashboard";
import {
  authorizeApi,
  idValues,
  json,
  logApiError,
  pagination,
  paginationMeta,
  readDate,
  readText,
} from "@/lib/dashboard/http";
import {
  applicationStatusSchema,
} from "@/lib/dashboard/schemas";
import { newObjectId } from "@/lib/dashboard/data";
import { db } from "@/lib/mongodb";

export async function GET(request: Request) {
  const access = await authorizeApi(["recruiter"]);
  if (access.response) return access.response;

  const params = new URL(request.url).searchParams;
  const status = params.get("status");
  if (status && status !== "all" && !applicationStatusSchema.safeParse(status).success) {
    return json({ error: "Invalid application status" }, 400);
  }
  const { page, limit, skip } = pagination(params, 20);

  try {
    const recruiterId = new ObjectId(access.session.user.id);
    const jobs = await jobsCollection
      .find({ recruiterId: { $in: idValues(recruiterId) } })
      .toArray();
    const jobsById = new Map<string, Record<string, unknown>>();
    for (const job of jobs) {
      const id = newObjectId(job._id);
      if (id) jobsById.set(id.toHexString(), job);
    }

    const jobIdValues = [...jobsById.values()]
      .map((job) => newObjectId(job._id))
      .filter((id): id is ObjectId => id !== null)
      .flatMap(idValues);
    const filter = jobIdValues.length
      ? {
          jobId: { $in: jobIdValues },
          ...(status && status !== "all" ? { status } : {}),
        }
      : { _id: { $exists: false } };

    const [applications, total] = await Promise.all([
      applicationsCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      applicationsCollection.countDocuments(filter),
    ]);

    const candidateIds = applications
      .map((application) => application.seekerId ?? application.userId)
      .filter((id): id is ObjectId | string =>
        id instanceof ObjectId || typeof id === "string",
      );
    const candidateObjectIds = candidateIds
      .map((id) => newObjectId(id))
      .filter((id): id is ObjectId => id !== null);
    const candidateValues = [
      ...candidateIds,
      ...candidateObjectIds.flatMap((id) => [id, id.toHexString()]),
    ];
    const candidates = candidateValues.length
      ? await db
          .collection("user")
          .find({
            $or: [
              { _id: { $in: candidateObjectIds } },
              { id: { $in: candidateValues.map(String) } },
            ],
          })
          .project({ name: 1, image: 1 })
          .toArray()
      : [];
    const candidatesById = new Map<string, Record<string, unknown>>();
    for (const candidate of candidates) {
      for (const key of [candidate._id, candidate.id]) {
        if (key !== undefined && key !== null) {
          candidatesById.set(String(key).toLowerCase(), candidate);
        }
      }
    }

    return json({
      data: applications.map((application) => {
        const applicantId = application.seekerId ?? application.userId;
        const applicantObjectId = newObjectId(applicantId);
        const candidate = applicantId == null
          ? null
          : candidatesById.get(String(applicantId).toLowerCase()) ??
            (applicantObjectId
              ? candidatesById.get(applicantObjectId.toHexString())
              : null);
        const jobId = newObjectId(application.jobId);
        const job = jobId ? jobsById.get(jobId.toHexString()) : null;

        return {
          id: String(application._id),
          candidateName: readText(candidate?.name) ?? "Candidate",
          candidateImage: readText(candidate?.image),
          jobId: jobId?.toHexString() ?? null,
          jobTitle:
            readText(application.jobTitle) ??
            readText(job?.title) ??
            "Role not specified",
          companyName:
            readText(application.companyName) ??
            readText(job?.companyName) ??
            "Company",
          appliedAt:
            readDate(application.createdAt ?? application.appliedAt)?.toISOString() ??
            null,
          experience:
            readText(application.experience) ??
            readText(application.experienceLevel) ??
            "—",
          status:
            readText(application.status)?.toLowerCase() ?? "applied",
        };
      }),
      meta: paginationMeta(page, limit, total),
    });
  } catch (error) {
    return logApiError("GET /api/recruiter/applications", error);
  }
}
