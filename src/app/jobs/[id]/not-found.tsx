import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function JobNotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#0a0a0a] px-6 pt-28 pb-20">
      <div className="w-full max-w-md rounded-[16px] border border-white/[0.08] bg-[#111111] p-8 text-center shadow-lg">
        <div className="mx-auto grid size-12 place-items-center rounded-full border border-white/10 bg-[#1a1a1a] text-[#9ca3af]">
          <FileQuestion className="size-6" aria-hidden="true" />
        </div>

        <h1 className="mt-4 text-xl font-semibold text-white">
          Job not found
        </h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          This job doesn&apos;t exist or was removed.
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/jobs"
            className="inline-flex h-10 items-center justify-center rounded-[10px] bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-[#e5e5e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4ff5]"
          >
            Browse jobs
          </Link>
        </div>
      </div>
    </main>
  );
}
