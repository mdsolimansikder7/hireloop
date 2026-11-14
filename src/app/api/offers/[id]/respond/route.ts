import { ObjectId } from "mongodb";

import {
  applicationsCollection,
  ensureDashboardIndexes,
  offersCollection,
} from "@/lib/db/dashboard";
import { appendActivity, newObjectId } from "@/lib/dashboard/data";
import {
  apiError,
  authorizeApi,
  json,
  logApiError,
  readJson,
} from "@/lib/dashboard/http";
import { offerResponseSchema } from "@/lib/dashboard/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await authorizeApi(["seeker"]);
  if (access.response) return access.response;

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return apiError("Invalid offer id", 400);
  const parsed = await readJson(request, offerResponseSchema);
  if (parsed.response) return parsed.response;

  try {
    await ensureDashboardIndexes();
    const userId = new ObjectId(access.session.user.id);
    const offerId = new ObjectId(id);
    const offer = await offersCollection.findOne({
      _id: offerId,
      seekerId: userId,
    });
    if (!offer) return apiError("Offer not found", 404);
    if (offer.status !== "pending") {
      return apiError("Only pending offers can be answered", 409);
    }

    const now = new Date();
    if (offer.expiresAt && offer.expiresAt <= now) {
      await offersCollection.updateOne(
        { _id: offerId, seekerId: userId, status: "pending" },
        { $set: { status: "expired" } },
      );
      return apiError("Offer has expired", 409);
    }

    const status = parsed.data.action === "accept" ? "accepted" : "declined";
    const applicationStatus = status === "accepted" ? "hired" : "rejected";
    const result = await offersCollection.updateOne(
      { _id: offerId, seekerId: userId, status: "pending" },
      { $set: { status, respondedAt: now } },
    );
    if (result.modifiedCount !== 1) {
      return apiError("Offer is no longer pending", 409);
    }

    const applicationId = newObjectId(offer.applicationId);
    if (applicationId) {
      await applicationsCollection.updateOne(
        { _id: applicationId, seekerId: userId },
        {
          $set: {
            status: applicationStatus,
            updatedAt: now,
          },
        },
      );
    }
    await appendActivity({
      userId,
      type: status === "accepted" ? "offer_accepted" : "offer_declined",
      title: status === "accepted" ? "Offer accepted" : "Offer declined",
      description: `${status === "accepted" ? "You accepted" : "You declined"} the offer for ${offer.jobTitle}${offer.companyName ? ` at ${offer.companyName}` : ""}.`,
      jobTitle: offer.jobTitle,
      companyName: offer.companyName,
      jobId: newObjectId(offer.jobId),
      applicationId,
      createdAt: now,
    });

    return json({ data: { id, status, respondedAt: now.toISOString() } });
  } catch (error) {
    return logApiError("PATCH /api/offers/:id/respond", error);
  }
}
