export type PlanId = 'starter' | 'growth' | 'premium';

export interface PlanFeatures {
  id: string;
  name: string;
  description: string;
  icon: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  highlighted: boolean;
  features: string[];
}

export interface PlanPrice {
  currency: string;
  monthly: number; // in cents
  yearly: number;  // in cents
}

export const PLAN_CATALOG: Record<PlanId, PlanFeatures> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For getting started',
    icon: 'crown',
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    highlighted: false,
    features: [
      'Daily AI match brief (top 5)',
      'Verified salary bands',
      'Company insight dashboards',
      '1-click apply, unlimited',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    description: 'Start building your insights hub:',
    icon: 'chart',
    monthlyPrice: 1700, // $17
    yearlyMonthlyPrice: 1275, // $12.75
    highlighted: true,
    features: [
      'Daily AI match brief (top 5)',
      'Verified salary bands',
      'Company insight dashboards',
      '1-click apply, unlimited',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'For teams and power users',
    icon: 'zap',
    monthlyPrice: 9900, // $99
    yearlyMonthlyPrice: 7425, // $74.25
    highlighted: false,
    features: [
      'Everything in Pro',
      'Multi-profile career portfolios',
      'Shared talent rooms',
      'Recruiter view (read-only)',
    ],
  },
};

export const PLAN_PRICES: Record<PlanId, PlanPrice> = {
  starter: {
    currency: 'USD',
    monthly: 0,
    yearly: 0,
  },
  growth: {
    currency: 'USD',
    monthly: 1700,
    yearly: 1275,
  },
  premium: {
    currency: 'USD',
    monthly: 9900,
    yearly: 7425,
  },
};

export function getPlan(planId: PlanId): PlanFeatures {
  return PLAN_CATALOG[planId];
}

export function getPlanPrice(planId: PlanId): PlanPrice {
  return PLAN_PRICES[planId];
}

export function formatPlanPrice(planId: PlanId, billingPeriod: 'monthly' | 'yearly') {
  const plan = PLAN_PRICES[planId];
  const amount = billingPeriod === 'yearly' ? plan.yearly : plan.monthly;
  return `$${(amount / 100).toFixed(2)}`;
}

export function isFreePlan(planId: PlanId): boolean {
  return planId === 'starter';
}

export function getPlanFeatures(planId: PlanId): string[] {
  return PLAN_CATALOG[planId].features;
}

export const FREE_PLAN_APPLICATION_LIMIT = 10;