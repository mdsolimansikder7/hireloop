function resolveApiBase(): string {
  if (typeof window === "undefined") {
    return (
      process.env.BACKEND_URL ??
      "https://hireloop-server-blush.vercel.app/api"
    ).replace(/\/+$/, "");
  }

  return (
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
  ).replace(/\/+$/, "");
}

export const API_BASE = resolveApiBase();
