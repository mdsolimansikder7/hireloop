"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, X, Zap } from "lucide-react";

import { applyToJob, JobsApiError } from "@/lib/api/jobs";
import { useSession } from "@/lib/auth-client";
import { getRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";
import { FREE_PLAN_APPLICATION_LIMIT } from "@/lib/plans";

interface ApplyButtonProps {
  jobId: string;
  initialHasApplied?: boolean;
  isOwner?: boolean;
  status?: string | null;
  className?: string;
  onApply?: (jobId: string) => void | Promise<void>;
}

export function ApplyButton({
  jobId,
  initialHasApplied = false,
  isOwner = false,
  status = "open",
  className,
  onApply,
}: ApplyButtonProps) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const { showToast } = useToast();

  const [appliedJobId, setAppliedJobId] = React.useState<string | null>(null);
  const [isApplying, setIsApplying] = React.useState(false);
  const [limitReached, setLimitReached] = React.useState(false);

  const hasApplied = initialHasApplied || appliedJobId === jobId;
  const userRole = session ? getRole(session.user) : null;
  const isRecruiterOrAdmin = userRole === "recruiter" || userRole === "admin";
  const isClosed = status && status !== "open";

  const handleApply = async () => {
    if (isSessionPending || isApplying || hasApplied) return;

    if (!session) {
      router.push(`/signin?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`);
      return;
    }

    if (isRecruiterOrAdmin) return;

    if (onApply) {
      await onApply(jobId);
      return;
    }

    setIsApplying(true);
    try {
      const res = await applyToJob(jobId);
          if (res.alreadyApplied) {
            setAppliedJobId(jobId);
            showToast("Already applied for this job", "info");
          } else {
            setAppliedJobId(jobId);
            showToast("Application submitted", "success");
          }
    } catch (err: unknown) {
      const isLimitReached =
        err instanceof JobsApiError &&
        (err.status === 402 || /free plan/i.test(err.message));
      if (isLimitReached) {
        setLimitReached(true);
        return;
      }
      const msg = err instanceof Error ? err.message : "Failed to apply";
      showToast(msg, "error");
    } finally {
      setIsApplying(false);
    }
  };

  // Recruiter who owns this job: link to recruiter dashboard
  if (isOwner) {
    return (
      <Link
        href="/recruiter"
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-[10px] bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-[#e5e5e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4ff5]",
          className,
        )}
      >
        Manage job
      </Link>
    );
  }

  // Job is closed
  if (isClosed) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex h-10 cursor-not-allowed items-center justify-center rounded-[10px] border border-white/[0.08] bg-[#1a1a1a] px-5 text-sm font-semibold text-[#6b7280]",
          className,
        )}
      >
        Job closed
      </button>
    );
  }

  // Recruiter or Admin (non-owner): cannot apply
  if (session && isRecruiterOrAdmin) {
    return (
      <button
        type="button"
        disabled
        title="Only job seekers can apply"
        className={cn(
          "inline-flex h-10 cursor-not-allowed items-center justify-center rounded-[10px] border border-white/[0.08] bg-[#1a1a1a] px-5 text-sm font-semibold text-[#6b7280]",
          className,
        )}
      >
        Only job seekers can apply
      </button>
    );
  }

  // Already applied state
  if (hasApplied) {
    return (
      <>
        <button
          type="button"
          disabled
          aria-label="Application submitted"
          className={cn(
            "inline-flex h-10 cursor-default items-center justify-center gap-2 rounded-[10px] border border-[#34d399]/20 bg-[#34d399]/10 px-5 text-sm font-semibold text-[#34d399]",
            className,
          )}
        >
          <Check className="size-4 text-[#34d399]" aria-hidden="true" />
          <span>Applied</span>
        </button>

      </>
    );
  }

  // Active Apply Now button
  return (
    <>
      {limitReached ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Free plan application limit reached"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl sm:p-8">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex size-11 items-center justify-center rounded-full bg-[#5b4ff5]/15">
                <Zap className="size-5 text-[#8b7bff]" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => setLimitReached(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <h2 className="mb-2 text-lg font-bold text-white">
              Application limit reached
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-[#9ca3af]">
              You have used all{" "}
              <span className="font-semibold text-white">
                {FREE_PLAN_APPLICATION_LIMIT}
              </span>{" "}
              applications of the Free plan. Upgrade to a premium plan to apply
              for unlimited jobs.
            </p>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex h-10 flex-1 items-center justify-center rounded-[10px] bg-[#5b4ff5] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#4a3fe0]"
              >
                Upgrade plan
              </Link>
              <button
                type="button"
                onClick={() => setLimitReached(false)}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-[10px] border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={isApplying || isSessionPending}
        onClick={handleApply}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-[#e5e5e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4ff5] disabled:cursor-not-allowed disabled:opacity-70",
          className,
        )}
      >
        {isApplying ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>Applying...</span>
          </>
        ) : (
          <span>Apply Now</span>
        )}
      </button>

    </>
  );
}
