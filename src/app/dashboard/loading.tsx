export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#0b0b0d] p-4 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] gap-4">
        <aside className="hidden w-56 shrink-0 animate-pulse rounded-2xl border border-white/[0.06] bg-[#101013] lg:block" />
        <section className="min-w-0 flex-1 animate-pulse rounded-2xl border border-white/[0.06] bg-[#101013] p-6">
          <div className="h-10 w-full rounded-lg bg-white/[0.06]" />
          <div className="mt-8 h-8 w-64 rounded-lg bg-white/[0.06]" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-28 rounded-xl bg-white/[0.06]" />
            ))}
          </div>
          <div className="mt-8 h-6 w-40 rounded bg-white/[0.06]" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-16 rounded-xl bg-white/[0.06]" />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
