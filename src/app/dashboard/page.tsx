import { redirect } from "next/navigation";

import { SeekerDashboard } from "@/components/dashboard/seeker-dashboard";
import { requireRoleAccess } from "@/lib/require-role";
import { getRole, redirectForRole } from "@/lib/roles";

export default async function DashboardPage() {
  const session = await requireRoleAccess("/dashboard");
  const role = getRole(session.user);

  if (role !== "seeker") redirect(redirectForRole(role));

  return (
    <SeekerDashboard
      name={session.user.name ?? session.user.email ?? "Job seeker"}
      image={session.user.image ?? null}
    />
  );
}
