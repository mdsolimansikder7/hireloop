import { AdminPaymentsPage } from "@/components/dashboard/admin-payments-page";
import { requireRoleAccess } from "@/lib/require-role";

export default async function AdminPaymentsRoute() {
  const session = await requireRoleAccess("/admin");

  return (
    <AdminPaymentsPage
      name={session.user.name ?? session.user.email ?? "Admin"}
      image={session.user.image ?? null}
    />
  );
}
