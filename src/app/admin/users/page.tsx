import { AdminUsersPage } from "@/components/dashboard/admin-users-page";
import { requireRoleAccess } from "@/lib/require-role";

export default async function AdminUsersRoute() {
  const session = await requireRoleAccess("/admin");

  return (
    <AdminUsersPage
      adminId={session.user.id}
      name={session.user.name ?? session.user.email ?? "Admin"}
      image={session.user.image ?? null}
    />
  );
}
