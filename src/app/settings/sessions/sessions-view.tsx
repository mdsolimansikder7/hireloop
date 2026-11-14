"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LoaderCircleIcon,
  LogOutIcon,
  MonitorIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
} from "lucide-react";

import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

type ListedSession = {
  token: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  expiresAt: string | Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatDateTime(value: string | Date): string {
  return toDate(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatExpiry(value: string | Date): string {
  const ms = toDate(value).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  if (ms >= 86_400_000) {
    const days = Math.floor(ms / 86_400_000);
    return `${days}d ${Math.floor((ms % 86_400_000) / 3_600_000)}h left`;
  }
  if (ms >= 3_600_000) {
    return `${Math.floor(ms / 3_600_000)}h left`;
  }
  return `${Math.max(1, Math.floor(ms / 60_000))}m left`;
}

function describeDevice(userAgent: string | null | undefined): {
  label: string;
  portable: boolean;
} {
  if (!userAgent) return { label: "Unknown device", portable: false };

  const ua = userAgent.toLowerCase();

  const portable = /iphone|ipad|ipod|android|tablet|mobile/.test(ua);

  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("chrome") && !ua.includes("edg")
      ? "Chrome"
      : ua.includes("firefox")
        ? "Firefox"
        : ua.includes("safari") && !ua.includes("chrome")
          ? "Safari"
          : "Browser";

  const os = /windows/.test(ua)
    ? "Windows"
    : /android/.test(ua)
      ? "Android"
      : /iphone|ipad|ipod/.test(ua)
        ? "iOS"
        : /mac os|macintosh/.test(ua)
          ? "macOS"
          : /linux/.test(ua)
            ? "Linux"
            : null;

  return { label: os ? `${browser} on ${os}` : browser, portable };
}

export function SessionsView() {
  const { data: session } = useSession();
  const currentToken = session?.session.token;

  const [sessions, setSessions] = useState<ListedSession[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyToken, setBusyToken] = useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const loadSessions = useCallback(() => {
    return authClient.listSessions().then(
      ({ data, error }) => {
        if (error) {
          setLoadError(error.message ?? "Could not load your sessions.");
          setSessions(null);
          return;
        }
        setLoadError(null);
        setSessions(
          (data ?? []).map((item) => ({
            token: item.token,
            createdAt: item.createdAt as string | Date,
            updatedAt: item.updatedAt as string | Date,
            expiresAt: item.expiresAt as string | Date,
            ipAddress: item.ipAddress ?? null,
            userAgent: item.userAgent ?? null,
          })),
        );
      },
      () => {
        setLoadError("Could not load your sessions.");
        setSessions(null);
      },
    );
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const refresh = loadSessions;

  const revoke = async (token: string) => {
    setActionError(null);
    setBusyToken(token);
    const { error } = await authClient.revokeSession({ token });
    setBusyToken(null);
    if (error) {
      setActionError(error.message ?? "Could not revoke the session.");
      return;
    }
    await refresh();
  };

  const revokeOthers = async () => {
    setActionError(null);
    setSigningOutAll(true);
    const { error } = await authClient.revokeOtherSessions();
    setSigningOutAll(false);
    if (error) {
      setActionError(error.message ?? "Could not sign out other devices.");
      return;
    }
    await refresh();
  };

  const loading = sessions === null && !loadError;
  const others = sessions
    ? sessions.filter((s) => s.token !== currentToken)
    : [];

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 pt-10 pb-16 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[#8b84f7]">
        Account security
      </p>
      <h1 className="mt-2 text-[28px] font-medium tracking-tight text-white">
        Active sessions
      </h1>
      <p className="mt-2 text-sm text-[#9ca3af]">
        Devices currently signed in to your HireLoop account. Sessions expire
        after 7 days.
      </p>

      <div className="mt-6 flex items-center gap-2">
        <Button
          variant="outline"
          className="h-9 rounded-lg border-white/15 bg-transparent px-3 text-sm font-medium text-white hover:bg-white/5 hover:text-white"
          disabled={loading}
          onClick={() => void refresh()}
        >
          <RefreshCwIcon
            className={loading ? "size-4 animate-spin text-white/60" : "size-4"}
          />
          Refresh
        </Button>
        {others.length > 0 && (
          <Button
            variant="outline"
            className="h-9 rounded-lg border-[#5b4ff5]/40 bg-[#5b4ff5]/10 px-3 text-sm font-medium text-[#c7d2ff] hover:bg-[#5b4ff5]/20 hover:text-white"
            disabled={signingOutAll}
            onClick={() => void revokeOthers()}
          >
            {signingOutAll ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <LogOutIcon className="size-4" />
            )}
            Sign out all other devices
          </Button>
        )}
      </div>

      {actionError && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {actionError}
        </p>
      )}

      {loadError && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {loadError}
        </p>
      )}

      {loading ? (
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              aria-hidden="true"
              className="h-24 animate-pulse rounded-2xl border border-white/[0.06] bg-[#222222]/60"
            />
          ))}
        </div>
      ) : (
        sessions &&
        (sessions.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-white/[0.06] bg-[#222222]/60 px-4 py-8 text-center text-sm text-[#9ca3af]">
            No active sessions.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {sessions.map((entry) => {
              const isCurrent = entry.token === currentToken;
              const device = describeDevice(entry.userAgent);

              return (
                <li
                  key={entry.token}
                  className={
                    isCurrent
                      ? "rounded-2xl border border-[#5b4ff5]/40 bg-[#222222]/95 px-4 py-4 shadow-[0_12px_40px_-16px_rgba(92,83,254,0.5)]"
                      : "rounded-2xl border border-white/[0.06] bg-[#222222]/60 px-4 py-4"
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={
                          isCurrent
                            ? "grid size-9 shrink-0 place-items-center rounded-xl border border-[#5b4ff5]/40 bg-[#5b4ff5]/15 text-[#c7d2ff]"
                            : "grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-[#111] text-[#9ca3af]"
                        }
                      >
                        {device.portable ? (
                          <SmartphoneIcon className="size-4" />
                        ) : (
                          <MonitorIcon className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {device.label}
                          </span>
                          {isCurrent && (
                            <span className="rounded-full border border-[#5b4ff5]/40 bg-[#5b4ff5]/15 px-2 py-0.5 text-[10px] font-medium text-[#c7d2ff] uppercase tracking-wide">
                              This device
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-col gap-0.5 text-xs text-[#9ca3af]">
                          <span>
                            Signed in {formatDateTime(entry.createdAt)}
                          </span>
                          <span>
                            IP {entry.ipAddress || "unknown"} ·{" "}
                            {formatExpiry(entry.expiresAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-[#c7d2ff]">
                        <ShieldCheckIcon className="size-4" />
                        Active
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        className="h-8 shrink-0 rounded-lg border-white/15 bg-transparent px-3 text-xs font-medium text-white hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                        disabled={busyToken === entry.token}
                        onClick={() => void revoke(entry.token)}
                      >
                        {busyToken === entry.token ? (
                          <LoaderCircleIcon className="size-3.5 animate-spin" />
                        ) : (
                          <LogOutIcon className="size-3.5" />
                        )}
                        Revoke
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ))
      )}
    </main>
  );
}
