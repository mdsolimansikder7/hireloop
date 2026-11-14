import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { canAccess, getRole, redirectForRole } from "@/lib/roles";

const PROTECTED_PREFIXES = ["/dashboard", "/recruiter", "/admin", "/settings"];

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await request.headers,
  });

  const { pathname } = request.nextUrl;

  if (
    session &&
    (session.user as { suspended?: boolean }).suspended === true &&
    pathname !== "/account-suspended"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/account-suspended";
    return NextResponse.redirect(url);
  }

  const isAuthPage = pathname === "/signin" || pathname === "/signup";
  const isOnboarding = pathname === "/onboarding/role";
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!session) {
    if (isProtected || isOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const role = getRole(session.user);
  const onboarded = session.user.onboardingComplete === true;

  const roleHome = redirectForRole(role);

  if (!onboarded) {
    // /signin, /signup and /onboarding/role are exempt from the onboarding
    // redirect, so social/legacy users can complete onboarding once without
    // redirect loops or blank pages.
    if (!isAuthPage && !isOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding/role";
      return NextResponse.redirect(url);
    }
  } else if (isOnboarding) {
    const url = request.nextUrl.clone();
    url.pathname = roleHome;
    return NextResponse.redirect(url);
  } else if (isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = roleHome;
    return NextResponse.redirect(url);
  }

  if (isProtected && !canAccess(role, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = roleHome;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/signin",
    "/signup",
    "/",
    "/onboarding/role",
    "/dashboard/:path*",
    "/recruiter/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};
