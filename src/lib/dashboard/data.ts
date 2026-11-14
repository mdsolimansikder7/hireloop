import { createHash } from "node:crypto";
import { ObjectId, type Document } from "mongodb";

import {
  activitiesCollection,
  applicationsCollection,
  ensureDashboardIndexes,
  interviewsCollection,
  jobsCollection,
  offersCollection,
  savedJobsCollection,
  type ActivityDocument,
  type ApplicationDocument,
} from "@/lib/db/dashboard";
import {
  idValues,
  objectId,
  paginationMeta,
  readDate,
  readText,
} from "@/lib/dashboard/http";

export async function prepareDashboardData() {
  await ensureDashboardIndexes();
}

export function newObjectId(value: unknown): ObjectId | null {
  return value instanceof ObjectId
    ? value
    : typeof value === "string" && ObjectId.isValid(value)
      ? new ObjectId(value)
      : null;
}

export function seekerApplicationFilter(userId: ObjectId) {
  const userIds = idValues(userId);
  return {
    $or: [
      { seekerId: { $in: userIds } },
      { userId: { $in: userIds } },
    ],
  };
}

export async function findJob(jobId: ObjectId) {
  return jobsCollection.findOne({ _id: jobId });
}

export async function findApplication(applicationId: ObjectId) {
  return applicationsCollection.findOne({ _id: applicationId });
}

export async function isRecruiterJobOwner(
  job: Document,
  userId: ObjectId,
): Promise<boolean> {
  const ownerId = newObjectId(job.recruiterId);
  return ownerId !== null && ownerId.equals(userId);
}

export async function appendActivity(
  activity: Omit<ActivityDocument, "_id"> & { _id?: ObjectId },
) {
  const sourceId = activity.applicationId ?? activity.jobId;
  const activityId =
    activity._id ??
    (sourceId
      ? stableActivityId(
          `${activity.type}:${activity.createdAt.getTime()}`,
          sourceId,
          activity.userId,
        )
      : new ObjectId());
  await activitiesCollection.updateOne(
    { _id: activityId },
    {
      $set: {
        userId: activity.userId,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        jobTitle: activity.jobTitle,
        companyName: activity.companyName,
        jobId: activity.jobId,
        applicationId: activity.applicationId,
        createdAt: activity.createdAt,
      },
      $setOnInsert: { _id: activityId },
    },
    { upsert: true },
  );
}

function stableActivityId(
  kind: string,
  sourceId: ObjectId,
  userId: ObjectId | string,
): ObjectId {
  const userIdValue =
    userId instanceof ObjectId ? userId.toHexString() : userId;
  const hex = createHash("sha256")
    .update(`${kind}:${userIdValue}:${sourceId.toHexString()}`)
    .digest("hex")
    .slice(0, 24);
  return new ObjectId(hex);
}

