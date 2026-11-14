import Image from "next/image";
import { Building2 } from "lucide-react";

import type { JobCompanyOverview } from "@/lib/api/jobs";

interface CompanyOverviewProps {
  companyOverview?: JobCompanyOverview | null;
  companyName?: string | null;
}

function isValidHttpUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return url.startsWith("http://") || url.startsWith("https://");
  }
}

export function CompanyOverview({
  companyOverview,
  companyName,
}: CompanyOverviewProps) {
  const size = companyOverview?.size;
  const industry = companyOverview?.industry;
  const website = companyOverview?.website;
  const imageUrl = companyOverview?.imageUrl;

  const hasWebsite = isValidHttpUrl(website);

  const infoRows = [
    size ? { label: "SIZE", value: size } : null,
    industry ? { label: "INDUSTRY", value: industry } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <aside
      aria-label="Company overview"
      className="rounded-[16px] border border-white/[0.08] bg-[#111111] p-6 shadow-sm"
    >
      <h2 className="text-[17px] font-semibold tracking-tight text-white">
        Company Overview
      </h2>

      {/* Company Image or Gradient Placeholder */}
      <div className="relative mt-5 aspect-[16/10] w-full overflow-hidden rounded-[12px] border border-white/[0.08] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={companyName ? `${companyName} office` : "Company overview"}
            fill
            sizes="(max-width: 1024px) 100vw, 300px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Building2
              className="size-8 text-white/20"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Info Rows */}
      {infoRows.length > 0 && (
        <div className="mt-5 divide-y divide-white/[0.06]">
          {infoRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-3.5"
            >
              <span className="text-[10px] font-medium tracking-wider text-[#6b7280]">
                {row.label}
              </span>
              <span className="text-right text-[13px] font-medium text-white">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Visit Website Button */}
      {hasWebsite && (
        <a
          href={website!}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-[10px] border border-white/[0.08] bg-[#1f1f1f] text-[13px] font-medium text-white transition-colors hover:bg-[#282828] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b4ff5]"
        >
          Visit Website
        </a>
      )}
    </aside>
  );
}
