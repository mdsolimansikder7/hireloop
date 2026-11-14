import { redirect } from "next/navigation";

import { RecruiterApplicationsPage } from "@/components/dashboard/recruiter-applications-page";
import { getRole, redirectForRole } from "@/lib/roles";
import { requireRoleAccess } from "@/lib/require-role";

export const metadata = {
  title: "Applications — HireLoop",
};

export default async function RecruiterApplicationsRoute() {
  const session = await requireRoleAccess("/recruiter/applications");
  const role = getRole(session.user);

  if (role !== "recruiter") redirect(redirectForRole(role));

  return (
    <RecruiterApplicationsPage
      name={session.user.name ?? session.user.email ?? "Recruiter"}
      image={session.user.image ?? null}
    />
  );
}
