import { getApiBase } from "@/lib/api/base";
import { fetchWithBackendAuth } from "@/lib/api/backend-auth";

export const DEFAULT_JOB_LIMIT = 10;

export class JobsApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "JobsApiError";
    this.status = status;
  }
}

export const JOB_TYPES = [
  "Full-time",
  "Contract",
  "Freelance",
  "Internship",
  "Part-time",
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export interface JobBenefit {
  icon: string;
  title: string;
}

export interface JobCompanyOverview {
  size?: string | null;
  industry?: string | null;
  website?: string | null;
  imageUrl?: string | null;
}

export interface Job {
  id: string;
  title: string;
  description?: string | null;
  companyName?: string | null;
  logoUrl?: string | null;
  location?: string | null;
  remote?: boolean | null;
  type?: string | null;
  workMode?: string | null;
  level?: string | null;
  experience?: string | null;
  skills?: string[];
  responsibilities?: string[];
  requirements?: string[];
  benefits?: JobBenefit[];
  companyOverview?: JobCompanyOverview | null;
  verifiedEmployer?: boolean | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryFrequency?: string | null;
  currency?: string | null;
  easyApply?: boolean | null;
  hot?: boolean | null;
  status?: string | null;
  createdAt?: string | null;
  isOwner?: boolean;
  hasApplied?: boolean;
  isSaved?: boolean;
}

export interface NewJobInput {
  title: string;
  description: string;
  companyName: string;
  category: string;
  type: JobType;
  remote: boolean;
  location: string;
  applicationDeadline: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  salaryFrequency: string;
  responsibilities: string[];
  requirements: string[];
}

export interface SavedJobRecord {
  jobId: string;
  createdAt: string | null;
}

export interface JobsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  facets?: Record<string, number>;
}

export interface JobsResponse {
  data: Job[];
  meta: JobsMeta;
}

export interface PlatformStats {
  activeJobs: number;
  newJobsThisMonth: number;
  companies: number;
  jobSeekers: number;
  satisfactionRate: number | null;
}

export interface CompanySummary {
  slug: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
  size: string | null;
  website: string | null;
  jobCount: number;
  openJobCount: number;
  locations: string[];
}

export interface CompanyJob {
  id: string;
  title: string;
  location: string | null;
  type: string | null;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  salaryFrequency: string | null;
  status: "open" | "closed";
  createdAt: string | null;
}

export interface CompanyDetails {
  company: CompanySummary & { description: string | null };
  jobs: CompanyJob[];
}

export type JobsSort = "newest" | "salary";

export interface JobsFiltersState {
  q: string;
  types: string[];
  workMode: string;
  level: string;
  salaryMin: string;
  sort: JobsSort;
  page: number;
}

export interface JobsQueryInput {
  q?: string;
  status?: "open" | "closed";
  type?: string[];
  workMode?: string;
  level?: string;
  salaryMin?: string;
  sort?: JobsSort;
  page?: number;
  limit?: number;
}

type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

function readParam(
  params: RawParams,
  key: string,
): string {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? "";
  }
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * Turns the current URL search params into a normalized jobs filter state.
 * URL is the source of truth (q, type, workMode, level, salaryMin, sort, page).
 */
export function parseJobsFilters(params: RawParams): JobsFiltersState {
  const q = readParam(params, "q").trim();
  const types = readParam(params, "type")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const page = Math.max(1, parseInt(readParam(params, "page") || "1", 10) || 1);
  const sortParam = readParam(params, "sort");
  const sort: JobsSort = sortParam === "salary" ? "salary" : "newest";

  return {
    q,
    types,
    workMode: readParam(params, "workMode").trim(),
    level: readParam(params, "level").trim(),
    salaryMin: readParam(params, "salaryMin").trim(),
    sort,
    page,
  };
}

