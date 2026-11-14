import { ObjectId } from "mongodb";
import { z } from "zod";

import { db } from "@/lib/mongodb";
import {
  apiError,
  authorizeApi,
  json,
  logApiError,
  readJson,
} from "@/lib/dashboard/http";

const profileSchema = z.object({
  headline: z.string().trim().max(120),
  bio: z.string().trim().max(1000),
  skills: z.array(z.string().trim().min(1).max(40)).max(20),
});

const profiles = db.collection<{
  _id: ObjectId;
  headline?: string;
  bio?: string;
  skills?: string[];
}>("seekerProfiles");

export async function GET() {
  const access = await authorizeApi(["seeker"]);
  if (access.response) return access.response;

  try {
    const profile = await profiles.findOne(
      { _id: new ObjectId(access.session.user.id) },
      { projection: { headline: 1, bio: 1, skills: 1 } },
    );
    return json({
      data: {
        headline: profile?.headline ?? "",
        bio: profile?.bio ?? "",
        skills: profile?.skills ?? [],
      },
    });
  } catch (error) {
    return logApiError("GET /api/profile/mine", error);
  }
}

export async function PATCH(request: Request) {
  const access = await authorizeApi(["seeker"]);
  if (access.response) return access.response;

  const parsed = await readJson(request, profileSchema);
  if (parsed.response) return parsed.response;

  const skills = [...new Set(parsed.data.skills.map((skill) => skill.trim()).filter(Boolean))];
  if (skills.length > 20) {
    return apiError("You can add up to 20 skills.", 400);
  }

  try {
    await profiles.updateOne(
      { _id: new ObjectId(access.session.user.id) },
      {
        $set: {
          headline: parsed.data.headline,
          bio: parsed.data.bio,
          skills,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return json({
      data: { headline: parsed.data.headline, bio: parsed.data.bio, skills },
    });
  } catch (error) {
    return logApiError("PATCH /api/profile/mine", error);
  }
}
