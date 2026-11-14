"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import { Logo } from "@/components/logo";
import { useSession } from "@/lib/auth-client";
import { ROLE_LABELS, getRole, redirectForRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { label: "Browse Jobs", href: "/jobs" },
  { label: "Company", href: "/company" },
  { label: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  const sessionRole = session ? getRole(session.user) : "seeker";
  const roleHome = redirectForRole(sessionRole);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/saved-jobs") ||
    pathname.startsWith("/applications") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/recruiter") ||
    pathname.startsWith("/admin") ||
    pathname === "/settings"
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-4">
      <div className="relative mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-6 rounded-2xl border border-white/[0.06] bg-[#222222]/95 px-4 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.9)] backdrop-blur-md sm:px-6">
        <Logo />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-white",
                  isActive(link.href)
                    ? "text-white underline decoration-white/70 underline-offset-4"
                    : "text-[#e7e7e7]",
                )}
              >
                {link.label}
              </Link>
            ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          {!isPending ? (
            <Separator
              orientation="vertical"
              className="hidden h-5 self-center bg-white/15 md:block"
            />
          ) : null}

          {isPending ? null : session ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span
                className="hidden rounded-full border border-[#5b4ff5]/40 bg-[#5b4ff5]/15 px-2 py-0.5 text-[11px] font-medium text-[#c7d2ff] sm:inline-block"
              >
                {ROLE_LABELS[sessionRole]}
              </span>
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#111] text-sm font-semibold text-[#c7bfff]" aria-hidden="true">
                {session.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" className="size-full object-cover" />
                ) : (
                  (session.user?.name?.charAt(0) ?? session.user?.email?.charAt(0) ?? "?").toUpperCase()
                )}
              </span>
              <span className="hidden max-w-[130px] truncate text-sm font-medium text-white sm:inline-block">
                {session.user?.name ?? session.user?.email}
              </span>
              <Button
                variant="ghost"
                nativeButton={false}
                className="h-9 rounded-lg px-3 text-sm font-medium text-[#8b84f7] hover:bg-transparent hover:text-[#b3adff]"
                render={<Link href={roleHome} />}
              >
                Dashboard
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                nativeButton={false}
                className="hidden h-9 rounded-lg px-3 text-sm font-medium text-[#8b84f7] hover:bg-transparent hover:text-[#b3adff] md:inline-flex"
                render={<Link href="/signin" />}
              >
                Sign In
              </Button>

              <Button
                nativeButton={false}
                className="h-9 rounded-lg bg-[#5c53fe] px-4 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(92,83,254,0.9)] hover:bg-[#6d64ff]"
                render={<Link href="/signup" />}
              >
                Get Started
              </Button>
            </>
          )}

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 md:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <MenuIcon />
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[300px] border-white/10 bg-[#1b1b1b] text-white"
            >
              <SheetHeader className="border-b border-white/10">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo />
              </SheetHeader>

              <nav className="flex flex-col gap-1 px-2">
                {navLinks.map((link) => (
                  <SheetClose
                    key={link.href}
                    nativeButton={false}
                    render={<Link href={link.href} />}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/5 hover:text-white",
                      isActive(link.href)
                        ? "text-white underline decoration-white/70 underline-offset-2"
                        : "text-white/80",
                    )}
                  >
                    {link.label}
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-2 border-t border-white/10 p-4">
                {session ? (
                  <>
                    <div className="flex items-center gap-2 px-1 py-1">
                      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#111] text-sm font-semibold text-[#c7bfff]">
                        {session.user?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={session.user.image} alt="" className="size-full object-cover" />
                        ) : (
                          (session.user?.name?.charAt(0) ?? session.user?.email?.charAt(0) ?? "?").toUpperCase()
                        )}
                      </span>
                      <span className="truncate text-sm font-medium text-white">
                        {session.user?.name ?? session.user?.email}
                      </span>
                      <span className="ml-auto rounded-full border border-[#5b4ff5]/40 bg-[#5b4ff5]/15 px-2 py-0.5 text-[10px] font-medium text-[#c7d2ff]">
                        {ROLE_LABELS[sessionRole]}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      nativeButton={false}
                      className="h-10 rounded-lg border-white/15 bg-transparent text-white hover:bg-white/5 hover:text-white"
                      render={<Link href={roleHome} />}
                    >
                      Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      nativeButton={false}
                      className="h-10 rounded-lg border-white/15 bg-transparent text-white hover:bg-white/5 hover:text-white"
                      render={<Link href="/signin" />}
                    >
                      Sign In
                    </Button>
                    <Button
                      nativeButton={false}
                      className="h-10 rounded-lg bg-[#5c53fe] text-white hover:bg-[#6d64ff]"
                      render={<Link href="/signup" />}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
