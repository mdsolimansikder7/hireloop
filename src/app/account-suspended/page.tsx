export default function AccountSuspendedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0b0d] px-5 text-white">
      <section className="max-w-md rounded-2xl border border-white/10 bg-[#151519] p-8 text-center">
        <h1 className="text-xl font-semibold">Account suspended</h1>
        <p className="mt-3 text-sm leading-6 text-[#a3a3ad]">
          Access to this HireLoop account has been suspended. Contact the
          platform team if you believe this is a mistake.
        </p>
      </section>
    </main>
  );
}
