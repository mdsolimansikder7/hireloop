import { requireRoleAccess } from "@/lib/require-role";
import { RecruiterDashboard } from "@/components/dashboard/recruiter-dashboard";

export default async function RecruiterPage() {
  const session = await requireRoleAccess("/recruiter");

  return (
    <RecruiterDashboard
      name={session.user.name ?? session.user.email ?? "Recruiter"}
      image={session.user.image ?? null}
    />
  );
}
