export type Role = "seeker" | "recruiter" | "admin";

export type SignUpRole = "seeker" | "recruiter";

export const ROLES: Role[] = ["seeker", "recruiter", "admin"];

export const SIGNUP_ROLES: SignUpRole[] = ["seeker", "recruiter"];

export const ROLE_LABELS: Record<Role, string> = {
  seeker: "Job Seeker",
  recruiter: "Recruiter",
  admin: "Admin",
};

export function isRole(value: unknown): value is Role {
  return value === "seeker" || value === "recruiter" || value === "admin";
}

/**
 * Safe role lookup for possibly-legacy user documents.
 * Falls back to the default role ("seeker") when `role` is missing or invalid,
 * so old social-login users never crash the app.
 */
export function getRole(user: unknown): Role {
  const role = (user as { role?: unknown } | null | undefined)?.role;
  return isRole(role) ? role : "seeker";
}

/**
 * Where a role should land right after sign up / sign in.
 */
export function redirectForRole(role: Role | null | undefined): string {
  if (role === "recruiter") return "/recruiter";
  if (role === "admin") return "/admin";
  return "/dashboard";
}

/**
 * Which auth area a role may open. Admin can access everything;
 * seeker owns /dashboard, recruiter owns /recruiter.
 */
export function canAccess(
  role: Role | null | undefined,
  path: string,
): boolean {
  if (role === "admin") return true;

  if (path === "/admin" || path.startsWith("/admin/")) return false;
  if (path === "/recruiter" || path.startsWith("/recruiter/")) {
    return role === "recruiter";
  }
  if (path === "/dashboard" || path.startsWith("/dashboard/")) {
    return role === "seeker";
  }
  return true;
}
