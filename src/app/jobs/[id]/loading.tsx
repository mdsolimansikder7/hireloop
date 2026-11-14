export default function JobDetailsLoading() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto w-full max-w-[1100px] px-6 pt-28 pb-20 animate-pulse">
        {/* Header Card Skeleton */}
        <div className="rounded-[16px] border border-white/[0.08] bg-[#111111] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="size-16 rounded-[14px] bg-white/[0.05]" />
              <div className="space-y-2">
                <div className="h-7 w-64 rounded-md bg-white/[0.08]" />
                <div className="h-4 w-40 rounded bg-white/[0.04]" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-[10px] bg-white/[0.05]" />
              <div className="h-10 w-28 rounded-[10px] bg-white/[0.08]" />
            </div>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_300px]">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-[14px] border border-white/[0.08] bg-[#111111] p-4 space-y-2.5"
                >
                  <div className="h-3 w-16 rounded bg-white/[0.04]" />
                  <div className="h-5 w-24 rounded bg-white/[0.08]" />
                </div>
              ))}
            </div>

            {/* Description Card */}
            <div className="rounded-[16px] border border-white/[0.08] bg-[#111111] p-5 sm:p-8 space-y-7">
              <div className="space-y-3">
                <div className="h-5 w-36 rounded bg-white/[0.08]" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full rounded bg-white/[0.04]" />
                  <div className="h-3.5 w-5/6 rounded bg-white/[0.04]" />
                  <div className="h-3.5 w-4/6 rounded bg-white/[0.04]" />
                </div>
              </div>
              <div className="pt-7 border-t border-white/[0.06] space-y-3">
                <div className="h-5 w-32 rounded bg-white/[0.08]" />
                <div className="space-y-2.5">
                  <div className="h-3.5 w-3/4 rounded bg-white/[0.04]" />
                  <div className="h-3.5 w-4/5 rounded bg-white/[0.04]" />
                  <div className="h-3.5 w-2/3 rounded bg-white/[0.04]" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Company Overview */}
          <div className="rounded-[16px] border border-white/[0.08] bg-[#111111] p-6 space-y-5">
            <div className="h-5 w-36 rounded bg-white/[0.08]" />
            <div className="aspect-[16/10] w-full rounded-[12px] bg-white/[0.05]" />
            <div className="space-y-3 pt-2">
              <div className="flex justify-between">
                <div className="h-3 w-12 rounded bg-white/[0.04]" />
                <div className="h-3 w-28 rounded bg-white/[0.06]" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 rounded bg-white/[0.04]" />
                <div className="h-3 w-32 rounded bg-white/[0.06]" />
              </div>
            </div>
            <div className="h-10 w-full rounded-[10px] bg-white/[0.05]" />
          </div>
        </div>
      </div>
    </main>
  );
}
