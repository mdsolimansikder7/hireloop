"use server";

import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/mongodb";
import { redirectForRole, getRole } from "@/lib/roles";

const schema = z.object({
  role: z.enum(["seeker", "recruiter"]),
  companyName: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(120),
});

export type SetOnboardingRoleResult = {
  ok: boolean;
  error?: string;
  redirect?: string;
};

/**
 * One-time role selection for social sign-up users. Updates only the
 * caller's own document, only while `onboardingComplete` is not yet set,
 * and can never grant the "admin" role.
 */
export async function setOnboardingRole(
  role: string,
  companyNameRaw: string,
): Promise<SetOnboardingRoleResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false, error: "You need to sign in first" };
  }

  const parsed = schema.safeParse({ role, companyName: companyNameRaw.trim() });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    if (first?.path?.[0] === "companyName") {
      return { ok: false, error: first.message };
    }
    return { ok: false, error: "Choose a role to continue" };
  }

  let userId: ObjectId;
  try {
    userId = new ObjectId(session.user.id);
  } catch {
    return { ok: false, error: "Could not verify your account" };
  }

  const buildUpdate =
    parsed.data.role === "recruiter"
      ? {
          $set: {
            role: "recruiter",
            companyName: parsed.data.companyName,
            onboardingComplete: true,
          },
        }
      : {
          $set: { role: "seeker", onboardingComplete: true },
          $unset: { companyName: "" },
        };

  // The `onboardingComplete: { $ne: true }` filter makes the role change
  // one-shot: it only succeeds while the flag is not yet set.
  const result = await db
    .collection("user")
    .updateOne({ _id: userId, onboardingComplete: { $ne: true } }, buildUpdate);

  if (result.modifiedCount === 1) {
    return { ok: true, redirect: redirectForRole(parsed.data.role) };
  }

  const user = await db
    .collection("user")
    .findOne(
      { _id: userId },
      { projection: { role: 1, onboardingComplete: 1 } },
    );
  if (user?.onboardingComplete) {
    return {
      ok: false,
      error: "Your role is already set",
      redirect: redirectForRole(getRole(user as { role?: unknown } | null)),
    };
  }

  return { ok: false, error: "Could not save your role. Please try again." };
}
