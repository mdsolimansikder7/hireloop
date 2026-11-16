function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getApiBase(): string {
  if (typeof window === "undefined") {
    return normalizeBaseUrl(
      process.env.API_URL ?? "https://hireloop-server-blush.vercel.app/api",
    );
  }

  return "/backend";
}

export const API_BASE = getApiBase();
