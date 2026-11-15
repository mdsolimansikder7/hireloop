"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Bookmark,
  CreditCard,
  FileText,
  LayoutDashboard,
  Mail,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { SeekerSidebarActions } from "@/components/dashboard/seeker-sidebar-actions";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/dashboard/jobs", icon: BriefcaseBusiness },
  { label: "Saved Jobs", href: "/saved-jobs", icon: Bookmark },
  { label: "Applications", href: "/applications", icon: FileText },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SeekerShellProps {
  name: string;
  image: string | null;
  children: React.ReactNode;
}

export function SeekerShell({ name, image, children }: SeekerShellProps) {
  const pathname = usePathname();

  return (
    <main className="relative h-dvh overflow-hidden bg-[#0b0b0d] p-2.5 text-white sm:p-4 box-border">
      <div className="relative h-full max-w-[1600px] mx-auto flex rounded-2xl border border-white/[0.07] bg-[#0d0d10] shadow-2xl overflow-hidden">
        <aside className="hidden w-[228px] shrink-0 flex-col border-r border-white/[0.07] bg-[#09090b] h-full lg:flex">
          <div className="flex flex-col h-full p-4">
            <Logo className="mb-7 px-1 [&_img]:h-[28px] shrink-0" />

            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#151519] px-3 py-2.5 shrink-0">
              <Avatar name={name} image={image} />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{name}</p>
                <p className="mt-0.5 text-[10px] text-[#85858e]">Job Seeker</p>
              </div>
            </div>

            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64646d] shrink-0">
              Workspace
            </p>
            <nav className="space-y-1 overflow-y-auto flex-1 pr-1">
              {navigation.map(({ label, href, icon: Icon }) => {
                const isDashboardRoot = href === "/dashboard";
                const isActive = isDashboardRoot
                  ? pathname === "/dashboard"
                  : pathname.startsWith(href);
                return (
                  <Link
                    key={label}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${
                      isActive
                        ? "bg-[#29292f] text-white"
                        : "text-[#92929b] hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto space-y-1 shrink-0 pt-4 border-t border-white/[0.07]">
              <Link
                href="/dashboard/jobs"
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-white text-xs font-semibold text-[#111115] transition hover:bg-[#e8e8ed]"
              >
                <Search className="size-4" />
                Find a job
              </Link>
              <SeekerSidebarActions />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col h-full">
          <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-4 sm:px-6">
            <Logo className="mr-auto [&_img]:h-[26px] lg:hidden" />
            <label className="hidden h-9 w-full max-w-[390px] items-center gap-2 rounded-lg border border-white/[0.08] bg-[#111115] px-3 sm:flex">
              <Search className="size-4 shrink-0 text-[#777781]" />
              <input
                aria-label="Search opportunities"
                placeholder="Search for opportunities..."
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#686872]"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    const query = event.currentTarget.value.trim();
                    window.location.href = query
                      ? `/dashboard/jobs?q=${encodeURIComponent(query)}`
                      : "/dashboard/jobs";
                  }
                }}
              />
            </label>
            <Link
              href="#activity"
              aria-label="Messages and activity"
              className="relative grid size-8 place-items-center rounded-lg text-[#aaaab3] hover:bg-white/[0.06] hover:text-white"
            >
              <Mail className="size-[17px]" />
            </Link>
            <Link
              href="#activity"
              aria-label="Notifications"
              className="relative grid size-8 place-items-center rounded-lg text-[#aaaab3] hover:bg-white/[0.06] hover:text-white"
            >
              <Sparkles className="size-[17px]" />
            </Link>
            <Avatar name={name} image={image} />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-20 pt-6 sm:px-6 sm:pt-7 dashboard-content">
            {children}
          </div>
        </div>
      </div>

      <Link
        href="/dashboard/jobs"
        aria-label="Find a job"
        className="absolute bottom-6 right-6 grid size-12 place-items-center rounded-full bg-white text-[#111115] shadow-lg transition hover:scale-105 hover:bg-[#e8e8ed] z-10"
      >
        <Plus className="size-5" />
      </Link>
    </main>
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#24242b] text-xs font-semibold text-white">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        name
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      )}
    </span>
  );
}