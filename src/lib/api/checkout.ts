const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, "");
const API_BASE_URL = /^https?:\/\//i.test(normalizedApiUrl)
  ? /\/api$/i.test(normalizedApiUrl)
    ? normalizedApiUrl
    : `${normalizedApiUrl}/api`
  : normalizedApiUrl;

export type CheckoutCurrency = "BDT" | "USD";
export type BillingPeriod = "monthly" | "yearly";

export interface CheckoutPrice {
  currency: CheckoutCurrency;
  amount: number;
  display: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  icon: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  highlighted: boolean;
  features: string[];
}

export interface PlansPayload {
  usdToBdt: number;
  yearlyDiscount: number;
  plans: PricingPlan[];
}

export interface CheckoutConfig {
  publishableKey: string;
  stripeReady: boolean;
  usdToBdt: number;
  plan: {
    id: string;
    name: string;
    description: string;
    icon: string;
    features: string[];
    highlighted: boolean;
    billing: BillingPeriod;
    interval: "month" | "year";
  };
  currencies: CheckoutPrice[];
  defaultCurrency: CheckoutCurrency;
}

export interface PaymentIntentPayload {
  id: string;
  clientSecret: string;
  amount: number;
  currency: CheckoutCurrency;
  display: string;
  planId: string;
  billing: BillingPeriod;
  publishableKey: string;
}

export interface ConfirmedPayment {
  transactionId: string;
  status: "success" | "pending" | "failed";
  stripeStatus: string;
  amount: number;
  currency: string;
}

/**
 * Normalized checkout/payment record returned by the success screen:
 * hosted Checkout Sessions (`cs_...`) and Payment Intents (`pi_...`) both
 * resolve into this shape (Stripe is the source of truth for the values).
 */
export interface CheckoutSessionRecord {
  id: string;
  transactionId: string;
  paymentIntentId: string | null;
  url: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  stripeStatus: string | null;
  customerEmail: string | null;
  userEmail: string | null;
  plan: string | null;
  planName: string | null;
  billing: string | null;
  interval: string | null;
  receiptUrl: string | null;
  createdAt: string | null;
}

export class CheckoutApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "CheckoutApiError";
    this.status = status;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
    throw new CheckoutApiError(
      "Could not reach the Hireloop API. Make sure the backend is running.",
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (!response.ok) {
    throw new CheckoutApiError(
      payload?.error ?? "The checkout request failed.",
      response.status,
    );
  }

  return payload?.data as T;
}

export function fetchPlans(signal?: AbortSignal) {
  return request<PlansPayload>("/plans", { signal });
}

export function fetchCheckoutConfig(
  planId: string,
  billing: BillingPeriod,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ plan: planId, billing });
  return request<CheckoutConfig>(`/checkout/config?${query.toString()}`, {
    signal,
  });
}

export function createPaymentIntent(
  input: {
    planId: string;
    billing: BillingPeriod;
    currency: CheckoutCurrency;
    email?: string;
  },
  signal?: AbortSignal,
) {
  return request<PaymentIntentPayload>("/checkout/payment-intent", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
}

export function createCheckoutSession(
  input: {
    planId: string;
    billing: BillingPeriod;
    email?: string;
  },
  signal?: AbortSignal,
) {
  return request<{
    id: string;
    url: string;
    amount: number;
    currency: string;
    planId: string;
    billing: BillingPeriod;
  }>("/checkout/session", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
}

export function confirmCheckoutPayment(
  paymentIntentId: string,
  signal?: AbortSignal,
) {
  return request<ConfirmedPayment>("/checkout/confirm", {
    method: "POST",
    body: JSON.stringify({ paymentIntentId }),
    signal,
  });
}

export function fetchCheckoutPayment(
  paymentIntentId: string,
  signal?: AbortSignal,
) {
  return request<CheckoutSessionRecord>(
    `/checkout/payments/${encodeURIComponent(paymentIntentId)}`,
    { signal },
  );
}

export function fetchCheckoutSession(
  sessionId: string,
  signal?: AbortSignal,
) {
  return request<CheckoutSessionRecord>(
    `/checkout/session/${encodeURIComponent(sessionId)}`,
    { signal },
  );
}
