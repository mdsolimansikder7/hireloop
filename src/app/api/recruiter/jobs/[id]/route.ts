import { ObjectId } from "mongodb";
import { z } from "zod";

import { jobsCollection } from "@/lib/db/dashboard";
import {
  apiError,
  authorizeApi,
  idValues,
  json,
  logApiError,
  readDate,
  readJson,
  readText,
} from "@/lib/dashboard/http";

const jobUpdateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(12000),
  companyName: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  type: z.string().trim().min(2).max(40),
  remote: z.boolean(),
  location: z.string().trim().max(120),
  applicationDeadline: z.string().trim().max(40),
  salaryMin: z.number().nonnegative().nullable(),
  salaryMax: z.number().nonnegative().nullable(),
  currency: z.string().trim().length(3),
  salaryFrequency: z.string().trim().max(40),
  responsibilities: z.array(z.string().trim().min(1).max(500)).max(30),
  requirements: z.array(z.string().trim().min(1).max(500)).max(30),
});
const statusSchema = z.object({ status: z.enum(["open", "closed"]) });

function descriptionSection(description: string, heading: string) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = description.match(
    new RegExp(
      `(?:^|\\n)${escapedHeading}:\\s*([\\s\\S]*?)(?=\\n\\s*(?:Responsibilities|Requirements):|$)`,
      "i",
    ),
  );
  return match?.[1]
    ?.split(/\r?\n/)
    .map((item) => item.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean) ?? [];
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await authorizeApi(["recruiter"]);
  if (access.response) return access.response;
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return apiError("Invalid job id", 400);

  try {
    const job = await jobsCollection.findOne({
      _id: new ObjectId(id),
      recruiterId: { $in: idValues(new ObjectId(access.session.user.id)) },
      isDeleted: { $ne: true },
    });
    if (!job) return apiError("Job not found", 404);
    const description = readText(job.description) ?? "";
    const responsibilities = Array.isArray(job.responsibilities)
      ? job.responsibilities.filter((item): item is string => typeof item === "string")
      : descriptionSection(description, "Responsibilities");
    const requirements = Array.isArray(job.requirements)
      ? job.requirements.filter((item): item is string => typeof item === "string")
      : descriptionSection(description, "Requirements");
    return json({
      data: {
        id,
        title: readText(job.title) ?? "",
        description,
        companyName: readText(job.companyName) ?? "",
        category:
          readText(job.category) ??
          readText(job.jobCategory) ??
          readText(job.department) ??
          "",
        type: readText(job.type) ?? "Full-time",
        remote: job.remote === true,
        location: readText(job.location) ?? "",
        applicationDeadline:
          readDate(job.applicationDeadline)?.toISOString().slice(0, 10) ??
          readDate(job.deadline)?.toISOString().slice(0, 10) ??
          "",
        salaryMin: typeof job.salaryMin === "number" ? job.salaryMin : null,
        salaryMax: typeof job.salaryMax === "number" ? job.salaryMax : null,
        currency: readText(job.currency) ?? "USD",
        salaryFrequency: readText(job.salaryFrequency) ?? "per year",
        responsibilities,
        requirements,
      },
    });
  } catch (error) {
    return logApiError("GET /api/recruiter/jobs/:id", error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await authorizeApi(["recruiter"]);
  if (access.response) return access.response;
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return apiError("Invalid job id", 400);
  const parsed = await readJson(
    request,
    z.union([jobUpdateSchema, statusSchema]),
  );
  if (parsed.response) return parsed.response;

  try {
    const jobId = new ObjectId(id);
    const recruiterId = new ObjectId(access.session.user.id);
    if ("status" in parsed.data) {
      const result = await jobsCollection.updateOne(
        { _id: jobId, recruiterId: { $in: idValues(recruiterId) }, isDeleted: { $ne: true } },
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
    }

    if (
      parsed.data.salaryMin !== null &&
      parsed.data.salaryMax !== null &&
      parsed.data.salaryMin > parsed.data.salaryMax
    ) {
      return apiError("Minimum salary cannot exceed maximum salary.", 400);
    }

    const result = await jobsCollection.updateOne(
      {
        _id: jobId,
        recruiterId: { $in: idValues(recruiterId) },
        isDeleted: { $ne: true },
      },
      {
        $set: {
          ...parsed.data,
          updatedAt: new Date(),
        },
      },
    );
    if (result.matchedCount === 0) return apiError("Job not found", 404);
    return json({ data: { id, updated: true } });
  } catch (error) {
    return logApiError("PATCH /api/recruiter/jobs/:id", error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await authorizeApi(["recruiter"]);
  if (access.response) return access.response;
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return apiError("Invalid job id", 400);

  try {
    const result = await jobsCollection.updateOne(
      {
        _id: new ObjectId(id),
        recruiterId: { $in: idValues(new ObjectId(access.session.user.id)) },
        isDeleted: { $ne: true },
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          status: "closed",
          isActive: false,
          updatedAt: new Date(),
        },
      },
    );
    if (result.matchedCount === 0) return apiError("Job not found", 404);
    return json({ data: { id, deleted: true } });
  } catch (error) {
    return logApiError("DELETE /api/recruiter/jobs/:id", error);
  }
}
