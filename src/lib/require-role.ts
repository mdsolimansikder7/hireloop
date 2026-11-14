import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { canAccess, getRole, redirectForRole } from "@/lib/roles";

type AuthSession = typeof auth.$Infer.Session;

/**
 * Server-side role gate for protected pages. Middleware alone is only a
 * convenience - this is the real check, run on the server with the DB session.
 *
 * - No session -> /signin
 * - Not onboarded (social sign-up) -> /onboarding/role
 * - Route does not match the user's role -> their own home
 */
export async function requireRoleAccess(path: string): Promise<AuthSession> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/signin");

  if ((session.user as { suspended?: boolean }).suspended === true) {
    redirect("/account-suspended");
  }

  const role = getRole(session.user);

  if (session.user.onboardingComplete !== true) {
    redirect("/onboarding/role");
  }

  if (!canAccess(role, path)) {
    redirect(redirectForRole(role));
  }

  return session;
}
