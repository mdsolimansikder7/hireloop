import { AdminJobsPage } from "@/components/dashboard/admin-jobs-page";
import { requireRoleAccess } from "@/lib/require-role";

export default async function AdminJobsRoute() {
  const session = await requireRoleAccess("/admin");

  return (
    <AdminJobsPage
      name={session.user.name ?? session.user.email ?? "Admin"}
      image={session.user.image ?? null}
    />
  );
}
