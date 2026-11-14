import { Hero } from "@/components/hero";
import { JobDiscovery } from "@/components/job-discovery";
import { FeaturesSection } from "@/components/features-section";
import { PricingSection } from "@/components/pricing-section";
import { CtaFooter } from "@/components/cta-footer";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Hero />
      <JobDiscovery />
      <FeaturesSection />
      <PricingSection />
      <CtaFooter />
    </>
  );
}
