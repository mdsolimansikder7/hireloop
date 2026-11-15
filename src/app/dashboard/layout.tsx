import { redirect } from "next/navigation";

import { SeekerShell } from "@/components/dashboard/SeekerShell";
import { requireRoleAccess } from "@/lib/require-role";
import { getRole, redirectForRole } from "@/lib/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRoleAccess("/dashboard");
  const role = getRole(session.user);

  if (role !== "seeker") redirect(redirectForRole(role));

  return (
    <SeekerShell
      name={session.user.name ?? session.user.email ?? "Job seeker"}
      image={session.user.image ?? null}
    >
      {children}
    </SeekerShell>
  );
}