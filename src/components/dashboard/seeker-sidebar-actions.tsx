"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Upload } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/toast-provider";

export function SeekerSidebarActions() {
  const router = useRouter();
  const { showToast } = useToast();
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

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
    <div className="mt-2 space-y-1">
      <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-[#151519] text-xs font-medium text-white transition hover:bg-[#202025]">
        <Upload className="size-4" />
        Post a resume
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="sr-only"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) setResumeName(file.name);
          }}
        />
      </label>
      {resumeName && (
        <p className="truncate px-2 text-[10px] text-[#777781]" title={resumeName}>
          Resume selected: {resumeName}
        </p>
      )}
      <button
        type="button"
        onClick={() => void logout()}
        disabled={signingOut}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-[#92929b] transition hover:bg-white/[0.05] hover:text-white disabled:cursor-wait disabled:opacity-60"
      >
        <LogOut className="size-4" />
        {signingOut ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}
