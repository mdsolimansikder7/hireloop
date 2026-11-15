import type { Metadata } from "next";
import { headers } from "next/headers";

import { getJob } from "@/lib/api/jobs";
import { JobDetails } from "@/components/jobs/JobDetails";

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

export default async function DashboardJobDetailsPage({
  params,
}: JobDetailsPageProps) {
  const { id } = await params;

  return (
    <JobDetails jobId={id} backHref="/dashboard/jobs" />
  );
}