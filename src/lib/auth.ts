import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError } from "better-auth/api";
import { jwt } from "better-auth/plugins";

import { db, client } from "@/lib/mongodb";
import { getRole, type Role } from "@/lib/roles";

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

  plugins: [jwt()],

  session: {
    // Sessions live for 7 days; the sliding window refreshes once a day.
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    // Note: cookie caching is intentionally NOT enabled — the role /
    // onboardingComplete snapshot would go stale after the one-shot
    // /onboarding/role server action (which writes MongoDB directly) and
    // bounce users back to onboarding.
  },
  // Throttle sign-up attempts.
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
          // /onboarding/role afterwards.
          const isSocial =
            typeof ctx?.path === "string" && ctx.path.includes("/callback");

          const data = { ...user };

          if (isSocial) {
            data.role = "seeker";
            data.onboardingComplete = false;
            data.companyName = undefined;
            return { data };
          }

          // Never trust the role sent from the browser: signup may only create
          // "seeker" or "recruiter" accounts; anything else falls back to "seeker".
          const requestedRole: Role =
            data.role === "recruiter" ? "recruiter" : "seeker";

          if (requestedRole === "recruiter") {
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