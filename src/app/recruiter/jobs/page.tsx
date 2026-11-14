import { redirect } from "next/navigation";

import { RecruiterManageJobsPage } from "@/components/dashboard/recruiter-manage-jobs-page";
import { requireRoleAccess } from "@/lib/require-role";
import { getRole, redirectForRole } from "@/lib/roles";

export const metadata = {
  title: "Manage Job Posts — HireLoop",
};

export default async function RecruiterJobsRoute() {
  const session = await requireRoleAccess("/recruiter/jobs");
  const role = getRole(session.user);

  if (role !== "recruiter") redirect(redirectForRole(role));

  return (
    <RecruiterManageJobsPage
      name={session.user.name ?? session.user.email ?? "Recruiter"}
      image={session.user.image ?? null}
    />
  );
}
