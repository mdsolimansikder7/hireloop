import { requireRoleAccess } from "@/lib/require-role";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default async function AdminPage() {
  const session = await requireRoleAccess("/admin");

  return (
    <AdminDashboard
      name={session.user.name ?? session.user.email ?? "Admin"}
      image={session.user.image ?? null}
    />
  );
}
