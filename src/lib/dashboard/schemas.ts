import { z } from "zod";

import { APPLICATION_STATUSES, INTERVIEW_MODES } from "@/lib/db/dashboard";

const objectIdPattern = /^[\da-f]{24}$/i;
export const objectIdSchema = z.string().regex(objectIdPattern, "Invalid id");

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);
export const applicationStatusChangeSchema = z.object({
  status: applicationStatusSchema,
});

export const applicationApplySchema = z.object({
  jobId: z.string().trim().min(1),
});

export const offerResponseSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export const activityTrackSchema = z.object({
  type: z.enum(["applied", "job_saved"]),
  jobId: objectIdSchema,
});

export const interviewCreateSchema = z.object({
  applicationId: objectIdSchema,
  scheduledAt: z.coerce.date(),
  durationMinutes: z.number().int().min(1).max(1440),
  mode: z.enum(INTERVIEW_MODES),
  meetingLink: z.string().url().optional(),
  location: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const offerCreateSchema = z.object({
  applicationId: objectIdSchema,
  salary: z.number().nonnegative().optional(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  startDate: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

export type InterviewCreateInput = z.infer<typeof interviewCreateSchema>;
export type OfferCreateInput = z.infer<typeof offerCreateSchema>;
