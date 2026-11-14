import { ObjectId, type Document } from "mongodb";

import { db } from "@/lib/mongodb";

export const APPLICATION_STATUSES = [
  "applied",
  "reviewing",
  "shortlisted",
  "interview",
  "offer",
  "rejected",
  "hired",
] as const;

export const INTERVIEW_MODES = ["video", "phone", "onsite"] as const;
export const INTERVIEW_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export const OFFER_STATUSES = ["pending", "accepted", "declined", "expired"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type InterviewMode = (typeof INTERVIEW_MODES)[number];
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export interface ApplicationDocument extends Document {
  jobId?: ObjectId | string;
  seekerId?: ObjectId | string;
  userId?: ObjectId | string;
  recruiterId?: ObjectId | string;
  status?: string;
  coverNote?: string | null;
  resumeUrl?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  logoUrl?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface InterviewDocument extends Document {
  applicationId: ObjectId;
  jobId: ObjectId;
  seekerId: ObjectId;
  recruiterId: ObjectId;
  jobTitle: string;
  companyName: string;
  scheduledAt: Date;
  durationMinutes: number;
  mode: InterviewMode;
  meetingLink?: string | null;
  location?: string | null;
  status: InterviewStatus;
  notes?: string | null;
  createdAt: Date;
}

export interface OfferDocument extends Document {
  applicationId: ObjectId;
  jobId: ObjectId;
  seekerId: ObjectId;
  recruiterId: ObjectId;
  jobTitle: string;
  companyName: string;
  salary?: number | null;
  currency?: string | null;
  startDate?: Date | null;
  expiresAt?: Date | null;
  status: OfferStatus;
  createdAt: Date;
  respondedAt?: Date | null;
}

export interface ActivityDocument extends Document {
  userId: ObjectId | string;
  type:
    | "applied"
    | "job_saved"
    | "application_status_changed"
    | "interview_scheduled"
    | "offer_received"
    | "offer_accepted"
    | "offer_declined";
  title: string;
  description: string;
  jobTitle: string | null;
  companyName: string | null;
  jobId: ObjectId | null;
  applicationId: ObjectId | null;
  createdAt: Date;
}

export const applicationsCollection =
  db.collection<ApplicationDocument>("applications");
export const interviewsCollection =
  db.collection<InterviewDocument>("interviews");
export const offersCollection = db.collection<OfferDocument>("offers");
export const activitiesCollection = db.collection<ActivityDocument>("activities");
export const savedJobsCollection = db.collection<Document>("savedJobs");
export const jobsCollection = db.collection<Document>("jobs");

let dashboardIndexes: Promise<void> | undefined;

function mongoErrorCode(error: unknown): number | undefined {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "number"
    ? error.code
    : undefined;
}

export function ensureDashboardIndexes(): Promise<void> {
  if (!dashboardIndexes) {
    dashboardIndexes = (async () => {
      let existingIndexes = [];
      try {
        existingIndexes = await applicationsCollection.listIndexes().toArray();
      } catch (error) {
        if (mongoErrorCode(error) !== 26) throw error;
      }

      const oldUniqueIndex = existingIndexes.find(
        (index) => index.name === "jobId_seekerId_unique",
      );
      if (oldUniqueIndex && !oldUniqueIndex.partialFilterExpression) {
        try {
          await applicationsCollection.dropIndex("jobId_seekerId_unique");
        } catch (error) {
          if (mongoErrorCode(error) !== 27) throw error;
        }
      }

      await Promise.all([
        applicationsCollection.createIndex(
          { jobId: 1, seekerId: 1 },
          {
            unique: true,
            name: "jobId_seekerId_unique",
            partialFilterExpression: { seekerId: { $exists: true } },
          },
        ),
        applicationsCollection.createIndex(
          { seekerId: 1 },
          { name: "seekerId" },
        ),
        applicationsCollection.createIndex(
          { recruiterId: 1 },
          { name: "recruiterId" },
        ),
        interviewsCollection.createIndex(
          { seekerId: 1, scheduledAt: 1 },
          { name: "seekerId_scheduledAt" },
        ),
        interviewsCollection.createIndex(
          { recruiterId: 1 },
          { name: "recruiterId" },
        ),
        offersCollection.createIndex(
          { seekerId: 1, status: 1 },
          { name: "seekerId_status" },
        ),
        offersCollection.createIndex(
          { recruiterId: 1 },
          { name: "recruiterId" },
        ),
        activitiesCollection.createIndex(
          { userId: 1, createdAt: -1 },
          { name: "userId_createdAt_desc" },
        ),
      ]);
    })().catch((error: unknown) => {
      dashboardIndexes = undefined;
      throw error;
    });
  }

  return dashboardIndexes;
}
