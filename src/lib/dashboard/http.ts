import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import type { z } from "zod";

import { auth } from "@/lib/auth";
import { getRole, type Role } from "@/lib/roles";

export type ApiSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function apiError(message: string, status: number): Response {
  return json({ error: message }, status);
}

export async function authorizeApi(
  allowedRoles: readonly Role[],
): Promise<
  { session: ApiSession; response?: never } | { session?: never; response: Response }
> {
  let session: ApiSession | null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (error) {
    console.error("[dashboard-api] Could not verify session", error);
    return { response: apiError("Could not verify session", 500) };
  }

  if (!session) {
    return { response: apiError("Authentication required", 401) };
  }

  if ((session.user as { suspended?: boolean }).suspended === true) {
    return { response: apiError("This account is suspended", 403) };
  }

  if (!allowedRoles.includes(getRole(session.user))) {
    return { response: apiError("Forbidden", 403) };
  }

  if (!ObjectId.isValid(session.user.id)) {
    return { response: apiError("Invalid account identifier", 500) };
  }

  return { session };
}

export async function readJson<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T; response?: never } | { data?: never; response: Response }> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return { response: apiError("Request body must be valid JSON", 400) };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      response: json(
        { error: "Invalid request", details: parsed.error.flatten() },
        400,
      ),
    };
  }

  return { data: parsed.data };
}

export function objectId(value: ObjectId | string): ObjectId | null {
  if (value instanceof ObjectId) return value;
  return typeof value === "string" && ObjectId.isValid(value)
    ? new ObjectId(value)
    : null;
}

export function idValues(value: ObjectId): Array<ObjectId | string> {
  return [value, value.toHexString()];
}

export function readDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function pagination(searchParams: URLSearchParams, defaultLimit = 10) {
  const parsedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const parsedLimit = Number.parseInt(
    searchParams.get("limit") ?? String(defaultLimit),
    10,
  );
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(100, Math.max(1, parsedLimit))
    : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
}

export function paginationMeta(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export function logApiError(context: string, error: unknown): Response {
  console.error(`[dashboard-api] ${context}`, error);
  return apiError("An unexpected server error occurred", 500);
}
