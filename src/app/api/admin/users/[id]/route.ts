import { ObjectId } from "mongodb";
import { z } from "zod";

import {
  apiError,
  authorizeApi,
  json,
  logApiError,
  readJson,
} from "@/lib/dashboard/http";
import { db } from "@/lib/mongodb";

const updateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("role"),
    role: z.enum(["seeker", "recruiter"]),
    companyName: z.string().trim().min(2).max(120).optional(),
  }),
  z.object({ action: z.literal("suspend") }),
  z.object({ action: z.literal("activate") }),
]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await authorizeApi(["admin"]);
  if (access.response) return access.response;

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return apiError("Invalid user identifier", 400);

  const parsed = await readJson(request, updateSchema);
  if (parsed.response) return parsed.response;

  if (id === access.session.user.id) {
    return apiError("You cannot change your own account from this page", 403);
  }

  try {
    const users = db.collection("user");
    const targetId = new ObjectId(id);
    const target = await users.findOne({ _id: targetId });
    if (!target) return apiError("User not found", 404);
    if (target.role === "admin") {
      return apiError("Admin accounts cannot be changed here", 403);
    }

    if (parsed.data.action === "role") {
      if (
        parsed.data.role === "recruiter" &&
        (!parsed.data.companyName || parsed.data.companyName.trim().length < 2)
      ) {
        return apiError("A company name is required when promoting a recruiter", 400);
      }
      const update = {
        role: parsed.data.role,
        updatedAt: new Date(),
        ...(parsed.data.role === "recruiter"
          ? { companyName: parsed.data.companyName }
          : {}),
      };
      await users.updateOne(
        { _id: targetId },
        { $set: update },
      );
    } else if (parsed.data.action === "suspend") {
      await Promise.all([
        users.updateOne(
          { _id: targetId },
          { $set: { suspended: true, updatedAt: new Date() } },
        ),
        db.collection("session").deleteMany({ userId: id }),
        db.collection("session").deleteMany({ userId: targetId }),
      ]);
    } else {
      await users.updateOne(
        { _id: targetId },
        { $set: { suspended: false, updatedAt: new Date() } },
      );
    }

    return json({ data: { success: true } });
  } catch (error) {
    return logApiError("PATCH /api/admin/users/[id]", error);
  }
}
