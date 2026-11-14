import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError } from "better-auth/api";
import { createHash, timingSafeEqual } from "crypto";

import { db, client } from "@/lib/mongodb";
import { getRole, type Role } from "@/lib/roles";

// Server-only secret. Never expose it to the client (no NEXT_PUBLIC_ prefix)
// and never log it.
const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE;

/**
 * Constant-time comparison: hash both sides so lengths always match,
 * then use timingSafeEqual.
 */
function verifyAdminInviteCode(provided: unknown): boolean {
  if (!ADMIN_INVITE_CODE) return false;
  if (typeof provided !== "string" || provided.length === 0) return false;
  const expected = createHash("sha256").update(ADMIN_INVITE_CODE).digest();
  const received = createHash("sha256").update(provided).digest();
  return timingSafeEqual(expected, received);
}

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),

  // Production URL (set in Vercel env). Falls back to localhost in dev.
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  // Social login providers. Without this block, POST /api/auth/sign-in/social
  // returns 404 "Provider not found".
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    linkedin: {
      // NOTE: env name spelling is LINKDIN (matches .env.example)
      clientId: process.env.LINKDIN_CLIENT_ID as string,
      clientSecret: process.env.LINKDIN_CLIENT_SECRET as string,
    },
  },

  session: {
    // Sessions live for 7 days; the sliding window refreshes once a day.
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    // Note: cookie caching is intentionally NOT enabled — the role /
    // onboardingComplete snapshot would go stale after the one-shot
    // /onboarding/role server action (which writes MongoDB directly) and
    // bounce users back to onboarding.
  },
  // Throttle sign-up attempts so the admin invite code cannot be brute-forced.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      // 5 sign-up attempts per IP per 5 minutes.
      "/sign-up/email": { window: 300, max: 5 },
      // Session polling (navbar / client hydration) must never be throttled.
      "/get-session": false,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "seeker",
        input: true,
      },
      companyName: {
        type: "string",
        required: false,
        input: true,
      },
      // Server-managed flag; clients can never set it directly (input: false).
      onboardingComplete: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      suspended: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      // Transport-only field: client-sent invite code that is verified in the
      // create hook and never persisted (also hidden from API responses).
      adminInviteCode: {
        type: "string",
        required: false,
        input: true,
        returned: false,
      },
    },
    // Server-side provisioning gate. `source.method` distinguishes
    // "email-password" from "oauth", so social users are enforced here too.
    validateUserInfo: ({ user, source }) => {
      if (source.action !== "create-user") return;
      if (
        source.method === "oauth" &&
        user.role !== undefined &&
        user.role !== "seeker"
      ) {
        return {
          error: "invalid_role_for_social",
          errorDescription:
            "Social sign-up always creates a Job Seeker account.",
        };
      }
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          // Social sign-up (Google / LinkedIn) provisions users inside a
          // "/callback/*" endpoint. Those accounts always start as Job Seeker
          // with onboarding incomplete - role selection happens on
          // /onboarding/role afterwards, and admin can never be reached
          // through social login.
          const isSocial =
            typeof ctx?.path === "string" && ctx.path.includes("/callback");

          const data = { ...user };

          if (isSocial) {
            data.role = "seeker";
            data.onboardingComplete = false;
            data.companyName = undefined;
            data.adminInviteCode = undefined;
            return { data };
          }

          // Never trust the role sent from the browser: only these three
          // values are meaningful, anything else falls back to "seeker".
          const requestedRole: Role =
            data.role === "recruiter" || data.role === "admin"
              ? (data.role as Role)
              : "seeker";

          data.adminInviteCode = undefined; // never stored in the database

          if (requestedRole === "admin") {
            const inviteCode = user.adminInviteCode;
            if (!verifyAdminInviteCode(inviteCode)) {
              throw new APIError("UNPROCESSABLE_ENTITY", {
                message: "Invalid admin invite code",
              });
            }
            data.companyName = undefined;
          } else if (requestedRole === "recruiter") {
            const companyName =
              typeof data.companyName === "string"
                ? data.companyName.trim()
                : "";
            if (companyName.length < 2) {
              throw new APIError("UNPROCESSABLE_ENTITY", {
                message: "Company name is required for recruiter accounts",
              });
            }
            data.companyName = companyName;
          } else {
            data.companyName = undefined;
          }

          data.role = requestedRole;
          // Email sign-up users picked their role on the sign-up card.
          data.onboardingComplete = true;

          return { data };
        },
      },
      update: {
        before: async (data, ctx) => {
          // Role is immutable from the client after sign up. Whatever an
          // update endpoint sends for role/onboardingComplete gets forced
          // back to what the server has on file.
          const session = ctx?.context?.session;
          if (!session || !session.user?.id) return;

          const fallbackRole = getRole(session.user);
          const overrides: Record<string, unknown> = {};

          if (data.role !== undefined && data.role !== fallbackRole) {
            overrides.role = fallbackRole;
          }
          if (data.adminInviteCode !== undefined) {
            overrides.adminInviteCode = undefined;
          }
          if (data.onboardingComplete !== undefined) {
            overrides.onboardingComplete = Boolean(
              session.user.onboardingComplete,
            );
          }
          if (data.companyName !== undefined && fallbackRole !== "recruiter") {
            overrides.companyName = undefined;
          }

          if (Object.keys(overrides).length === 0) return;
          return { data: { ...data, ...overrides } };
        },
      },
    },
  },
});