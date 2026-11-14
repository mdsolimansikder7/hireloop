import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getJob } from "@/lib/api/jobs";
import { JobHeader } from "@/components/jobs/details/JobHeader";
import { JobStats } from "@/components/jobs/details/JobStats";
import { JobDescription } from "@/components/jobs/details/JobDescription";
import { CompanyOverview } from "@/components/jobs/details/CompanyOverview";

interface JobDetailsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: JobDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const headerList = await headers();
  const cookie = headerList.get("cookie") ?? "";

  const job = await getJob(id, { cookie });
  if (!job) {
    return {
      title: "Job Not Found | hireloop",
    };
  }

  const rawDesc = job.description ?? "";
  const cleanDesc =
    rawDesc.length > 150 ? `${rawDesc.slice(0, 147).trim()}...` : rawDesc;

  return {
    title: `${job.title} at ${job.companyName ?? "hireloop"} | hireloop`,
    description: cleanDesc,
  };
}

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const { id } = await params;
  const headerList = await headers();
  const cookie = headerList.get("cookie") ?? "";

  const job = await getJob(id, { cookie });

  if (!job) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto w-full max-w-[1100px] px-6 pt-28 pb-20">
        <JobHeader job={job} />

        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_300px]">
          {/* Left Column (~2/3) */}
          <div className="flex flex-col gap-6">
            <JobStats job={job} />
            <JobDescription job={job} />
          </div>

          {/* Right Column (~1/3): Company Overview card (sticky on desktop) */}
          <div className="lg:sticky lg:top-28">
            <CompanyOverview
              companyOverview={job.companyOverview}
              companyName={job.companyName}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
