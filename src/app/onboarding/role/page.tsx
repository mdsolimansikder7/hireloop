import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getRole, redirectForRole } from "@/lib/roles";
import { OnboardingRoleForm } from "./onboarding-role-form";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Choose your role — hireloop",
};

export default async function OnboardingRolePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/signin");

  const role = getRole(session.user);

  // Role selection is a one-time step for social sign-up users.
  if (session.user.onboardingComplete === true) {
    redirect(redirectForRole(role));
  }
  // Admin is never selectable through social login or onboarding.
  if (role === "admin") redirect("/admin");

  return (
    <AuthLayout>
      <div>
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-[2px] bg-[#5b4ff5]"
            />
            <span className="font-mono text-[12px] font-medium tracking-[0.28em] text-[#9ca3af] uppercase">
              ONE LAST STEP
            </span>
            <span
              aria-hidden="true"
              className="size-1.5 rounded-[2px] bg-[#5b4ff5]"
            />
          </div>

          <h1 className="mt-4 text-[32px] font-medium leading-[1.15] tracking-tight text-white">
            How will you use hireloop?
          </h1>

          <p className="mx-auto mt-4 max-w-[340px] text-[14px] text-[#9ca3af]">
            Hi {session.user.name} — pick the account type that fits you best.
          </p>
        </div>

        <OnboardingRoleForm />
      </div>
    </AuthLayout>
  );
}
