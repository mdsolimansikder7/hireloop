import { ObjectId } from "mongodb";

import {
  applicationsCollection,
  jobsCollection,
} from "@/lib/db/dashboard";
import {
  authorizeApi,
  json,
  logApiError,
  readDate,
  readText,
} from "@/lib/dashboard/http";
import { newObjectId } from "@/lib/dashboard/data";
import { db } from "@/lib/mongodb";

type ActivityRow = {
  id: string;
  kind: "User joined" | "Job posted" | "Application submitted";
  user: string;
  details: string;
  createdAt: string | null;
};

export async function GET() {
  const access = await authorizeApi(["admin"]);
  if (access.response) return access.response;

  try {
    const users = db.collection("user");
    const [totalUsers, totalRecruiters, totalSeekers, companyNames, totalJobs, totalApplications] =
      await Promise.all([
        users.countDocuments({}),
        users.countDocuments({ role: "recruiter" }),
        users.countDocuments({ role: "seeker" }),
        users.distinct("companyName", {
          role: "recruiter",
          companyName: { $type: "string", $ne: "" },
        }),
        jobsCollection.countDocuments({ isDeleted: { $ne: true } }),
        applicationsCollection.countDocuments({}),
      ]);
    const totalCompanies = new Set(
      companyNames
        .flatMap((value): string[] =>
          typeof value === "string" && value.trim()
            ? [value.trim().toLocaleLowerCase()]
            : [],
        ),
    ).size;

    const [recentUsers, recentJobs, recentApplications] = await Promise.all([
      users
        .find(
          {},
          { projection: { name: 1, email: 1, role: 1, createdAt: 1 } },
        )
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
      jobsCollection
        .find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
      applicationsCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
    ]);

    const userIds = recentApplications
      .map((application) => newObjectId(application.seekerId))
      .filter((id): id is ObjectId => id !== null);
    const jobIds = recentApplications
      .map((application) => newObjectId(application.jobId))
      .filter((id): id is ObjectId => id !== null);
    const [applicationUsers, applicationJobs] = await Promise.all([
      userIds.length
        ? users
            .find(
              { _id: { $in: userIds } },
              { projection: { name: 1, email: 1 } },
            )
            .toArray()
        : [],
      jobIds.length
        ? jobsCollection
            .find(
              { _id: { $in: jobIds } },
              { projection: { title: 1, companyName: 1 } },
            )
            .toArray()
        : [],
    ]);
    const usersById = new Map(
      applicationUsers.map((user) => [String(user._id), user] as const),
    );
    const jobsById = new Map(
      applicationJobs.map((job) => [String(job._id), job] as const),
    );

    const activity: ActivityRow[] = [
      ...recentUsers.map((user) => ({
        id: `user:${String(user._id)}`,
        kind: "User joined" as const,
        user: readText(user.name) ?? readText(user.email) ?? "New user",
        details:
          user.role === "recruiter"
            ? `Recruiter${readText(user.companyName) ? ` · ${readText(user.companyName)}` : ""}`
            : user.role === "admin"
              ? "Admin account"
              : "Job seeker",
        createdAt: readDate(user.createdAt)?.toISOString() ?? null,
      })),
      ...recentJobs.map((job) => ({
        id: `job:${String(job._id)}`,
        kind: "Job posted" as const,
        user: readText(job.companyName) ?? "Company not specified",
        details: readText(job.title) ?? "Untitled job",
        createdAt: readDate(job.createdAt)?.toISOString() ?? null,
      })),
      ...recentApplications.map((application) => {
        const seekerId = newObjectId(application.seekerId);
        const jobId = newObjectId(application.jobId);
        const seeker = seekerId ? usersById.get(seekerId.toHexString()) : null;
        const job = jobId ? jobsById.get(jobId.toHexString()) : null;
        return {
          id: `application:${String(application._id)}`,
          kind: "Application submitted" as const,
          user: readText(seeker?.name) ?? readText(seeker?.email) ?? "Job seeker",
          details:
            readText(application.jobTitle) ??
            readText(job?.title) ??
            "Job application",
          createdAt: readDate(application.createdAt)?.toISOString() ?? null,
        };
      }),
    ]
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 10);

    return json({
      data: {
        stats: {
          totalUsers,
          totalRecruiters,
          totalSeekers,
          totalCompanies,
          totalJobs,
          totalApplications,
        },
        activity,
      },
    });
  } catch (error) {
    return logApiError("GET /api/admin/dashboard", error);
  }
}
