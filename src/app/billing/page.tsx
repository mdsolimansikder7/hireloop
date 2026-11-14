import { redirect } from "next/navigation";

import { BillingPage } from "@/components/dashboard/billing-page";
import { requireRoleAccess } from "@/lib/require-role";
import { getRole, redirectForRole } from "@/lib/roles";

export default async function BillingRoute() {
  const session = await requireRoleAccess("/dashboard");
  const role = getRole(session.user);

  if (role !== "seeker") redirect(redirectForRole(role));

  return (
    <BillingPage
      name={session.user.name ?? session.user.email ?? "Job seeker"}
      image={session.user.image ?? null}
    />
  );
}
