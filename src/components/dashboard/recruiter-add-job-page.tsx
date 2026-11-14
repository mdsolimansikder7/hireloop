"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MapPin,
  Settings,
  Upload,
  Users,
  Wifi,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/toast-provider";
import { createJob, updateJob, type JobType } from "@/lib/api/jobs";

const navigation = [
  { label: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { label: "Add Job", href: "/recruiter/jobs/new", icon: BriefcaseBusiness },
  { label: "Manage Jobs", href: "/recruiter/jobs", icon: FileText },
  { label: "Applications", href: "/recruiter/applications", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

const categories = [
  "Engineering & Tech",
  "Design",
  "Product",
  "Marketing",
  "Sales",
  "Customer Support",
  "Finance",
  "Human Resources",
  "Operations",
  "Other",
];
const jobTypes: JobType[] = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
const frequencies = ["per year", "per month", "per hour"];

export function RecruiterAddJobPage({
  name,
  image,
  companyName,
  editId,
}: {
  name: string;
  image: string | null;
  companyName: string;
  editId: string | null;
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState(companyName);
  const [category, setCategory] = useState(categories[0]);
  const [type, setType] = useState<JobType>("Full-time");
  const [remote, setRemote] = useState(false);
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [salaryFrequency, setSalaryFrequency] = useState("per year");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [loadingJob, setLoadingJob] = useState(Boolean(editId));
  const [jobLoadFailed, setJobLoadFailed] = useState(false);

  useEffect(() => {
    if (!editId) return;
    const loadJob = async () => {
      try {
        const response = await fetch(`/api/recruiter/jobs/${editId}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const result = (await response.json()) as
          | {
              data: {
                title: string;
                companyName: string;
                category: string;
                type: string;
                remote: boolean;
                location: string;
                applicationDeadline: string;
                salaryMin: number | null;
                salaryMax: number | null;
                currency: string;
                salaryFrequency: string;
                responsibilities: string[];
                requirements: string[];
              };
            }
          | { error: string };
        if (!response.ok || !("data" in result)) {
          throw new Error("error" in result ? result.error : "Could not load this job.");
        }
        const job = result.data;
        setTitle(job.title);
        setCompany(job.companyName);
        if (categories.includes(job.category)) setCategory(job.category);
        if (jobTypes.includes(job.type as JobType)) setType(job.type as JobType);
        setRemote(job.remote);
        setLocation(job.location);
        setDeadline(job.applicationDeadline);
        setSalaryMin(job.salaryMin?.toString() ?? "");
        setSalaryMax(job.salaryMax?.toString() ?? "");
        setCurrency(job.currency);
        if (frequencies.includes(job.salaryFrequency)) {
          setSalaryFrequency(job.salaryFrequency);
        }
        setResponsibilities(job.responsibilities.join("\n"));
        setRequirements(job.requirements.join("\n"));
      } catch (caught) {
        setJobLoadFailed(true);
        setError(caught instanceof Error ? caught.message : "Could not load this job.");
      } finally {
        setLoadingJob(false);
      }
    };
    void loadJob();
  }, [editId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const min = salaryMin ? Number(salaryMin) : null;
    const max = salaryMax ? Number(salaryMax) : null;

    if (min !== null && max !== null && min > max) {
      setError("Minimum salary cannot be higher than maximum salary.");
      return;
    }

    const responsibilityList = responsibilities
      .split(/\n/)
      .map((item) => item.trim().replace(/^[-•]\s*/, ""))
      .filter(Boolean);
    const requirementList = requirements
      .split(/\n/)
      .map((item) => item.trim().replace(/^[-•]\s*/, ""))
      .filter(Boolean);

    setBusy(true);
    try {
      const input = {
        title: title.trim(),
        description: [
          `Responsibilities:\n${responsibilityList.join("\n")}`,
          `Requirements:\n${requirementList.join("\n")}`,
        ].join("\n\n"),
        companyName: company.trim(),
        category,
        type,
        remote,
        location: remote ? location.trim() || "Remote" : location.trim(),
        applicationDeadline: deadline,
        salaryMin: min,
        salaryMax: max,
        currency,
        salaryFrequency,
        responsibilities: responsibilityList,
        requirements: requirementList,
      };
      if (editId) await updateJob(editId, input);
      else await createJob(input);
      showToast(editId ? "Job post updated" : "Job posted successfully", "success");
      router.push("/recruiter/jobs");
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : "Could not publish job.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setSigningOut(true);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        showToast(result.error.message ?? "Could not log out.", "error");
        setSigningOut(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "Could not log out.", "error");
      setSigningOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0b0d] p-2.5 text-white sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.25rem)] max-w-[1600px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d10] shadow-2xl sm:min-h-[calc(100vh-2rem)]">
        <aside className="hidden w-[210px] shrink-0 flex-col border-r border-white/[0.07] bg-[#09090b] p-4 lg:flex">
          <Logo className="mb-7 px-1 [&_img]:h-[28px]" />
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#151519] px-3 py-2.5">
            <Avatar name={name} image={image} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{name}</p>
              <p className="mt-0.5 text-[10px] text-[#85858e]">Recruiter</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navigation.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                aria-current={label === "Add Job" ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${
                  label === "Add Job"
                    ? "bg-[#29292f] text-white"
                    : "text-[#92929b] hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={signingOut}
            className="mt-auto flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-[#92929b] transition hover:bg-white/[0.05] hover:text-white disabled:opacity-60"
          >
            <LogOut className="size-4" />
            {signingOut ? "Logging out…" : "Log out"}
          </button>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-white/[0.07] px-4 sm:px-6">
            <Logo className="lg:hidden [&_img]:h-[26px]" />
            <Link
              href="/recruiter/jobs"
              className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-[#aaaab3] transition hover:text-white"
            >
              <ArrowLeft className="size-3.5" />
              Back to Job Posts
            </Link>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-5 sm:px-6 sm:pt-6">
            <form onSubmit={submit} className="mx-auto max-w-[1040px]">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] text-[#85858e]">
                    <Link href="/recruiter/jobs" className="hover:text-white">Manage Jobs</Link>
                    <span className="px-1.5">›</span>
                    <span>Job Listings &amp; Postings</span>
                    <span className="px-1.5">›</span>
                    <span className="text-[#b8b8c0]">
                      {editId ? "Update Job Post" : "Create New Listing"}
                    </span>
                  </p>
                  <h1 className="mt-1 text-[21px] font-semibold tracking-tight sm:text-[24px]">
                    {editId ? "Update Job Post" : "Post a New Job"}
                  </h1>
                  <p className="mt-1 text-[10px] text-[#85858e]">
                    {editId
                      ? "Modify your job specifications, compensation range, and candidate requirements."
                      : "Fill in the position specifications to attract qualified talent across our network."}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={busy || loadingJob || jobLoadFailed}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-[10px] font-semibold text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {busy || loadingJob ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : editId ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Upload className="size-3.5" />
                  )}
                  {loadingJob
                    ? "Loading…"
                    : jobLoadFailed
                      ? "Could not load job"
                      : editId
                        ? "Update Job"
                        : "Publish Job"}
                </button>
              </div>

              {error && (
                <p role="alert" className="mb-4 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-xs text-rose-200">
                  {error}
                </p>
              )}

              <FormSection number="1" title="Basic Information">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Job Title" required className="sm:col-span-2">
                    <input
                      required
                      maxLength={120}
                      value={title}
                      onChange={(event) => setTitle(event.currentTarget.value)}
                      placeholder="e.g. Frontend Developer"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Company Name" required>
                    <input
                      required
                      maxLength={120}
                      value={company}
                      onChange={(event) => setCompany(event.currentTarget.value)}
                      placeholder="Your company"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Job Category" required>
                    <Select
                      value={category}
                      onChange={setCategory}
                      options={
                        categories.includes(category)
                          ? categories
                          : [category, ...categories]
                      }
                    />
                  </Field>
                  <Field label="Job Type" required className="sm:col-span-2">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {jobTypes.map((jobType) => (
                        <button
                          key={jobType}
                          type="button"
                          aria-pressed={type === jobType}
                          onClick={() => setType(jobType)}
                          className={`h-9 rounded-lg border text-[10px] transition ${
                            type === jobType
                              ? "border-violet-400/50 bg-violet-400/[0.08] text-white"
                              : "border-white/[0.06] bg-[#17171b] text-[#a3a3ad] hover:border-white/15 hover:text-white"
                          }`}
                        >
                          {jobType}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </FormSection>

              <FormSection number="2" title="Location, Compensation & Timeline">
                <button
                  type="button"
                  role="switch"
                  aria-checked={remote}
                  onClick={() => setRemote((current) => !current)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#17171b] px-3 py-2.5 text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="grid size-7 place-items-center rounded-md bg-violet-400/10 text-violet-300">
                      <Wifi className="size-3.5" />
                    </span>
                    <span>
                      <span className="block text-[10px] font-medium">Remote Work Allowed</span>
                      <span className="mt-0.5 block text-[9px] text-[#777781]">Enable worldwide or distributed candidate applications</span>
                    </span>
                  </span>
                  <span className={`relative h-4 w-7 rounded-full transition ${remote ? "bg-violet-500" : "bg-[#3a3a42]"}`}>
                    <span className={`absolute top-0.5 size-3 rounded-full bg-white transition ${remote ? "left-3.5" : "left-0.5"}`} />
                  </span>
                </button>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label={remote ? "Location (optional)" : "Job Location"} required={!remote}>
                    <span className="relative block">
                      <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#777781]" />
                      <input
                        required={!remote}
                        maxLength={120}
                        value={location}
                        onChange={(event) => setLocation(event.currentTarget.value)}
                        placeholder={remote ? "Remote / New York, USA" : "City, Country"}
                        className={`${inputClass} pl-8`}
                      />
                    </span>
                  </Field>
                  <Field label="Application Deadline">
                    <input
                      type="date"
                      value={deadline}
                      onChange={(event) => setDeadline(event.currentTarget.value)}
                      className={`${inputClass} [color-scheme:dark]`}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                    <Field label="Min Salary / Rate">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={salaryMin}
                        onChange={(event) => setSalaryMin(event.currentTarget.value)}
                        placeholder="Optional"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Max Salary / Rate">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={salaryMax}
                        onChange={(event) => setSalaryMax(event.currentTarget.value)}
                        placeholder="Optional"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <Field label="Currency">
                    <Select
                      value={currency}
                      onChange={setCurrency}
                      options={["USD", "EUR", "GBP", "BDT", "CAD", "AUD"]}
                    />
                  </Field>
                  <Field label="Frequency">
                    <Select value={salaryFrequency} onChange={setSalaryFrequency} options={frequencies} />
                  </Field>
                </div>
              </FormSection>

              <FormSection number="3" title="Responsibilities & Requirements">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Key Responsibilities" required>
                    <textarea
                      required
                      rows={5}
                      value={responsibilities}
                      onChange={(event) => setResponsibilities(event.currentTarget.value)}
                      placeholder={"Describe the work and expected outcomes.\nYou can use one responsibility per line."}
                      className={`${inputClass} h-auto min-h-28 resize-y py-2.5 leading-relaxed`}
                    />
                  </Field>
                  <Field label="Qualifications & Requirements" required>
                    <textarea
                      required
                      rows={5}
                      value={requirements}
                      onChange={(event) => setRequirements(event.currentTarget.value)}
                      placeholder={"List the required skills and experience.\nUse one requirement per line."}
                      className={`${inputClass} h-auto min-h-28 resize-y py-2.5 leading-relaxed`}
                    />
                  </Field>
                </div>
              </FormSection>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                <p className="text-[9px] text-[#777781]">
                  {editId
                    ? "Review your changes before updating this listing."
                    : "Review the details before publishing your listing."}
                </p>
                <div className="flex gap-2">
                  <Link href="/recruiter/jobs" className="inline-flex h-9 items-center rounded-lg border border-white/[0.1] px-3 text-[10px] text-[#b8b8c0] hover:bg-white/[0.04]">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={busy || loadingJob || jobLoadFailed}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-[10px] font-semibold text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60"
                  >
                    {busy || loadingJob ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <Check className="size-3.5" />
                    )}
                    {loadingJob
                      ? "Loading…"
                      : jobLoadFailed
                        ? "Could not load job"
                        : editId
                          ? "Update Job"
                          : "Publish Job"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

const inputClass =
  "h-9 w-full rounded-lg border border-white/[0.07] bg-[#17171b] px-3 text-[10px] text-white outline-none placeholder:text-[#686872] focus:border-violet-400/40";

function FormSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-3 rounded-xl border border-white/[0.06] bg-[#111114] p-4 sm:p-5">
      <h2 className="mb-4 flex items-center gap-2 text-[11px] font-semibold sm:text-xs">
        <span className="text-violet-400">{number}.</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  required = false,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-[9px] text-[#b5b5be]">
        {label}
        {required && <span className="ml-1 text-rose-300">*</span>}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <span className="relative block">
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className={`${inputClass} appearance-none pr-8`}
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#17171b]">
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#777781]" />
    </span>
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#24242b] text-[10px] font-semibold text-white">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        name
          .split(/\s+/)
          .filter(Boolean)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "R"
      )}
    </span>
  );
}
