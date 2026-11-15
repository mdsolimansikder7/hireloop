import { redirect } from "next/navigation";

import { SavedJobsPage } from "@/components/dashboard/saved-jobs-page";
import { requireRoleAccess } from "@/lib/require-role";
import { getRole, redirectForRole } from "@/lib/roles";

export default async function SavedJobsRoute() {
  const session = await requireRoleAccess("/dashboard");
  const role = getRole(session.user);

  if (role !== "seeker") redirect(redirectForRole(role));

  return (
    <SavedJobsPage
      name={session.user.name ?? session.user.email ?? "Job seeker"}
      image={session.user.image ?? null}
    />
  );
}
