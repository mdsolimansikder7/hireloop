export interface BillingPaymentMethod {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
}

export interface BillingCurrentPlan {
  id: string | null;
  name: string | null;
  interval: string | null;
  amount: number;
  currency: string;
  status: string | null;
  features?: string[];
  isFree?: boolean;
}

export interface BillingSummary {
  currentPlan: BillingCurrentPlan | null;
  billingInterval: string | null;
  price: number;
  currency: string;
  status: string;
  renewalDate: string | null;
  cancelAtPeriodEnd: boolean;
  paymentMethod: BillingPaymentMethod | null;
  hasStripeCustomer: boolean;
  stripeCustomerId: string | null;
  freePlanApplicationLimit: number | null;
  applicationCount: number;
  remainingApplications: number | null;
}

export interface BillingHistoryItem {
  id: string | null;
  date: string | null;
  planName: string | null;
  interval: string | null;
  amount: number;
  currency: string;
  status: string;
  transactionId: string | null;
  receiptUrl: string | null;
}

export interface BillingPortalResponse {
  url: string;
}

const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, "");
const API_BASE_URL = /^https?:\/\//i.test(normalizedApiUrl)
  ? /\/api$/i.test(normalizedApiUrl)
    ? normalizedApiUrl
    : `${normalizedApiUrl}/api`
  : normalizedApiUrl;

async function requestBilling<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Could not reach the Hireloop billing service.");
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "The billing request failed.");
  }

  return (payload?.data ?? payload) as T;
}

export function fetchBillingSummary(signal?: AbortSignal) {
  return requestBilling<BillingSummary>(`/billing/summary`, { signal });
}

export function fetchBillingHistory(signal?: AbortSignal) {
  return requestBilling<{ data: BillingHistoryItem[] }>(`/billing/history`, { signal });
}

export function createBillingPortal(input?: { returnUrl?: string }) {
  return requestBilling<{ data: BillingPortalResponse }>(`/billing/portal`, {
    method: "POST",
    body: JSON.stringify(input ?? {}),
  });
}
