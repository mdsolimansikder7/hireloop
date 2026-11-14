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

function isClosed(job: Record<string, unknown>) {
  const status = readText(job.status)?.toLowerCase();
  return (
    job.isActive === false ||
    (status !== undefined &&
      ["closed", "expired", "filled", "archived"].includes(status))
  );
}

function deadline(job: Record<string, unknown>) {
  return (
    readDate(job.applicationDeadline) ??
    readDate(job.deadline) ??
    readDate(job.expiresAt)
  );
}

function category(job: Record<string, unknown>) {
  return (
    readText(job.category) ??
    readText(job.jobCategory) ??
    readText(job.department) ??
    readText(job.companyIndustry)
  );
}

export async function GET() {
  const access = await authorizeApi(["recruiter"]);
  if (access.response) return access.response;

  try {
    const recruiterId = new ObjectId(access.session.user.id);
    const jobs = await jobsCollection
      .find({
        recruiterId: { $in: idValues(recruiterId) },
        isDeleted: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .toArray();
    const jobIds = jobs
      .map((job) => newObjectId(job._id))
      .filter((id): id is ObjectId => id !== null);
    const applicationIds = jobIds.flatMap((id) => idValues(id));
    const counts = applicationIds.length
      ? await applicationsCollection
          .aggregate<{ _id: ObjectId | string; count: number }>([
            { $match: { jobId: { $in: applicationIds } } },
            { $group: { _id: "$jobId", count: { $sum: 1 } } },
          ])
          .toArray()
      : [];
    const countsByJobId = new Map<string, number>();
    for (const item of counts) {
      const id = newObjectId(item._id);
      if (id) {
        countsByJobId.set(
          id.toHexString(),
          (countsByJobId.get(id.toHexString()) ?? 0) + item.count,
        );
      }
    }

    return json({
      data: jobs.flatMap((job) => {
        const id = newObjectId(job._id);
        if (!id) return [];
        const raw = job as Record<string, unknown>;
        const closed = isClosed(raw);
        return [
          {
            id: id.toHexString(),
            title: readText(job.title) ?? "Untitled job",
            category: category(raw) ?? "Uncategorized",
            companyName: readText(job.companyName) ?? "Company",
            location: readText(job.location) ?? (job.remote === true ? "Remote" : "Location not specified"),
            type: readText(job.type) ?? "—",
            remote: job.remote === true,
            salaryMin: typeof job.salaryMin === "number" ? job.salaryMin : null,
            salaryMax: typeof job.salaryMax === "number" ? job.salaryMax : null,
            currency: readText(job.currency),
            salaryFrequency: readText(job.salaryFrequency),
            applicants: countsByJobId.get(id.toHexString()) ?? 0,
            status: closed ? "closed" : "active",
            deadline: deadline(raw)?.toISOString() ?? null,
            postedAt: readDate(job.createdAt)?.toISOString() ?? null,
          },
        ];
      }),
    });
  } catch (error) {
    return logApiError("GET /api/recruiter/jobs", error);
  }
}