/** Serializes a jobs filter state into a query string (used for router.replace). */
export function jobsParamsToQueryString(filters: JobsFiltersState): string {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.types.length) sp.set("type", filters.types.join(","));
  if (filters.workMode) sp.set("workMode", filters.workMode);
  if (filters.level) sp.set("level", filters.level);
  if (filters.salaryMin) sp.set("salaryMin", filters.salaryMin);
  sp.set("sort", filters.sort);
  sp.set("page", String(filters.page));
  sp.set("limit", String(DEFAULT_JOB_LIMIT));
  return sp.toString();
}

export async function fetchJobs(
  query: JobsQueryInput,
): Promise<JobsResponse> {
  const sp = new URLSearchParams();
  if (query.q) sp.set("q", query.q);
  if (query.status) sp.set("status", query.status);
  if (query.type?.length) sp.set("type", query.type.join(","));
  if (query.workMode) sp.set("workMode", query.workMode);
  if (query.level) sp.set("level", query.level);
  if (query.salaryMin) sp.set("salaryMin", query.salaryMin);
  sp.set("sort", query.sort ?? "newest");
  sp.set("page", String(query.page ?? 1));
  sp.set("limit", String(query.limit ?? DEFAULT_JOB_LIMIT));

  const url = `${getApiBase()}/jobs?${sp.toString()}`;
  try {
    const res = await fetchWithBackendAuth(url, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(`[api] fetchJobs failed: ${res.status} ${url}`);
      throw new JobsApiError("Could not load jobs", res.status);
    }

    const json = (await res.json()) as Partial<JobsResponse>;
    const data = Array.isArray(json.data) ? json.data : [];
    const meta = json.meta ?? {
      page: query.page ?? 1,
      limit: query.limit ?? DEFAULT_JOB_LIMIT,
      total: 0,
      totalPages: 0,
    };

    return { data, meta };
  } catch (error) {
    const status = error instanceof JobsApiError ? error.status : undefined;
    console.error(
      `[api] fetchJobs error: status=${status ?? "n/a"} url=${url}`,
      error,
    );
    throw error;
  }
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const url = `${getApiBase()}/stats`;
  try {
    const response = await fetchWithBackendAuth(url, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      console.error(`[api] fetchPlatformStats failed: ${response.status} ${url}`);
      throw new JobsApiError("Could not load platform statistics", response.status);
    }
    const result = (await response.json().catch(() => null)) as {
      data?: Partial<PlatformStats>;
    } | null;
    const data = result?.data;
    if (
      !data ||
      typeof data.activeJobs !== "number" ||
      typeof data.newJobsThisMonth !== "number" ||
      typeof data.companies !== "number" ||
      typeof data.jobSeekers !== "number" ||
      (data.satisfactionRate !== null &&
        typeof data.satisfactionRate !== "number")
    ) {
      throw new JobsApiError("The platform statistics response was invalid");
    }
    return data as PlatformStats;
  } catch (error) {
    const status = error instanceof JobsApiError ? error.status : undefined;
    console.error(
      `[api] fetchPlatformStats error: status=${status ?? "n/a"} url=${url}`,
      error,
    );
    throw error;
  }
}

export async function fetchCompanies(): Promise<CompanySummary[]> {
  const url = `${getApiBase()}/companies`;
  try {
    const response = await fetchWithBackendAuth(url, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      console.error(`[api] fetchCompanies failed: ${response.status} ${url}`);
      throw new JobsApiError("Could not load companies", response.status);
    }
    const result = (await response.json().catch(() => null)) as {
      data?: CompanySummary[];
    } | null;
    if (!result || !Array.isArray(result.data)) {
      throw new JobsApiError("The companies response was invalid");
    }
    return result.data;
  } catch (error) {
    const status = error instanceof JobsApiError ? error.status : undefined;
    console.error(
      `[api] fetchCompanies error: status=${status ?? "n/a"} url=${url}`,
      error,
    );
    throw error;
  }
}

