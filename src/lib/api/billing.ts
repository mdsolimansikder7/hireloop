import { getApiBase } from "@/lib/api/base";

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

async function requestBilling<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    const url = `${getApiBase()}${path}`;
    response = await fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    console.error(`[api] billing request network error: url=${getApiBase()}${path}`, error);
    throw new Error("Could not reach the Hireloop billing service.");
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (!response.ok) {
    console.error(`[api] billing request failed: ${response.status} ${response.url}`);
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
