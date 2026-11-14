import { ObjectId } from "mongodb";

import { applicationsCollection, jobsCollection } from "@/lib/db/dashboard";
import {
  authorizeApi,
  json,
  logApiError,
  pagination,
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

function getCategory(job: Record<string, unknown>) {
  return (
    readText(job.category) ??
    readText(job.jobCategory) ??
    readText(job.department) ??
    readText(job.companyIndustry) ??
    "Uncategorized"
  );
}

export async function GET(request: Request) {
  const access = await authorizeApi(["admin"]);
  if (access.response) return access.response;

  const searchParams = new URL(request.url).searchParams;
  const search = (searchParams.get("q") ?? "").trim().slice(0, 100);
  const categoryFilter = (searchParams.get("category") ?? "all").trim();
  const statusFilter = searchParams.get("status") ?? "all";
  if (!["all", "active", "closed"].includes(statusFilter)) {
    return json({ error: "Invalid job status filter" }, 400);
  }
  const { page, limit, skip } = pagination(searchParams, 10);

  try {
    const jobs = await jobsCollection
      .find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();
    const allJobs = jobs.map((job) => {
      const raw = job as Record<string, unknown>;
      const id = newObjectId(job._id);
      return {
        id: id?.toHexString() ?? "",
        title: readText(job.title) ?? "Untitled job",
        companyName: readText(job.companyName) ?? "Company not specified",
        category: getCategory(raw),
        type: readText(job.type) ?? "—",
        postedAt: readDate(job.createdAt)?.toISOString() ?? null,
        status: isClosed(raw) ? "closed" as const : "active" as const,
      };
    }).filter((job) => job.id);
    const categories = [...new Set(allJobs.map((job) => job.category))]
      .sort((a, b) => a.localeCompare(b));
    const query = search.toLocaleLowerCase();
    const filteredJobs = allJobs.filter((job) => {
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || job.category === categoryFilter;
      const matchesSearch =
        !query ||
        [job.title, job.companyName, job.category, job.type]
          .some((value) => value.toLocaleLowerCase().includes(query));
      return matchesStatus && matchesCategory && matchesSearch;
    });
    const total = filteredJobs.length;
    const pageJobs = filteredJobs.slice(skip, skip + limit);
    const jobIds = pageJobs.flatMap((job) => {
      const id = newObjectId(job.id);
      return id ? [id, id.toHexString()] : [];
    });
    const applicationCounts = jobIds.length
      ? await applicationsCollection
          .aggregate<{ _id: ObjectId | string; count: number }>([
            { $match: { jobId: { $in: jobIds } } },
            { $group: { _id: "$jobId", count: { $sum: 1 } } },
          ])
          .toArray()
      : [];
    const countsByJobId = new Map<string, number>();
    for (const item of applicationCounts) {
      const id = newObjectId(item._id);
      if (id) {
        countsByJobId.set(
          id.toHexString(),
          (countsByJobId.get(id.toHexString()) ?? 0) + item.count,
        );
      }
    }

    const totalApplications = await applicationsCollection.countDocuments({});
    const activeJobs = allJobs.filter((job) => job.status === "active").length;
    const closedJobs = allJobs.length - activeJobs;

    return json({
      data: {
        jobs: pageJobs.map((job) => ({
          ...job,
          applications: countsByJobId.get(job.id) ?? 0,
        })),
        categories,
        stats: {
          totalJobs: allJobs.length,
          activeJobs,
          closedJobs,
          totalApplications,
          averageApplications:
            allJobs.length === 0
              ? 0
              : Math.round((totalApplications / allJobs.length) * 10) / 10,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return logApiError("GET /api/admin/jobs", error);
  }
}
