import type { Metadata } from "next";

import { CompanyDirectory } from "@/components/companies/company-directory";
import { fetchCompanies, type CompanySummary } from "@/lib/api/jobs";

export const metadata: Metadata = {
  title: "Companies | hireloop",
};

export default async function CompanyPage() {
  let companies: CompanySummary[] = [];
  let error: string | undefined;
  try {
    companies = await fetchCompanies();
  } catch {
    error = "Could not load companies. Please try again later.";
  }
  return <CompanyDirectory companies={companies} error={error} />;
}
