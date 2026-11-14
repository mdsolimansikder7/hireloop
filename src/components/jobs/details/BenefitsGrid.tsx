import {
  CircleDollarSign,
  Gift,
  Laptop,
  Plane,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import type { JobBenefit } from "@/lib/api/jobs";

interface BenefitsGridProps {
  benefits: JobBenefit[];
}

const BENEFIT_ICONS: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  "circle-dollar-sign": CircleDollarSign,
  laptop: Laptop,
  plane: Plane,
};

function getBenefitIcon(iconKey: string): LucideIcon {
  const normalized = iconKey.toLowerCase().trim();
  return BENEFIT_ICONS[normalized] ?? Gift;
}

export function BenefitsGrid({ benefits }: BenefitsGridProps) {
  if (!benefits || benefits.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
      {benefits.map((benefit, index) => {
        const Icon = getBenefitIcon(benefit.icon);
        return (
          <div key={`${benefit.title}-${index}`} className="flex items-center gap-3.5">
            <div className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-white/[0.08] bg-[#1a1a1a]">
              <Icon className="size-[18px] text-[#c7d2ff]" aria-hidden="true" />
            </div>
            <span className="text-[13px] font-medium leading-tight text-white">
              {benefit.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}
