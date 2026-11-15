"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  Gift,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageSquareText,
  Plus,
  Search,
  Settings,
  Sparkles,
  Video,
} from "lucide-react";

type Stats = {
  applications: number;
  interviews: number;
  offers: number;
  savedJobs: number;
};

type Application = {
  id: string | null;
  jobId: string | null;
  jobTitle: string | null;
  companyName: string | null;
  logoUrl: string | null;
  status: string;
  createdAt: string | null;
};

type Interview = {
  id: string;
  jobTitle: string | null;
  companyName: string | null;
  scheduledAt: string | null;
  durationMinutes: number | null;
  mode: string | null;
  meetingLink: string | null;
  location: string | null;
};

type Offer = {
  id: string;
  jobTitle: string | null;
  companyName: string | null;
  salary: number | null;
  currency: string | null;
  expiresAt: string | null;
};

type Activity = {
  id: string;
  type: string | null;
  title: string | null;
  description: string | null;
  jobTitle: string | null;
  companyName: string | null;
  createdAt: string | null;
};

type DashboardPayload = {
  stats: Stats;
  recentApplications: Application[];
  upcomingInterviews: Interview[];
  pendingOffers: Offer[];
  activity: Activity[];
};

function formatRelative(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

function formatDate(value: string | null) {
  if (!value) return "Time to be confirmed";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time to be confirmed"
    : new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
}

function titleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusStyle(status: string) {
  if (status === "offer" || status === "hired") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }
  if (status === "rejected") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-300";
  }
  if (status === "interview" || status === "shortlisted") {
    return "border-sky-400/20 bg-sky-400/10 text-sky-300";
  }
  return "border-white/10 bg-white/[0.04] text-[#aaaab3]";
}

