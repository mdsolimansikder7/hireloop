import { requireRoleAccess } from "@/lib/require-role";

import { SessionsView } from "./sessions-view";

export const metadata = {
  title: "Active Sessions — HireLoop",
};

export default async function SessionsPage() {
  await requireRoleAccess("/settings/sessions");

  return <SessionsView />;
}
