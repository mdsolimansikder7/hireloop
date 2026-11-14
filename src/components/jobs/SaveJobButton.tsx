"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";

import { toggleSavedJob } from "@/lib/api/jobs";
import { useSession } from "@/lib/auth-client";
import { getRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";

interface SaveJobButtonProps {
  jobId: string;
  saved: boolean;
  onToggle?: (jobId: string, saved: boolean) => void | Promise<void>;
  className?: string;
  iconClassName?: string;
  redirectPath?: string;
}

export function SaveJobButton({
  jobId,
  saved: initialSaved,
  onToggle,
  className,
  iconClassName,
  redirectPath = "/jobs",
}: SaveJobButtonProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { showToast } = useToast();
  const [savedOverride, setSavedOverride] = React.useState<{
    jobId: string;
    value: boolean;
  } | null>(null);

  const saved =
    onToggle || savedOverride?.jobId !== jobId
      ? initialSaved
      : savedOverride.value;

  const isRecruiter =
    !!session && getRole(session.user) === "recruiter";

  const handleClick = async (event: React.MouseEvent) => {
    // Never let the click bubble up / activate the job link underneath.
    event.preventDefault();
    event.stopPropagation();

    if (isPending) return;

    // Signed-out users go through sign-in and come back.
    if (!session) {
      router.push(`/signin?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    // Recruiters cannot bookmark jobs.
    if (isRecruiter) return;

    if (onToggle) {
      void onToggle(jobId, !saved);
    } else {
      const nextSaved = !saved;
      setSavedOverride({ jobId, value: nextSaved });
      try {
        await toggleSavedJob(jobId, nextSaved);
        showToast(nextSaved ? "Job saved" : "Job removed from saved jobs", "success");
      } catch (err) {
        setSavedOverride({ jobId, value: !nextSaved });
        showToast(
          err instanceof Error ? err.message : "Could not update saved jobs.",
          "error",
        );
      }
    }
  };

  const disabled = isPending || isRecruiter;

  return (
    <button
      type="button"
      disabled={disabled}
      title={isRecruiter ? "Recruiters cannot save jobs" : undefined}
      aria-label={saved ? "Remove from saved" : "Save job"}
      onClick={handleClick}
      className={cn(
        className ||
          "absolute top-4 right-4 grid size-8 shrink-0 place-items-center rounded-lg text-[#9ca3af] transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4ff5] disabled:pointer-events-none disabled:opacity-40",
        saved && (className ? "text-white" : "text-[#c7d2ff] hover:text-[#d6ccff]"),
      )}
    >
      <Bookmark
        className={cn(
          iconClassName || "size-4",
          saved && "fill-current text-current",
        )}
        aria-hidden="true"
      />
    </button>
  );
}
