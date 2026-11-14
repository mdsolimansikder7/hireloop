import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { CompanyDetailsView } from "@/components/companies/company-details-view";
import { fetchCompany, type CompanyDetails } from "@/lib/api/jobs";

export const metadata: Metadata = {
  title: "Company details | hireloop",
};

export default async function CompanyDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let result: CompanyDetails | null = null;
  let loadError = false;
  try {
    result = await fetchCompany(slug);
  } catch {
    loadError = true;
  }

  if (!loadError && !result) notFound();
  if (loadError) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-6 pb-16 pt-28 text-white">
        <div className="mx-auto max-w-4xl">
          <Link href="/company" className="inline-flex items-center gap-2 text-sm text-[#9ca3af] hover:text-white">
            <ArrowLeft className="size-4" />
            All companies
          </Link>
          <p role="alert" className="mt-8 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">
            Could not load this company right now. Please try again later.
          </p>
        </div>
      </main>
    );
  }
  return <CompanyDetailsView {...result!} />;
}
