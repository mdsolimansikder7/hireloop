"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { getJob, fetchAppliedJobIds, fetchSavedJobIds, toggleSavedJob, applyToJob } from "@/lib/api/jobs";
import { useSession } from "@/lib/auth-client";
import { getRole } from "@/lib/roles";
import { useToast } from "@/components/toast-provider";

import { JobHeader } from "@/components/jobs/details/JobHeader";
import { JobStats } from "@/components/jobs/details/JobStats";
import { JobDescription } from "@/components/jobs/details/JobDescription";
import { CompanyOverview } from "@/components/jobs/details/CompanyOverview";
import { BackToJobsButton } from "@/components/jobs/details/BackToJobsButton";

import type { Job } from "@/lib/api/jobs";

interface JobDetailsProps {
  jobId: string;
  backHref: string;
}

export function JobDetails({ jobId, backHref }: JobDetailsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [job, setJob] = React.useState<Job | null>(null);
  const [hasApplied, setHasApplied] = React.useState(false);
  const [savedIds, setSavedIds] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedJob = await getJob(jobId);
        if (!fetchedJob) {
          if (!cancelled) setError("Job not found");
          return;
        }

        if (!cancelled) {
          setJob(fetchedJob);
        }

        // Fetch applied job IDs if user is a seeker
        const userRole = session ? getRole(session.user) : null;
        if (userRole === "seeker") {
          try {
            const appliedIds = await fetchAppliedJobIds();
            if (!cancelled) setHasApplied(appliedIds.includes(jobId));
          } catch {
            // Keep hasApplied false on error
          }
        }

        // Fetch saved job IDs if user is signed in
        if (session?.user?.id) {
          try {
            const savedIdsList = await fetchSavedJobIds();
            if (!cancelled) setSavedIds(new Set(savedIdsList));
          } catch {
            // Keep savedIds empty on error
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load job details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadJob();

    return () => { cancelled = true; };
  }, [jobId, session]);

  // Handle save toggle from JobHeader's SaveJobButton
  const handleToggleSave = React.useCallback(async (jId: string, saved: boolean) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (saved) next.add(jId); else next.delete(jId);
      return next;
    });
    try {
      const nowSaved = await toggleSavedJob(jId, saved);
      setSavedIds(prev => {
        const next = new Set(prev);
        if (nowSaved) next.add(jId); else next.delete(jId);
        return next;
      });
      showToast(nowSaved ? "Job saved" : "Job removed from saved jobs", "success");
    } catch (err) {
      setSavedIds(prev => {
        const next = new Set(prev);
        if (saved) next.add(jId); else next.delete(jId);
        return next;
      });
      showToast(err instanceof Error ? err.message : "Could not update saved job", "error");
    }
  }, [showToast]);

  // Handle apply from JobHeader's ApplyButton
  const handleApply = React.useCallback(async (jId: string) => {
    try {
      const res = await applyToJob(jId);
      if (res.alreadyApplied) {
        setHasApplied(true);
        showToast("Already applied for this job", "info");
      } else {
        setHasApplied(true);
        showToast("Application submitted", "success");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to apply";
      showToast(msg, "error");
    }
  }, [showToast]);

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse space-y-8 w-full max-w-3xl">
          <div className="h-8 bg-[#1a1a1a] rounded-lg w-3/4" />
          <div className="h-4 bg-[#1a1a1a] rounded-lg w-1/2" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-[#1a1a1a] rounded-lg" />
            <div className="h-24 bg-[#1a1a1a] rounded-lg" />
            <div className="h-24 bg-[#1a1a1a] rounded-lg" />
            <div className="h-24 bg-[#1a1a1a] rounded-lg" />
          </div>
          <div className="h-32 bg-[#1a1a1a] rounded-lg" />
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center px-6">
          <h2 className="text-2xl font-semibold text-white mb-2">Job Not Found</h2>
          <p className="text-[#9ca3af] mb-6">The job you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <button
            onClick={() => router.push(backHref)}
            className="inline-flex h-10 items-center justify-center rounded-[10px] bg-white px-5 text-sm font-semibold text-black hover:bg-[#e5e5e5] transition-colors"
          >
            Back to jobs
          </button>
        </div>
      </main>
    );
  }

  const jobWithApplied: Job = { ...job, hasApplied, isSaved: savedIds.has(jobId) };

  return (
    <main className="min-h-[calc(100vh-80px)]">
      <div className="max-w-[1100px] mx-auto px-4 pb-16 pt-6">
        <BackToJobsButton basePath={backHref} />
        <JobHeader
          job={jobWithApplied}
          onToggleSave={handleToggleSave}
          onApply={handleApply}
        />
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-6">
            <JobStats job={jobWithApplied} />
            <JobDescription job={jobWithApplied} />
          </div>
          <div className="lg:sticky lg:top-28">
            <CompanyOverview
              companyOverview={jobWithApplied.companyOverview}
              companyName={jobWithApplied.companyName}
            />
          </div>
        </div>
      </div>
    </main>
  );
}