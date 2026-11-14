import type { Metadata } from "next";

import { PricingSection } from "@/components/pricing-section";

export const metadata: Metadata = {
  title: "Pricing — hireloop",
  description: "HireLoop pricing plans for job seekers and recruiters.",
};

export const dynamic = "force-dynamic";

export default function PricingPage() {
  return <PricingSection />;
}
