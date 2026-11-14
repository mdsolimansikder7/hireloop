"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building,
  KeyRound,
  LoaderCircle,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { redirectForRole, type Role } from "@/lib/roles";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { Button } from "@/components/ui/button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name"),
    email: z.string().regex(EMAIL_RE, "Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/\d/, "Password must include a number and a symbol")
      .regex(/[^A-Za-z0-9]/, "Password must include a number and a symbol"),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v, {
      message: "You must accept the terms to continue",
    }),
    role: z.enum(["seeker", "recruiter", "admin"]),
    companyName: z.string().optional(),
    adminInviteCode: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.confirmPassword !== values.password) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
    if (values.role === "recruiter") {
      const companyName = (values.companyName ?? "").trim();
      if (!companyName) {
        ctx.addIssue({
          code: "custom",
          path: ["companyName"],
          message: "Company name is required",
        });
      } else if (companyName.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["companyName"],
          message: "Company name must be at least 2 characters",
        });
      }
    }
    if (values.role === "admin" && !(values.adminInviteCode ?? "").trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["adminInviteCode"],
        message: "Admin invite code is required",
      });
    }
  });

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  role?: string;
  companyName?: string;
  adminInviteCode?: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("seeker");
  const [companyName, setCompanyName] = useState("");
  const [adminInviteCode, setAdminInviteCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validateField = (field: keyof FieldErrors) => {
    const result = signUpSchema.safeParse(formValues());
    if (result.success) {
      setErrors((p) => ({ ...p, [field]: undefined }));
      return;
    }
    const issue = result.error.issues.find(
      (i) => i.path[0] === field || (field === "terms" && i.path.length === 0),
    );
    setErrors((p) => ({ ...p, [field]: issue?.message }));
  };

  const formValues = () => ({
    fullName,
    email,
    password,
    confirmPassword,
    terms,
    role,
    companyName,
    adminInviteCode,
  });

  function handleRoleChange(nextRole: Role) {
    setRole(nextRole);
    // Clear the other role's extra field and its errors.
    if (nextRole !== "recruiter") setCompanyName("");
    if (nextRole !== "admin") setAdminInviteCode("");
    setErrors((p) => ({
      ...p,
      companyName: undefined,
      adminInviteCode: undefined,
    }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    const result = signUpSchema.safeParse(formValues());
    const next: FieldErrors = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = (issue.path[0] ?? "terms") as keyof FieldErrors;
        if (!next[key]) next[key] = issue.message;
      }
    }

    setErrors(next);
    const firstInvalidField = (
      [
        "fullName",
        "email",
        "password",
        "confirmPassword",
        "companyName",
        "adminInviteCode",
      ] as const
    ).find((key) => next[key]);
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      return;
    }
    if (next.terms) return;

    setLoading(true);
    const { error } = await authClient.signUp.email({
      name: fullName,
      email,
      password,
      role,
      companyName: role === "recruiter" ? companyName.trim() : undefined,
      adminInviteCode: role === "admin" ? adminInviteCode : undefined,
      callbackURL: redirectForRole(role),
    });
    setLoading(false);

    if (error) {
      setServerError(
        error.message || "Could not create your account. Please try again.",
      );
      return;
    }

    router.push(redirectForRole(role));
  }

  async function handleSocial(provider: string) {
    setServerError(null);
    setLoading(true);
    const { data, error } = await authClient.signIn.social({
      provider: provider as "google",
      callbackURL: "/dashboard",
      disableRedirect: true,
    });
    setLoading(false);

    if (error) {
      setServerError(error.message || "Social login failed. Please try again.");
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  }

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
              GET STARTED
            </span>
            <span
              aria-hidden="true"
              className="size-1.5 rounded-[2px] bg-[#5b4ff5]"
            />
          </div>

          <h1 className="mt-4 text-[32px] font-medium leading-[1.15] tracking-tight text-white">
            Create your free account
          </h1>

          <p className="mx-auto mt-4 max-w-[340px] text-[14px] text-[#9ca3af]">
            Build a profile in three minutes. The matches start arriving
            tomorrow morning.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-8 flex flex-col gap-4"
          noValidate
        >
          <RoleSelector
            value={role}
            onChange={handleRoleChange}
            error={errors.role}
          />

          {/* Animated expand/collapse container for role-specific fields */}
          <div
            aria-hidden={role === "seeker"}
            className={
              "grid transition-all duration-300 ease-out " +
              (role === "seeker"
                ? "grid-rows-[0fr] opacity-0"
                : "grid-rows-[1fr] opacity-100")
            }
          >
            <div className="overflow-hidden">
              {role === "recruiter" ? (
                <AuthInput
                  id="companyName"
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
                  onBlur={() => validateField("companyName")}
                  disabled={role !== "recruiter" || loading}
                />
              ) : null}

              {role === "admin" ? (
                <div>
                  <AuthInput
                    id="adminInviteCode"
                    label="Admin invite code"
                    type="password"
                    placeholder="Enter your invite code"
                    icon={KeyRound}
                    value={adminInviteCode}
                    onChange={(v) => {
                      setAdminInviteCode(v);
                      setErrors((p) => ({ ...p, adminInviteCode: undefined }));
                    }}
                    error={errors.adminInviteCode}
                    autoComplete="off"
                    name="adminInviteCode"
                    onBlur={() => validateField("adminInviteCode")}
                    disabled={role !== "admin" || loading}
                  />
                  <p className="mt-1.5 text-[11px] text-[#9ca3af]">
                    Admin accounts need an invite code from the platform owner.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <AuthInput
            id="fullName"
            label="Full name"
            type="text"
            placeholder="Jane Doe"
            icon={User}
            value={fullName}
            onChange={setFullName}
            error={errors.fullName}
            autoComplete="name"
            name="fullName"
            onBlur={() => validateField("fullName")}
            style={{ animationDelay: "60ms" }}
          />

          <AuthInput
            id="email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={email}
            onChange={setEmail}
            error={errors.email}
            autoComplete="email"
            name="email"
            onBlur={() => validateField("email")}
            style={{ animationDelay: "120ms" }}
          />

          <AuthInput
            id="password"
            label="Password"
            type="password"
            placeholder="Create a password"
            icon={Lock}
            value={password}
            onChange={setPassword}
            error={errors.password}
            autoComplete="new-password"
            name="password"
            onBlur={() => validateField("password")}
            style={{ animationDelay: "180ms" }}
          />
          <PasswordStrength password={password} />

          <AuthInput
            id="confirmPassword"
            label="Confirm password"
            type="password"
            placeholder="Confirm your password"
            icon={Lock}
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={errors.confirmPassword}
            autoComplete="new-password"
            name="confirmPassword"
            onBlur={() => validateField("confirmPassword")}
            style={{ animationDelay: "240ms" }}
          />

          <div>
            <label
              htmlFor="terms"
              className="flex cursor-pointer items-start gap-2 text-[13px] text-[#9ca3af]"
            >
              <input
                id="terms"
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                onBlur={() => validateField("terms")}
                className="mt-0.5 size-4 rounded-[4px] border border-white/15 bg-[#111] accent-[#5b4ff5]"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="font-medium text-[#5b4ff5]">
                  Terms &amp; Policy
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-[#5b4ff5]">
                  Privacy Guideline
                </Link>
              </span>
            </label>
            {errors.terms ? (
              <p className="mt-1.5 text-[12px] text-[#f87171]">
                {errors.terms}
              </p>
            ) : null}
          </div>

          {serverError ? (
            <p className="text-[13px] text-[#f87171]" role="alert">
              {serverError}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="h-[44px] w-full rounded-[10px] bg-[#5b4ff5] text-[13px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(91,79,245,0.9)] hover:bg-[#6c5fff] hover:-translate-y-0.5"
          >
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Create Account
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <p className="text-[13px] text-[#9ca3af]">or sign up with</p>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <SocialButtons onSocial={handleSocial} disabled={loading} />

        <p className="mt-3 text-center text-[12px] text-[#6b7280]">
          Google and LinkedIn sign up creates a Job Seeker account. You can
          choose Recruiter after signing in.
        </p>

        <p className="mt-8 text-center text-[13px] text-[#9ca3af]">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-white">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
