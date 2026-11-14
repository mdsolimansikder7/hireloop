"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function JobDetailsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Job details error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#0a0a0a] px-6 pt-28 pb-20">
      <div className="w-full max-w-md rounded-[16px] border border-white/[0.08] bg-[#111111] p-8 text-center shadow-lg">
        <div className="mx-auto grid size-12 place-items-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
          <AlertCircle className="size-6" aria-hidden="true" />
        </div>

        <h1 className="mt-4 text-xl font-semibold text-white">
          Could not load this job
        </h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          An unexpected error occurred while fetching the job information. Please try again.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-[#e5e5e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4ff5]"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            <span>Retry</span>
          </button>

          <Link
            href="/jobs"
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-white/[0.08] bg-[#1a1a1a] px-5 text-sm font-medium text-white transition-colors hover:bg-[#252525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4ff5]"
          >
            Browse jobs
          </Link>
        </div>
      </div>
    </main>
  );
}
