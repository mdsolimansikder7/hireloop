import { redirect } from "next/navigation";

import { ApplicationsPage } from "@/components/dashboard/applications-page";
import { requireRoleAccess } from "@/lib/require-role";
import { getRole, redirectForRole } from "@/lib/roles";

export default async function ApplicationsRoute() {
  const session = await requireRoleAccess("/dashboard");
  const role = getRole(session.user);

  if (role !== "seeker") redirect(redirectForRole(role));

  return (
    <ApplicationsPage
      name={session.user.name ?? session.user.email ?? "Job seeker"}
      image={session.user.image ?? null}
    />
  );
}
