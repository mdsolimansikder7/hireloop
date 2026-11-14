"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building, LoaderCircle } from "lucide-react";
import { z } from "zod";

import { setOnboardingRole } from "./actions";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { AuthInput } from "@/components/auth/AuthInput";
import type { Role } from "@/lib/roles";
import { Button } from "@/components/ui/button";

type OnboardingRole = "seeker" | "recruiter";

const companyNameSchema = z
  .string()
  .trim()
  .min(2, "Company name must be at least 2 characters");

export function OnboardingRoleForm() {
  const router = useRouter();
  const [role, setRole] = useState<OnboardingRole>("seeker");
  const [companyName, setCompanyName] = useState("");
  const [errors, setErrors] = useState<{
    role?: string;
    companyName?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const validateCompanyNameField = () => {
    const result = companyNameSchema.safeParse(companyName.trim());
    setErrors((p) => ({
      ...p,
      companyName: result.success ? undefined : result.error.issues[0].message,
    }));
  };

  function handleRoleChange(next: Role) {
    // Admin is never selectable through social onboarding.
    if (next === "admin") {
      return;
    }
    setRole(next);
    // Clear the other role's extra field and its errors.
    if (next !== "recruiter") {
      setCompanyName("");
    }
    setErrors((p) => ({ ...p, companyName: undefined }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    const next: { role?: string; companyName?: string } = {};
    if (role === "recruiter") {
      const result = companyNameSchema.safeParse(companyName.trim());
      if (!result.success) next.companyName = result.error.issues[0].message;
    }
    setErrors(next);
    if (next.companyName) {
      document.getElementById("onboarding-company-name")?.focus();
      return;
    }

    startTransition(async () => {
      const result = await setOnboardingRole(role, companyName);
      if (!result.ok) {
        setServerError(result.error ?? "Could not save your role");
        if (result.redirect) router.push(result.redirect);
        return;
      }
      router.push(result.redirect ?? "/dashboard");
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
      <RoleSelector
        value={role}
        onChange={handleRoleChange}
        error={errors.role}
        roles={["seeker", "recruiter"]}
      />

      {/* Animated expand/collapse container */}
      <div
        aria-hidden={role !== "recruiter"}
        className={
          "grid transition-all duration-300 ease-out " +
          (role === "recruiter"
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0")
        }
      >
        <div className="overflow-hidden">
          <AuthInput
            id="onboarding-company-name"
            label="Company name"
            type="text"
            placeholder="Your company name"
            icon={Building}
            value={companyName}
            onChange={(v) => {
              setCompanyName(v);
              setErrors((p) => ({ ...p, companyName: undefined }));
            }}
            error={errors.companyName}
            autoComplete="organization"
            name="companyName"
            onBlur={validateCompanyNameField}
            disabled={role !== "recruiter" || pending}
          />
        </div>
      </div>

      {serverError ? (
        <p className="text-[13px] text-[#f87171]" role="alert">
          {serverError}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="h-[44px] w-full rounded-[10px] bg-[#5b4ff5] text-[13px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(91,79,245,0.9)] hover:bg-[#6c5fff] hover:-translate-y-0.5"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Continue
      </Button>
    </form>
  );
}
