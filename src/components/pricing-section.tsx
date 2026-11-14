"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Check,
  Crown,
  LoaderCircle,
  Plus,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { PLAN_CATALOG } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  createCheckoutSession,
  fetchPlans,
  type PricingPlan,
} from "@/lib/api/checkout";

type Billing = "monthly" | "yearly";

const icons: Record<string, LucideIcon> = {
  crown: Crown,
  chart: BarChart3,
  zap: Zap,
};

const fallbackPlans = Object.values(PLAN_CATALOG);

function formatPrice(price: number) {
  return `$${price}`;
}

export function PricingSection() {
  const router = useRouter();
  const [billing, setBilling] = useState<Billing>("monthly");
  const [plans, setPlans] = useState<PricingPlan[]>(fallbackPlans);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const controller = new AbortController();

    fetchPlans(controller.signal)
      .then((data) => {
        if (data.plans.length > 0) setPlans(data.plans);
      })
      .catch(() => {
        // Keep the built-in plans if the API is unreachable.
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Fetch current subscription to prevent duplicate purchases
  useEffect(() => {
    if (!session) return;

    const controller = new AbortController();
    fetch("/api/billing/summary", { signal: controller.signal, credentials: "same-origin" })
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.data?.currentPlan?.id) {
          setCurrentPlanId(payload.data.currentPlan.id);
        }
      })
      .catch(() => {
        // Ignore errors; default to no current plan
      });

    return () => controller.abort();
  }, [session]);

  const choosePlan = async (plan: PricingPlan) => {
    const isFree = plan.monthlyPrice === 0;
    const freeHref = session ? "/dashboard" : "/signup";

    if (isFree) {
      router.push(freeHref);
      return;
    }

    // Prevent re-purchase of same active plan
    if (currentPlanId === plan.id) {
      setCheckoutError(
        `You already have an active ${plan.name} subscription. Manage it from your billing page.`,
      );
      return;
    }

    setCheckoutError(null);
    setSubmittingPlanId(plan.id);
    try {
      const checkoutSession = await createCheckoutSession({
        planId: plan.id,
        billing,
        email: session?.user?.email ?? undefined,
      });
      const checkoutLink = document.createElement("a");
      checkoutLink.href = checkoutSession.url;
      checkoutLink.rel = "noopener noreferrer";
      document.body.appendChild(checkoutLink);
      checkoutLink.click();
      document.body.removeChild(checkoutLink);
      return;
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Could not start checkout.",
      );
    } finally {
      setSubmittingPlanId((current) => (current === plan.id ? null : current));
    }
  };

  return (
    <section
      id="pricing"
      className="relative bg-[#0b0b0b] py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1000px] px-5 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-[2px] bg-[#5b4ff5]"
            />
            <span className="font-mono text-[11px] font-medium tracking-[0.28em] text-[#9ca3af] uppercase sm:text-xs">
              Pricing
            </span>
            <span
              aria-hidden="true"
              className="size-1.5 rounded-[2px] bg-[#5b4ff5]"
            />
          </div>

          <h2 className="mt-4 max-w-2xl text-balance text-4xl leading-[1.1] font-semibold tracking-tight text-white sm:mt-5 sm:text-5xl">
            Pay for the leverage,
            <br />
            not the listings
          </h2>

          <div
            role="radiogroup"
            aria-label="Billing period"
            className="mt-10 inline-flex items-center rounded-full border border-white/[0.08] bg-[#1a1a1a] p-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={billing === "monthly"}
              onClick={() => setBilling("monthly")}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                billing === "monthly"
                  ? "bg-white text-black"
                  : "text-white/70 hover:text-white",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={billing === "yearly"}
              onClick={() => setBilling("yearly")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                billing === "yearly"
                  ? "bg-white text-black"
                  : "text-white/70 hover:text-white",
              )}
            >
              Yearly
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none text-white",
                  billing === "yearly" ? "bg-[#d91fd9]" : "bg-[#d91fd9]/90",
                )}
              >
                25%
              </span>
            </button>
          </div>
        </div>

        <div
          aria-busy={isLoading}
          className="mt-8 grid grid-cols-1 gap-6 min-[700px]:grid-cols-3"
        >
          {plans.map((plan) => {
            const Icon = icons[plan.icon] ?? Crown;
            const highlighted = plan.highlighted === true;
            const price =
              billing === "yearly" ? plan.yearlyMonthlyPrice : plan.monthlyPrice;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "group/pricing min-h-[340px] flex h-full flex-col rounded-[20px] border border-white/[0.08] text-white ring-0 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-white/[0.14]",
                  highlighted
                    ? "bg-[#1c1c1c] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_60px_-24px_rgba(0,0,0,0.75)]"
                    : "bg-[#111111]",
                )}
                style={{ "--card-spacing": "0px" } as React.CSSProperties}
              >
                <div className="flex h-full flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-[linear-gradient(180deg,#1a1a1a_0%,#0a0a0a_100%)] text-[#e9d5ff]"
                        aria-hidden="true"
                      >
                        <Icon className="size-4" strokeWidth={1.5} />
                      </span>
                      <span className="text-base font-medium text-white">
                        {plan.name}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 text-right">
                      <span className="text-[28px] font-semibold leading-none tracking-tight text-white sm:text-[32px]">
                        {formatPrice(price)}
                      </span>
                      <span className="text-[11px] text-[#9ca3af]">/month</span>
                    </div>
                  </div>

                  <p className="mt-6 text-[13px] font-medium text-white">
                    {plan.description}
                  </p>

                  <ul className="mt-4 flex flex-col gap-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span
                          className="mt-0.5 grid size-4 shrink-0 place-items-center rounded bg-white/[0.06] text-[#9ca3af]"
                          aria-hidden="true"
                        >
                          <Plus className="size-3" strokeWidth={2} />
                        </span>
                        <span className="text-xs leading-relaxed text-[#9ca3af]">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="button"
                    onClick={() => choosePlan(plan)}
                    disabled={
                      submittingPlanId === plan.id ||
                      currentPlanId === plan.id
                    }
                    className={cn(
                      "mt-auto h-10 w-full justify-between rounded-lg px-4 text-[13px] font-medium disabled:opacity-70",
                      highlighted
                        ? "bg-white text-black hover:bg-white/90"
                        : "bg-[#2a2a2a] text-white/90 hover:bg-[#333333] hover:text-white",
                    )}
                  >
                    {submittingPlanId === plan.id ? (
                      <>
                        <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                        Starting…
                      </>
                    ) : currentPlanId === plan.id ? (
                      <>
                        Current Plan
                        <Check className="size-4" aria-hidden="true" />
                      </>
                    ) : (
                      <>
                        Choose This Plan
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {checkoutError ? (
          <p
            role="alert"
            className="mt-5 text-center text-[11px] text-red-400"
          >
            {checkoutError}
          </p>
        ) : null}

        {billing === "yearly" ? (
          <p className="mt-5 text-center text-[11px] text-[#9ca3af]">
            Yearly plans are billed once for 12 months — 25% off the monthly
            price.
          </p>
        ) : null}
      </div>
    </section>
  );
}
