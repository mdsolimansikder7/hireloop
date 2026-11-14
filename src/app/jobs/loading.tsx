export default function JobsLoading() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto w-full max-w-[1100px] px-6 pt-28 pb-16">
        {/* Search bar skeleton */}
        <div className="h-[84px] animate-pulse rounded-2xl border border-white/[0.08] bg-[#111111] p-3">
          <div className="flex items-center gap-2">
            <div className="h-[44px] flex-1 animate-pulse rounded-[10px] bg-[#141414]" />
            <div className="h-[44px] w-[110px] animate-pulse rounded-[10px] bg-[#141414]" />
          </div>
        </div>

        <div className="mt-6 flex items-start gap-6">
          {/* Sidebar skeleton */}
          <aside className="hidden w-[220px] shrink-0 lg:block">
            <div className="animate-pulse rounded-2xl border border-white/[0.08] bg-[#111111] p-5">
              <div className="h-5 w-20 rounded bg-[#1a1a1a]" />
              <div className="mt-5 h-8 w-full animate-pulse rounded bg-[#141414]" />
              <div className="mt-4 h-8 w-full animate-pulse rounded bg-[#141414]" />
              <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-[#141414]" />
            </div>
          </aside>

          {/* Job card skeletons */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-white/[0.08] bg-[#111111] p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="size-12 shrink-0 rounded-[10px] bg-[#141414]" />
                  <div className="min-w-0 flex-1">
                    <div className="h-5 w-2/3 rounded bg-[#1a1a1a]" />
                    <div className="mt-2 h-3.5 w-1/2 rounded bg-[#141414]" />
                    <div className="mt-4 flex gap-2">
                      <div className="h-6 w-24 rounded-[8px] bg-[#141414]" />
                      <div className="h-6 w-20 rounded-[8px] bg-[#141414]" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
