"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  LoaderCircle,
  Save,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { useToast } from "@/components/toast-provider";
import { authClient } from "@/lib/auth-client";
import { ROLE_LABELS, type Role } from "@/lib/roles";

const navigation = {
  recruiter: [
    { label: "Dashboard", href: "/recruiter", icon: BriefcaseBusiness },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: ShieldCheck },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
};

export function AccountProfilePage({
  role,
  name,
  email,
  image,
}: {
  role: Extract<Role, "recruiter" | "admin">;
  name: string;
  email: string;
  image: string | null;
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [fullName, setFullName] = useState(name);
  const [avatarUrl, setAvatarUrl] = useState(image ?? "");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const blobPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    if (!blobPreviewRef.current) {
      setAvatarUrl(image ?? "");
    }
  }, [image]);

  useEffect(() => {
    return () => {
      if (blobPreviewRef.current) {
        URL.revokeObjectURL(blobPreviewRef.current);
      }
    };
  }, []);

  const onAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      showToast("Please choose a JPG or PNG image.", "error");
      event.currentTarget.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      showToast("Avatar must be 4MB or smaller.", "error");
      event.currentTarget.value = "";
      return;
    }

    const previousAvatar = avatarUrl;
    if (blobPreviewRef.current) {
      URL.revokeObjectURL(blobPreviewRef.current);
      blobPreviewRef.current = null;
    }
    const localPreview = URL.createObjectURL(file);
    blobPreviewRef.current = localPreview;
    setAvatarUrl(localPreview);
    setAvatarUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const authHeaders = await (await import("@/lib/api/backend-auth")).getBackendAuthHeaders();
      const response = await fetch("/backend/profile/avatar", {
        method: "POST",
        credentials: "include",
        headers: { ...authHeaders },
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as
        | { data?: { image?: string }; error?: string }
        | null;

      if (!response.ok || !result?.data?.image) {
        throw new Error(result?.error || "Could not upload avatar.");
      }

      await authClient.getSession({ query: { disableCookieCache: true } });
      router.refresh();
      if (blobPreviewRef.current) {
        URL.revokeObjectURL(blobPreviewRef.current);
        blobPreviewRef.current = null;
      }
      setAvatarUrl(result.data.image);
      showToast("Avatar updated.", "success");
    } catch (caught) {
      if (blobPreviewRef.current) {
        URL.revokeObjectURL(blobPreviewRef.current);
        blobPreviewRef.current = null;
      }
      setAvatarUrl(previousAvatar);
      showToast(
        caught instanceof Error ? caught.message : "Could not upload avatar.",
        "error",
      );
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = fullName.trim();
    const normalizedImage = avatarUrl.trim();
    if (!normalizedName) {
      setError("Enter your name.");
      return;
    }
    if (normalizedImage) {
      try {
        const parsed = new URL(normalizedImage);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          throw new Error("Unsupported image URL");
        }
      } catch {
        setError("Enter a valid image URL beginning with http:// or https://.");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const result = await authClient.updateUser({
        name: normalizedName,
        image: normalizedImage || null,
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Could not save your profile.");
      }
      setFullName(normalizedName);
      setAvatarUrl(normalizedImage);
      showToast("Profile updated.", "success");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not save your profile.";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0b0d] p-2.5 text-white sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.25rem)] max-w-[1600px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d10] shadow-2xl sm:min-h-[calc(100vh-2rem)]">
        <aside className="hidden w-[210px] shrink-0 flex-col border-r border-white/[0.07] bg-[#09090b] p-4 lg:flex">
          <Logo className="mb-7 px-1 [&_img]:h-[28px]" />
          <nav className="space-y-1">
            {navigation[role].map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                aria-current={label === "Settings" ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${
                  label === "Settings"
                    ? "bg-[#29292f] text-white"
                    : "text-[#92929b] hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#151519] px-3 py-2.5">
            <Avatar name={fullName || email} image={avatarUrl} />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold">{fullName || email}</p>
              <p className="mt-0.5 text-[9px] text-[#85858e]">{ROLE_LABELS[role]}</p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-white/[0.07] px-4 sm:px-6 lg:justify-end">
            <Logo className="lg:hidden [&_img]:h-[26px]" />
            <div className="flex items-center gap-2.5">
              <span className="hidden text-[10px] text-[#85858e] sm:block">
                {ROLE_LABELS[role]}
              </span>
              <Avatar name={fullName || email} image={avatarUrl} />
              <span className="hidden max-w-[170px] truncate text-xs font-medium sm:block">
                {fullName || email}
              </span>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-6 sm:pt-7">
            <Link
              href={role === "admin" ? "/admin" : "/recruiter"}
              className="inline-flex items-center gap-1.5 text-[10px] text-[#92929b] transition hover:text-white"
            >
              <ArrowLeft className="size-3.5" />
              Back to dashboard
            </Link>
            <div className="mt-4">
              <h1 className="text-[22px] font-semibold tracking-tight">Profile settings</h1>
              <p className="mt-1 text-[11px] text-[#85858e]">
                Update the name and avatar shown in your {ROLE_LABELS[role]} dashboard.
              </p>
            </div>

            <form
              onSubmit={(event) => void saveProfile(event)}
              className="mt-6 max-w-2xl rounded-xl border border-white/[0.07] bg-[#131317] p-4 sm:p-6"
            >
              <div className="flex items-center gap-3 border-b border-white/[0.07] pb-5">
                <Avatar name={fullName || email} image={avatarUrl} large />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{fullName || email}</p>
                  <p className="mt-1 text-[10px] text-[#85858e]">
                    {ROLE_LABELS[role]} · {email}
                  </p>
                  <div className="mt-2">
                    <label className={`inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 px-2.5 text-[10px] font-medium text-white transition hover:bg-white/[0.05] ${avatarUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                      {avatarUploading && <LoaderCircle className="size-3 animate-spin" />}
                      {avatarUploading ? "Uploading..." : "Change Avatar"}
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="sr-only"
                        disabled={avatarUploading}
                        onChange={(event) => {
                          void onAvatarChange(event);
                        }}
                      />
                    </label>
                    <p className="mt-1.5 text-[9px] text-[#777781]">
                      JPG or PNG. Max 4MB.
                    </p>
                  </div>
                </div>
              </div>

              {error ? (
                <p role="alert" className="mt-4 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-[11px] text-rose-200">
                  {error}
                </p>
              ) : null}

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-medium text-[#c8c8d0]">Full name</span>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.currentTarget.value)}
                    required
                    maxLength={100}
                    autoComplete="name"
                    className="h-10 w-full rounded-lg border border-white/[0.09] bg-[#0e0e12] px-3 text-xs outline-none transition focus:border-violet-400/40"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-medium text-[#c8c8d0]">Avatar image URL</span>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.currentTarget.value)}
                    placeholder="https://example.com/avatar.png"
                    className="h-10 w-full rounded-lg border border-white/[0.09] bg-[#0e0e12] px-3 text-xs outline-none transition focus:border-violet-400/40"
                  />
                  <span className="mt-1.5 block text-[9px] text-[#777781]">
                    Leave blank to use your initials instead.
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-medium text-[#c8c8d0]">Email</span>
                  <input
                    value={email}
                    readOnly
                    className="h-10 w-full rounded-lg border border-white/[0.06] bg-[#101014] px-3 text-xs text-[#85858e] outline-none"
                  />
                  <span className="mt-1.5 block text-[9px] text-[#777781]">
                    Email changes are managed separately for account security.
                  </span>
                </label>
              </div>

              <div className="mt-6 flex justify-end border-t border-white/[0.07] pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-[10px] font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <LoaderCircle className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  {saving ? "Saving…" : "Save profile"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function Avatar({
  name,
  image,
  large = false,
}: {
  name: string;
  image: string;
  large?: boolean;
}) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#24242b] font-semibold text-white ${large ? "size-14 text-base" : "size-8 text-[10px]"}`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U"
      )}
    </span>
  );
}
