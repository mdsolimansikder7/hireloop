"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const backButtonStyles =
  "inline-flex items-center gap-2 rounded-[10px] border border-white/[0.08] bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-[#c7d2ff] hover:bg-white/5 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4ff5]";

export function BackToJobsButton() {
  const router = useRouter();
  const cameFromJobs = useMemo(() => {
    if (typeof document === "undefined") return false;
    try {
      const referrer = document.referrer;
      if (!referrer) return false;
      const url = new URL(referrer);
      return (
        url.pathname === "/jobs" || url.pathname.startsWith("/jobs/")
      );
    } catch {
      return false;
    }
  }, []);

  const handleBack = () => {
    if (cameFromJobs) {
      router.back();
    } else {
      router.push("/jobs");
    }
  };

  return cameFromJobs ? (
    <button type="button" onClick={handleBack} className={backButtonStyles}>
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to jobs
    </button>
  ) : (
    <Link href="/jobs" className={backButtonStyles}>
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to jobs
    </Link>
  );
}