export function SeekerDashboard({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard/seeker", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(result?.error ?? "Could not load your dashboard.");
      }
      const result = (await response.json()) as { data: DashboardPayload };
      setDashboard(result.data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load your dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    const container = contentRef.current;
    const target = document.getElementById(sectionId);
    if (!container || !target) return;

    if (window.location.hash !== `#${sectionId}`) {
      window.history.replaceState(null, "", `#${sectionId}`);
    }

    const top =
      container.scrollTop +
      target.getBoundingClientRect().top -
      container.getBoundingClientRect().top -
      16;
    container.scrollTo({ top, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    if (loading || !window.location.hash) return;
    const sectionId = window.location.hash.slice(1);
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToSection(sectionId);
      });
    });
    return () => window.cancelAnimationFrame(firstFrame);
  }, [loading, scrollToSection]);

  const stats = dashboard?.stats;
  const cards = [
    {
      label: "Saved Jobs",
      value: stats?.savedJobs,
      icon: Bookmark,
      tone: "text-violet-300",
      href: "/saved-jobs",
    },
    {
      label: "Applications Submitted",
      value: stats?.applications,
      icon: ArrowUpRight,
      tone: "text-sky-300",
      href: "#applications",
    },
    {
      label: "Interviews Scheduled",
      value: stats?.interviews,
      icon: CalendarDays,
      tone: "text-amber-300",
      href: "#interviews",
    },
    {
      label: "Offers Received",
      value: stats?.offers,
      icon: Gift,
      tone: "text-emerald-300",
      href: "#offers",
    },
  ];

  return (
    <>
      <div
        ref={contentRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-20 pt-6 sm:px-6 sm:pt-7"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium text-[#92929b]">
              Your career, in one place
            </p>
            <h1 className="mt-1 text-[22px] font-semibold tracking-tight sm:text-[25px]">
              Welcome back, {name.split(" ")[0]}
            </h1>
          </div>
          <Link
            href="/dashboard/jobs"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-[#151519] px-3 text-xs font-medium text-white transition hover:bg-[#202025]"
          >
            Explore jobs <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4"
          >
            <div className="flex items-center gap-2.5 text-sm text-rose-200">
              <CircleAlert className="size-4 shrink-0" />
              {error}
            </div>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="rounded-md border border-rose-200/20 px-3 py-1.5 text-xs text-white hover:bg-rose-200/10"
            >
              Try again
            </button>
          </div>
        ) : null}

        <section aria-label="Dashboard statistics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, tone, href }) => (
            <Link
              href={href}
              onClick={(event) => {
                if (href.startsWith("#")) {
                  event.preventDefault();
                  scrollToSection(href.slice(1));
                }
              }}
              key={label}
              className="group min-h-[92px] rounded-xl border border-white/[0.07] bg-[#131317] p-4 transition hover:border-white/[0.14] hover:bg-[#17171c]"
            >
              <div className="flex items-start justify-between">
                <span className="text-[11px] text-[#92929b]">{label}</span>
                <Icon className={`size-4 ${tone}`} />
              </div>
              <div className="mt-3 text-[24px] font-semibold leading-none tabular-nums">
                {loading && value === undefined ? (
                  <span className="inline-block h-6 w-9 animate-pulse rounded bg-white/10" />
                ) : (
                  value ?? "—"
                )}
              </div>
            </Link>
          ))}
        </section>

        <section
          id="applications"
          className="mt-7 scroll-mt-6"
          aria-labelledby="applications-heading"
        >
          <SectionHeading
            title="Recent Applications"
            href="#applications"
            headingId="applications-heading"
            onNavigate={scrollToSection}
          />
          {loading ? (
            <ListSkeleton />
          ) : error ? null : dashboard?.recentApplications.length ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.07] bg-[#131317]">
              {dashboard.recentApplications.map((application) => (
                <div
                  key={application.id ?? `${application.jobTitle}-${application.createdAt}`}
                  className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3 last:border-b-0 sm:gap-4"
                >
                  <CompanyMark
                    name={application.companyName}
                    image={application.logoUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white">
                      {application.jobTitle ?? "Job title unavailable"}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-[#85858e]">
                      {application.companyName ?? "Company unavailable"}
                      <span className="px-1.5 text-[#55555e]">·</span>
                      {formatRelative(application.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] ${statusStyle(application.status)}`}
                  >
                    {titleCase(application.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No applications yet"
              detail="When you apply for a role, it will show up here."
              href="/dashboard/jobs"
              action="Browse jobs"
            />
          )}
        </section>

        <div className="mt-7 grid gap-6 xl:grid-cols-2">
          <section id="interviews" className="scroll-mt-6">
            <SectionHeading
              title="Upcoming Interviews"
              href="#interviews"
              onNavigate={scrollToSection}
            />
            {loading ? (
              <ListSkeleton rows={2} />
            ) : error ? null : dashboard?.upcomingInterviews.length ? (
              <div className="mt-3 space-y-2.5">
                {dashboard.upcomingInterviews.map((interview) => (
                  <article
                    key={interview.id}
                    className="flex gap-3 rounded-xl border border-white/[0.07] bg-[#131317] p-4"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-400/10 text-sky-300">
                      {interview.mode === "video" ? (
                        <Video className="size-4" />
                      ) : (
                        <CalendarDays className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {interview.jobTitle ?? "Interview"}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-[#85858e]">
                        {interview.companyName ?? "Company unavailable"}
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#b3b3bd]">
                        <Clock3 className="size-3.5 text-sky-300" />
                        {formatDate(interview.scheduledAt)}
                        {interview.durationMinutes
                          ? ` · ${interview.durationMinutes} min`
                          : ""}
                      </p>
                      {interview.location ? (
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#85858e]">
                          <MapPin className="size-3" />
                          {interview.location}
                        </p>
                      ) : null}
                    </div>
                    {interview.meetingLink ? (
                      <a
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="self-center text-[11px] font-medium text-sky-300 hover:text-sky-200"
                      >
                        Join
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No interviews yet"
                detail="Scheduled interviews will appear here."
              />
            )}
          </section>

          <section id="offers" className="scroll-mt-6">
            <SectionHeading
              title="Offers Received"
              href="#offers"
              onNavigate={scrollToSection}
            />
            {loading ? (
              <ListSkeleton rows={2} />
            ) : error ? null : dashboard?.pendingOffers.length ? (
              <div className="mt-3 space-y-2.5">
                {dashboard.pendingOffers.map((offer) => (
                  <article
                    key={offer.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#131317] p-4"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
                      <Gift className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {offer.jobTitle ?? "New job offer"}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-[#85858e]">
                        {offer.companyName ?? "Company unavailable"}
                        {offer.salary !== null
                          ? ` · ${offer.currency ?? ""} ${offer.salary.toLocaleString()}`
                          : ""}
                      </p>
                      {offer.expiresAt ? (
                        <p className="mt-1 text-[10px] text-[#85858e]">
                          Expires {formatDate(offer.expiresAt)}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href="/api/offers/mine"
                      className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 text-[#aaaab3] hover:bg-white/[0.06] hover:text-white"
                      aria-label="View offer"
                    >
                      <ChevronRight className="size-4" />
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Gift}
                title="No offers yet"
                detail="Pending offers from employers will show up here."
              />
            )}
          </section>
        </div>

        <section id="activity" className="mt-7 scroll-mt-6">
          <SectionHeading
            title="Recent Activity"
            href="#activity"
            onNavigate={scrollToSection}
          />
          {loading ? (
            <ListSkeleton rows={3} />
          ) : error ? null : dashboard?.activity.length ? (
            <div className="mt-3 space-y-2">
              {dashboard.activity.map((item) => {
                const Icon =
                  item.type === "job_saved"
                    ? Bookmark
                    : item.type === "interview_scheduled"
                    ? CalendarDays
                    : item.type === "offer_received" ||
                      item.type === "offer_accepted"
                    ? Gift
                    : item.type === "application_status_changed"
                    ? MessageSquareText
                    : Check;
                const iconTone =
                  item.type === "offer_received" ||
                  item.type === "offer_accepted"
                    ? "text-emerald-300 bg-emerald-300/10"
                    : item.type === "interview_scheduled"
                    ? "text-amber-300 bg-amber-300/10"
                    : "text-[#d1d1d8] bg-white/[0.07]";
                return (
                  <article
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-[#131317] px-3.5 py-3"
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full ${iconTone}`}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] text-[#e2e2e7]">
                        {item.description ?? item.title ?? "Account activity"}
                      </p>
                      {item.title && item.description ? (
                        <p className="mt-1 text-[10px] text-[#777781]">
                          {item.title}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[10px] text-[#777781]">
                      {formatRelative(item.createdAt)}
                    </span>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={MessageSquareText}
              title="No activity yet"
              detail="Applications, saved jobs, and updates will appear here."
            />
          )}
        </section>

        {!loading && dashboard?.stats.applications === 0 ? (
          <div className="mt-7 rounded-xl border border-white/[0.07] bg-gradient-to-r from-[#16161d] to-[#111115] p-5 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-violet-300">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Ready for your next move?</p>
                <p className="mt-1 text-xs text-[#92929b]">
                  Explore roles and keep your search moving.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/jobs"
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3.5 text-xs font-semibold text-black hover:bg-[#e8e8ed] sm:mt-0"
            >
              Browse opportunities <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}

function CompanyMark({
  name,
  image,
}: {
  name: string | null;
  image: string | null;
}) {
  return (
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/[0.07] bg-[#1d1d23] text-xs font-semibold text-[#c5c5ce]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        name?.trim().charAt(0).toUpperCase() || <LayoutDashboard className="size-4" />
      )}
    </span>
  );
}

function SectionHeading({
  title,
  href,
  headingId,
  onNavigate,
}: {
  title: string;
  href: string;
  headingId?: string;
  onNavigate: (sectionId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={headingId} className="text-sm font-semibold text-white">
        {title}
      </h2>
      <Link
        href={href}
        onClick={(event) => {
          if (href.startsWith("#")) {
            event.preventDefault();
            onNavigate(href.slice(1));
          }
        }}
        className="text-[10px] text-[#85858e] transition hover:text-white"
      >
        View all
      </Link>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
  href,
  action,
}: {
  icon: typeof FileText;
  title: string;
  detail: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mt-3 flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-[#101013] px-4 py-5 text-center">
      <span className="grid size-8 place-items-center rounded-lg bg-white/[0.05] text-[#92929b]">
        <Icon className="size-4" />
      </span>
      <p className="mt-2 text-xs font-medium text-[#dedee4]">{title}</p>
      <p className="mt-1 text-[10px] text-[#777781]">{detail}</p>
      {href && action ? (
        <Link
          href={href}
          className="mt-2 text-[10px] font-medium text-violet-300 hover:text-violet-200"
        >
          {action}
        </Link>
      ) : null}
    </div>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="mt-3 space-y-2">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex h-[58px] animate-pulse items-center gap-3 rounded-xl border border-white/[0.05] bg-[#131317] px-4"
        >
          <span className="size-9 rounded-lg bg-white/[0.06]" />
          <span className="h-3 w-1/3 rounded bg-white/[0.06]" />
          <span className="ml-auto h-3 w-16 rounded bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}