"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, Lock, Mail } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { getRole, redirectForRole } from "@/lib/roles";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { Button } from "@/components/ui/button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validateEmailField = () => {
    if (!email) {
      setErrors((p) => ({ ...p, email: "Email is required" }));
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setErrors((p) => ({ ...p, email: "Enter a valid email address" }));
      return;
    }
    setErrors((p) => ({ ...p, email: undefined }));
  };

  const validatePasswordField = () => {
    if (!password) {
      setErrors((p) => ({ ...p, password: "Password is required" }));
      return;
    }
    setErrors((p) => ({ ...p, password: undefined }));
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    const next: { email?: string; password?: string } = {};
    if (!email) next.email = "Email is required";
    else if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address";
    if (!password) next.password = "Password is required";

    setErrors(next);
    if (next.email) {
      document.getElementById("email")?.focus();
      return;
    }
    if (next.password) {
      document.getElementById("password")?.focus();
      return;
    }

    setLoading(true);
    const { data, error } = await authClient.signIn.email({
      email,
      password,
      rememberMe: remember,
      callbackURL: "/",
    });
    setLoading(false);

    if (error) {
      setServerError(error.message || "Invalid email or password");
      return;
    }

    // The role comes from the database and decides the redirect.
    const sessionUser = data?.user;
    if (sessionUser?.onboardingComplete !== true) {
      router.push("/onboarding/role");
      return;
    }
    const sessionRole = getRole(sessionUser);
    router.push(redirectForRole(sessionRole));
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
              WELCOME BACK
            </span>
            <span
              aria-hidden="true"
              className="size-1.5 rounded-[2px] bg-[#5b4ff5]"
            />
          </div>

          <h1 className="mt-4 text-[32px] font-medium leading-[1.15] tracking-tight text-white">
            Sign in to your account
          </h1>

          <p className="mx-auto mt-4 max-w-[340px] text-[14px] text-[#9ca3af]">
            Pick up where you left off. Your matches are waiting.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-8 flex flex-col gap-4"
          noValidate
        >
          <AuthInput
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={email}
            onChange={setEmail}
            error={errors.email}
            autoComplete="email"
            name="email"
            onBlur={validateEmailField}
            style={{ animationDelay: "60ms" }}
          />

          <AuthInput
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            icon={Lock}
            value={password}
            onChange={setPassword}
            error={errors.password}
            autoComplete="current-password"
            name="password"
            onBlur={validatePasswordField}
            style={{ animationDelay: "120ms" }}
          />

          <div className="flex items-center justify-between">
            <label
              htmlFor="remember"
              className="flex cursor-pointer items-center gap-2 text-[13px] text-[#9ca3af]"
            >
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 rounded-[4px] border border-white/15 bg-[#111] accent-[#5b4ff5]"
              />
              Remember me
            </label>

            <Link
              href="/forgot-password"
              className="text-[13px] font-medium text-[#5b4ff5]"
            >
              Forgot password?
            </Link>
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
            Sign In
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <p className="text-[13px] text-[#9ca3af]">or continue with</p>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <SocialButtons onSocial={handleSocial} disabled={loading} />

        <p className="mt-8 text-center text-[13px] text-[#9ca3af]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-white">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
