"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, MapPin, Search } from "lucide-react";

import type { CompanySummary } from "@/lib/api/jobs";

export function CompanyDirectory({
  companies,
  error,
}: {
  companies: CompanySummary[];
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return companies.filter((company) =>
      !query ||
      [company.name, company.industry, ...company.locations]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(query)),
    );
  }, [companies, search]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-5 pb-16 pt-28 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3 py-1 text-[11px] font-medium text-violet-200">
            <Building2 className="size-3.5" />
            Company directory
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
            Find a company where you can <span className="text-violet-300">grow</span>
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#92929b]">
            Explore companies hiring on HireLoop and discover the roles they have posted.
          </p>
        </div>

        <label className="mx-auto mt-8 flex h-12 max-w-xl items-center gap-3 rounded-xl border border-white/[0.09] bg-[#131317] px-4 focus-within:border-violet-400/40">
          <Search className="size-4 shrink-0 text-[#777781]" />
          <input
            aria-label="Search companies"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search company, industry, or location"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[#686872]"
          />
        </label>

        {error ? (
          <p role="alert" className="mx-auto mt-8 max-w-xl rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-center text-sm text-rose-200">
            {error}
          </p>
        ) : filteredCompanies.length ? (
          <>
            <p className="mt-8 text-xs text-[#777781]">
              {filteredCompanies.length} {filteredCompanies.length === 1 ? "company" : "companies"}
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map((company) => (
                <Link
                  key={company.slug}
                  href={`/company/${encodeURIComponent(company.slug)}`}
                  className="group rounded-2xl border border-white/[0.08] bg-[#111111] p-5 transition hover:-translate-y-0.5 hover:border-violet-300/30 hover:bg-[#141418]"
                >
                  <div className="flex items-start gap-3">
                    <CompanyLogo name={company.name} image={company.logoUrl} />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-semibold group-hover:text-violet-200">{company.name}</h2>
                      <p className="mt-1 truncate text-xs text-[#85858e]">{company.industry ?? "Company"}</p>
                    </div>
                  </div>
                  {company.size ? (
                    <p className="mt-4 text-xs text-[#aaaab3]">{company.size} employees</p>
                  ) : null}
                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.06] pt-4 text-[11px] text-[#92929b]">
                    <span className="inline-flex items-center gap-1.5">
                      <BriefcaseBusiness className="size-3.5 text-violet-300" />
                      {company.openJobCount} open {company.openJobCount === 1 ? "role" : "roles"}
                    </span>
                    {company.locations[0] ? (
                      <span className="inline-flex min-w-0 items-center gap-1 truncate">
                        <MapPin className="size-3.5 shrink-0" />
                        {company.locations[0]}
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-10 rounded-2xl border border-white/[0.07] bg-[#111111] px-5 py-16 text-center">
            <Building2 className="mx-auto size-7 text-[#676771]" />
            <h2 className="mt-3 text-sm font-medium">{search ? "No companies found" : "No companies yet"}</h2>
            <p className="mt-1 text-xs text-[#777781]">
              {search ? "Try a different search term." : "Companies will appear here as they join HireLoop."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function CompanyLogo({ name, image }: { name: string; image: string | null }) {
  return (
    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/[0.08] bg-[#202027] text-sm font-semibold text-violet-200">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "C"
      )}
    </span>
  );
}
