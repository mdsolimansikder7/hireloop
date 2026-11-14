import type { Metadata } from "next";

import { CheckoutCard } from "@/components/checkout/checkout-card";
import type { BillingPeriod } from "@/lib/api/checkout";

export const metadata: Metadata = {
  title: "Checkout — hireloop",
  description: "Secure checkout for Hireloop plans.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; billing?: string }>;
}) {
  const params = await searchParams;
  const planId =
    typeof params.plan === "string" && params.plan.trim()
      ? params.plan.trim()
      : "growth";
  const billing: BillingPeriod =
    params.billing === "yearly" ? "yearly" : "monthly";

  return <CheckoutCard planId={planId} billing={billing} />;
}
