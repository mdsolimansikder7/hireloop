import { redirect } from "next/navigation";

import { SettingsPage } from "@/components/dashboard/settings-page";
import { AccountProfilePage } from "@/components/dashboard/account-profile-page";
import { requireRoleAccess } from "@/lib/require-role";
import { getRole, redirectForRole } from "@/lib/roles";

export const metadata = {
  title: "Settings — HireLoop",
};

export default async function SettingsRoute() {
  const session = await requireRoleAccess("/settings");
  const role = getRole(session.user);

  if (role === "admin" || role === "recruiter") {
    return (
      <AccountProfilePage
        role={role}
        name={session.user.name ?? ""}
        email={session.user.email}
        image={session.user.image ?? null}
      />
    );
  }

  if (role !== "seeker") redirect(redirectForRole(role));

  return (
    <SettingsPage
      name={session.user.name ?? ""}
      email={session.user.email}
      image={session.user.image ?? null}
    />
  );
}
