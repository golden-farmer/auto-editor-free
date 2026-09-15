"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import type { AppProfile } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/auth/callback"];
const APPROVAL_EXEMPT_PATHS = ["/pending"];
const ACCESS_DENIED_PATHS = ["/access-denied"];
const isDevAuthBypass =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

function hasSite2Access(profile: AppProfile | null) {
  return profile?.app_access === "site2" || profile?.app_access === "both";
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isDevAuthBypass) {
      return;
    }

    if (status === "loading") {
      return;
    }

    const isApiRoute = pathname.startsWith("/api");
    const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
    const isApprovalExempt = APPROVAL_EXEMPT_PATHS.some((path) =>
      pathname.startsWith(path),
    );
    const isAccessDeniedPath = ACCESS_DENIED_PATHS.some((path) =>
      pathname.startsWith(path),
    );

    if (status === "unauthenticated") {
      if (!isPublicPath && !isApiRoute) {
        router.push("/login");
      }
      return;
    }

    if (profile?.status !== "APPROVED") {
      if (!isApprovalExempt && !isApiRoute) {
        router.push("/pending");
      }
      return;
    }

    if (!hasSite2Access(profile)) {
      if (!isAccessDeniedPath && !isApiRoute) {
        router.push("/access-denied");
      }
      return;
    }

    if (
      pathname === "/login" ||
      pathname === "/pending" ||
      pathname === "/access-denied"
    ) {
      router.push("/dashboard");
    }
  }, [pathname, profile, profile?.status, router, status]);

  if (isDevAuthBypass) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated" && pathname !== "/login") {
    return null;
  }

  if (status === "authenticated" && !hasSite2Access(profile)) {
    if (pathname !== "/access-denied") {
      return null;
    }
  }

  if (status === "authenticated" && profile?.status !== "APPROVED") {
    if (pathname !== "/pending") {
      return null;
    }
  }

  return <>{children}</>;
}
