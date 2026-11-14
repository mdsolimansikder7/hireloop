export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.MONGODB_URI) {
    return;
  }

  const { ensureDashboardIndexes } = await import("@/lib/db/dashboard");
  await ensureDashboardIndexes();
}