export async function syncExternalActivities(userId: ObjectId) {
  const userIds = idValues(userId);
  const [applications, savedJobs] = await Promise.all([
    applicationsCollection
      .find(seekerApplicationFilter(userId))
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
    savedJobsCollection
      .find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray(),
  ]);
  const jobIds = [
    ...applications.map((application) => newObjectId(application.jobId)),
    ...savedJobs.map((savedJob) => newObjectId(savedJob.jobId)),
  ].filter((id): id is ObjectId => id !== null);
  const uniqueJobIds = [
    ...new Map(jobIds.map((id) => [id.toHexString(), id])).values(),
  ];
  const jobDocuments = uniqueJobIds.length
    ? await jobsCollection.find({ _id: { $in: uniqueJobIds } }).toArray()
    : [];
  const jobsById = new Map(
    jobDocuments.map((job) => [String(job._id), job] as const),
  );
  const activities: ActivityDocument[] = [];

  for (const application of applications) {
    const applicationId = newObjectId(application._id);
    if (!applicationId) continue;
    const jobId = newObjectId(application.jobId);
    const job = jobId ? jobsById.get(jobId.toHexString()) : null;
    const jobTitle = readText(application.jobTitle) ?? readText(job?.title);
    const companyName =
      readText(application.companyName) ?? readText(job?.companyName);
    const createdAt = readDate(application.createdAt);
    if (!createdAt) continue;
    activities.push({
      _id: stableActivityId("applied", jobId ?? applicationId, userId),
      userId,
      type: "applied",
      title: "Application submitted",
      description: jobTitle
        ? `You applied for ${jobTitle}${companyName ? ` at ${companyName}` : ""}.`
        : "You submitted a job application.",
      jobTitle,
      companyName,
      jobId,
      applicationId,
      createdAt,
    });
  }

  for (const savedJob of savedJobs) {
    const savedId = newObjectId(savedJob._id);
    const jobId = newObjectId(savedJob.jobId);
    const createdAt = readDate(savedJob.createdAt ?? savedJob.savedAt);
    if (!savedId || !jobId || !createdAt) continue;
    const job = jobsById.get(jobId.toHexString());
    const jobTitle = readText(job?.title);
    const companyName = readText(job?.companyName);
    activities.push({
      _id: stableActivityId("job_saved", jobId, userId),
      userId,
      type: "job_saved",
      title: "Job saved",
      description: jobTitle
        ? `You saved ${jobTitle}${companyName ? ` at ${companyName}` : ""}.`
        : "You saved a job.",
      jobTitle,
      companyName,
      jobId,
      applicationId: null,
      createdAt,
    });
  }

  if (activities.length) {
    await activitiesCollection.bulkWrite(
      activities.map(({ _id, ...activity }) => ({
        updateOne: {
          filter: { _id },
          update: {
            $set: activity,
            $setOnInsert: { _id },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }
}

export async function trackSeekerActivity(
  userId: ObjectId,
  type: "applied" | "job_saved",
  jobId: ObjectId,
) {
  const job = await findJob(jobId);
  const jobTitle = readText(job?.title);
  const companyName = readText(job?.companyName);
  const title = type === "applied" ? "Application submitted" : "Job saved";
  const application = type === "applied"
    ? await applicationsCollection.findOne({
        $and: [
          { jobId: { $in: idValues(jobId) } },
          seekerApplicationFilter(userId),
        ],
      })
    : null;
  const description = jobTitle
    ? `${type === "applied" ? "You applied for" : "You saved"} ${jobTitle}${companyName ? ` at ${companyName}` : ""}.`
    : type === "applied"
      ? "You submitted a job application."
      : "You saved a job.";
  await activitiesCollection.updateOne(
    { _id: stableActivityId(type, jobId, userId) },
    {
      $set: {
        userId,
        type,
        title,
        description,
        jobTitle,
        companyName,
        jobId,
        applicationId: application
          ? newObjectId(application._id)
          : null,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

export async function normalizedApplications(
  applications: ApplicationDocument[],
) {
  const ids = applications
    .map((application) => newObjectId(application.jobId))
    .filter((id): id is ObjectId => id !== null);
  const jobs = ids.length
    ? await jobsCollection.find({ _id: { $in: ids } }).toArray()
    : [];
  const jobsById = new Map(
    jobs.map((job) => [String(job._id), job] as const),
  );

  return applications.map((application) => {
    const id = newObjectId(application._id);
    const jobId = newObjectId(application.jobId);
    const job = jobId ? jobsById.get(jobId.toHexString()) : null;
    return {
      id: id?.toHexString() ?? null,
      jobId: jobId?.toHexString() ?? null,
      jobTitle: readText(application.jobTitle) ?? readText(job?.title),
      companyName:
        readText(application.companyName) ?? readText(job?.companyName),
      logoUrl: readText(application.logoUrl) ?? readText(job?.logoUrl),
      status:
        typeof application.status === "string" ? application.status : "applied",
      coverNote: readText(application.coverNote),
      resumeUrl: readText(application.resumeUrl),
      createdAt: readDate(application.createdAt)?.toISOString() ?? null,
      updatedAt: readDate(application.updatedAt)?.toISOString() ?? null,
    };
  });
}

export function normalizedInterview(interview: Document) {
  return {
    id: String(interview._id),
    applicationId: newObjectId(interview.applicationId)?.toHexString() ?? null,
    jobId: newObjectId(interview.jobId)?.toHexString() ?? null,
    jobTitle: readText(interview.jobTitle),
    companyName: readText(interview.companyName),
    scheduledAt: readDate(interview.scheduledAt)?.toISOString() ?? null,
    durationMinutes:
      typeof interview.durationMinutes === "number"
        ? interview.durationMinutes
        : null,
    mode: readText(interview.mode),
    meetingLink: readText(interview.meetingLink),
    location: readText(interview.location),
    status: readText(interview.status),
    notes: readText(interview.notes),
    createdAt: readDate(interview.createdAt)?.toISOString() ?? null,
  };
}

export function normalizedOffer(offer: Document) {
  return {
    id: String(offer._id),
    applicationId: newObjectId(offer.applicationId)?.toHexString() ?? null,
    jobId: newObjectId(offer.jobId)?.toHexString() ?? null,
    jobTitle: readText(offer.jobTitle),
    companyName: readText(offer.companyName),
    salary: typeof offer.salary === "number" ? offer.salary : null,
    currency: readText(offer.currency),
    startDate: readDate(offer.startDate)?.toISOString() ?? null,
    expiresAt: readDate(offer.expiresAt)?.toISOString() ?? null,
    status: readText(offer.status),
    createdAt: readDate(offer.createdAt)?.toISOString() ?? null,
    respondedAt: readDate(offer.respondedAt)?.toISOString() ?? null,
  };
}

export function normalizedActivity(activity: Document) {
  return {
    id: String(activity._id),
    type: readText(activity.type),
    title: readText(activity.title),
    description: readText(activity.description),
    jobTitle: readText(activity.jobTitle),
    companyName: readText(activity.companyName),
    jobId: newObjectId(activity.jobId)?.toHexString() ?? null,
    applicationId: newObjectId(activity.applicationId)?.toHexString() ?? null,
    createdAt: readDate(activity.createdAt)?.toISOString() ?? null,
  };
}

export async function seekerDashboard(userId: ObjectId) {
  await syncExternalActivities(userId);
  const userIds = idValues(userId);
  const now = new Date();
  const pendingOfferFilter = {
    seekerId: userId,
    status: "pending" as const,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
  };
  const upcomingInterviewFilter = {
    seekerId: userId,
    status: "scheduled" as const,
    scheduledAt: { $gte: now },
  };
  const seekerApplications = seekerApplicationFilter(userId);

  const [
    applicationsCount,
    interviewsCount,
    offersCount,
    savedJobsCount,
    recentApplications,
    upcomingInterviews,
    pendingOffers,
    activity,
  ] = await Promise.all([
    applicationsCollection.countDocuments(seekerApplications),
    interviewsCollection.countDocuments(upcomingInterviewFilter),
    offersCollection.countDocuments(pendingOfferFilter),
    savedJobsCollection.countDocuments({ userId: { $in: userIds } }),
    applicationsCollection
      .find(seekerApplications)
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),
    interviewsCollection
      .find(upcomingInterviewFilter)
      .sort({ scheduledAt: 1 })
      .limit(5)
      .toArray(),
    offersCollection
      .find(pendingOfferFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),
    activitiesCollection
      .find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray(),
  ]);

  return {
    stats: {
      applications: applicationsCount,
      interviews: interviewsCount,
      offers: offersCount,
      savedJobs: savedJobsCount,
    },
    recentApplications: await normalizedApplications(recentApplications),
    upcomingInterviews: upcomingInterviews.map(normalizedInterview),
    pendingOffers: pendingOffers.map(normalizedOffer),
    activity: activity.map(normalizedActivity),
  };
}

export { paginationMeta, objectId };