export async function fetchCompany(slug: string): Promise<CompanyDetails | null> {
  const url = `${getApiBase()}/companies/${encodeURIComponent(slug)}`;
  try {
    const response = await fetchWithBackendAuth(url, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      console.error(`[api] fetchCompany failed: ${response.status} ${url}`);
      throw new JobsApiError("Could not load company details", response.status);
    }
    const result = (await response.json().catch(() => null)) as {
      data?: CompanyDetails;
    } | null;
    if (!result?.data?.company || !Array.isArray(result?.data.jobs)) {
      throw new JobsApiError("The company response was invalid");
    }
    return result.data;
  } catch (error) {
    const status = error instanceof JobsApiError ? error.status : undefined;
    console.error(
      `[api] fetchCompany error: status=${status ?? "n/a"} url=${url}`,
      error,
    );
    throw error;
  }
}

export async function createJob(input: NewJobInput): Promise<void> {
  const url = `${getApiBase()}/jobs`;
  try {
    const response = await fetchWithBackendAuth(url, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      console.error(`[api] createJob failed: ${response.status} ${url}`);
      let message = "Could not publish job";
      try {
        const body = (await response.json().catch(() => ({}))) as {
          error?: unknown;
          message?: unknown;
        };
        if (typeof body.message === "string") message = body.message;
        else if (typeof body.error === "string") message = body.error;
      } catch {
        // The service may return an empty or non-JSON error response.
      }
      throw new JobsApiError(message, response.status);
    }
  } catch (error) {
    const status = error instanceof JobsApiError ? error.status : undefined;
    console.error(
      `[api] createJob error: status=${status ?? "n/a"} url=${url}`,
      error,
    );
    throw error;
  }
}

