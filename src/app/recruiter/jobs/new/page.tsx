import { redirect } from "next/navigation";

import { RecruiterAddJobPage } from "@/components/dashboard/recruiter-add-job-page";
import { requireRoleAccess } from "@/lib/require-role";
import { getRole, redirectForRole } from "@/lib/roles";

export const metadata = {
  title: "Add Job — HireLoop",
};

export default async function RecruiterNewJobRoute({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await requireRoleAccess("/recruiter/jobs/new");
  const role = getRole(session.user);
  const params = await searchParams;

  if (role !== "recruiter") redirect(redirectForRole(role));

  return (
    <RecruiterAddJobPage
      name={session.user.name ?? session.user.email ?? "Recruiter"}
      image={session.user.image ?? null}
      companyName={session.user.companyName ?? ""}
      editId={params.edit ?? null}
    />
  );
}