export async function updateJob(id: string, input: NewJobInput): Promise<void> {
  const url = `${getApiBase()}/recruiter/jobs/${encodeURIComponent(id)}`;
  try {
    const response = await fetchWithBackendAuth(url, {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      console.error(`[api] updateJob failed: ${response.status} ${url}`);
      let message = "Could not update job";
      try {
        const body = (await response.json().catch(() => ({}))) as {
          error?: unknown;
          message?: unknown;
        };
        if (typeof body.message === "string") message = body.message;
        else if (typeof body.error === "string") message = body.error;
      } catch {
        // The service may return an empty or non-JSON error response.
      }
      throw new JobsApiError(message, response.status);
    }
  } catch (error) {
    const status = error instanceof JobsApiError ? error.status : undefined;
    console.error(
      `[api] updateJob error: status=${status ?? "n/a"} url=${url}`,
      error,
    );
    throw error;
  }
}

/** Job ids the current session user has already applied to (session-based). */
export async function fetchAppliedJobIds(): Promise<string[]> {
  try {
    const url = `${getApiBase()}/applications/my-job-ids`;
    const res = await fetchWithBackendAuth(url, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`[api] fetchAppliedJobIds failed: ${res.status} ${url}`);
      return [];
    }
    const json = (await res.json().catch(() => null)) as { data?: string[] } | null;
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

/** Saved job ids for the current session (empty list when signed out / failing). */
export async function fetchSavedJobIds(): Promise<string[]> {
  try {
    const res = await fetch(`${getApiBase()}/saved-jobs`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as Record<string, unknown>;
    let raw: unknown = json;
    if (!Array.isArray(json)) {
      raw =
        json.data ?? json.savedJobs ?? json.ids ?? (json as { saved?: unknown }).saved;
    }
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

/** Saved-job metadata used by the seeker library. */
export async function fetchSavedJobs(): Promise<SavedJobRecord[]> {
  try {
    const res = await fetch(`${getApiBase()}/saved-jobs`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`[api] fetchSavedJobs failed: ${res.status} ${res.url}`);
      throw new JobsApiError("Could not load saved jobs", res.status);
    }

    const json = (await res.json().catch(() => null)) as Record<string, unknown> | unknown[] | null;
    let raw: unknown = json;
    if (!Array.isArray(json)) {
      raw =
        json?.data ??
        json?.savedJobs ??
        json?.ids ??
        (json as Record<string, unknown> | null)?.saved;
    }
    if (!Array.isArray(raw)) {
      throw new JobsApiError("Saved jobs response has an invalid format");
    }

    return raw.flatMap((entry): SavedJobRecord[] => {
      if (typeof entry === "string" || typeof entry === "number") {
        return [{ jobId: String(entry), createdAt: null }];
      }
      if (!entry || typeof entry !== "object") return [];
      const record = entry as Record<string, unknown>;
      const rawId = record.jobId ?? record.job ?? record.id;
      const nestedId =
        rawId && typeof rawId === "object"
          ? (rawId as Record<string, unknown>)._id ??
            (rawId as Record<string, unknown>).id
          : rawId;
      if (nestedId === undefined || nestedId === null) return [];
      const createdAt =
        typeof record.createdAt === "string"
          ? record.createdAt
          : record.createdAt instanceof Date
            ? record.createdAt.toISOString()
            : null;
      return [{ jobId: String(nestedId), createdAt }];
    });
  } catch (err) {
    if (err instanceof JobsApiError) throw err;
    console.error(`[api] fetchSavedJobs failed:`, err);
    throw new JobsApiError("Could not load saved jobs");
  }
}

/** Toggle a saved job. `saved: true` -> POST /jobs/:id/save, false -> DELETE. */
export async function toggleSavedJob(
  jobId: string,
  saved: boolean,
): Promise<boolean> {
  const url = `${getApiBase()}/jobs/${encodeURIComponent(jobId)}/save`;
  const res = await fetchWithBackendAuth(url, {
    method: saved ? "POST" : "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    console.error(`[api] toggleSavedJob failed: ${res.status} ${url}`);
    throw new JobsApiError("Could not update saved job", res.status);
  }
  if (saved) await recordActivity("job_saved", jobId);
  return saved;
}

async function recordActivity(type: "applied" | "job_saved", jobId: string) {
  try {
    const url = `${getApiBase()}/activity/track`;
    const response = await fetchWithBackendAuth(url, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, jobId }),
    });
    if (!response.ok) {
      console.error(`Could not record ${type} activity`, response.status, url);
    }
  } catch (error) {
    console.error(`Could not record ${type} activity`, error);
  }
}

/**
 * Fetch a single job by id.
 * Returns null if not found (404) or id is invalid (400).
 */
export async function getJob(
  id: string,
  options?: { cookie?: string },
): Promise<Job | null> {
  if (!id || id.length !== 24) {
    return null;
  }

  const url = `${getApiBase()}/jobs/${encodeURIComponent(id)}`;
  try {
    const res = await fetchWithBackendAuth(url, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(options?.cookie ? { cookie: options.cookie } : {}),
      },
      cache: "no-store",
    });

    if (res.status === 404 || res.status === 400) {
      return null;
    }

    if (!res.ok) {
      console.error(`[api] getJob failed: ${res.status} ${url}`);
      throw new JobsApiError("Could not load job details", res.status);
    }

    const json = (await res.json().catch(() => null)) as { data?: Job } | null;
    return json?.data ?? null;
  } catch (error) {
    const status = error instanceof JobsApiError ? error.status : undefined;
    console.error(
      `[api] getJob error: status=${status ?? "n/a"} url=${url}`,
      error,
    );
    throw error;
  }
}

/**
 * Apply to a job by id.
 */
export async function applyToJob(
  id: string,
): Promise<{ success: boolean; message: string; alreadyApplied?: boolean }> {
  const url = `${getApiBase()}/jobs/${encodeURIComponent(id)}/apply`;
  try {
    const res = await fetchWithBackendAuth(url, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (res.status === 409) {
      return {
        success: false,
        alreadyApplied: true,
        message: "Already applied for this job",
      };
    }

    if (!res.ok) {
      console.error(`[api] applyToJob failed: ${res.status} ${url}`);
      const errorJson = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new JobsApiError(
        errorJson.error || "Could not apply for job",
        res.status,
      );
    }

    const json = (await res.json().catch(() => ({}))) as {
      message?: string;
      success?: boolean;
    };
    await recordActivity("applied", id);

    return {
      success: true,
      message: json.message ?? "Application submitted",
    };
  } catch (error) {
    const status = error instanceof JobsApiError ? error.status : undefined;
    console.error(
      `[api] applyToJob error: status=${status ?? "n/a"} url=${url}`,
      error,
    );
    throw error;
  }
}
