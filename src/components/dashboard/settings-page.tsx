"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  BriefcaseBusiness,
  CreditCard,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { SeekerSidebarActions } from "@/components/dashboard/seeker-sidebar-actions";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/toast-provider";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
  { label: "Saved Jobs", href: "/saved-jobs", icon: Bookmark },
  { label: "Applications", href: "/applications", icon: FileText },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

type ProfileData = {
  headline: string;
  bio: string;
  skills: string[];
};

export function SettingsPage({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image: string | null;
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [fullName, setFullName] = useState(name);
  const [profile, setProfile] = useState<ProfileData>({
    headline: "",
    bio: "",
    skills: [],
  });
  const [skillDraft, setSkillDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(image);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    setAvatarPreview(image);
  }, [image]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile/mine", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const result = (await response.json()) as
          | { data: ProfileData }
          | { error: string };
        if (!response.ok || !("data" in result)) {
          throw new Error("error" in result ? result.error : "Could not load your profile.");
        }
        setProfile(result.data);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Could not load your profile.",
        );
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
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

    const previousPreview = avatarPreview ?? image ?? null;
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setAvatarUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/backend/profile/avatar", {
        method: "POST",
        credentials: "include",
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
      setAvatarPreview(result.data.image);
      showToast("Avatar updated.", "success");
    } catch (caught) {
      setAvatarPreview(previousPreview);
      showToast(
        caught instanceof Error ? caught.message : "Could not upload avatar.",
        "error",
      );
    } finally {
      URL.revokeObjectURL(localPreview);
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const addSkill = () => {
    const skill = skillDraft.trim();
    if (!skill) return;
    if (profile.skills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
      setSkillDraft("");
      return;
    }
    if (profile.skills.length >= 20) {
      setError("You can add up to 20 skills.");
      return;
    }
    setProfile((current) => ({ ...current, skills: [...current.skills, skill] }));
    setSkillDraft("");
    setError(null);
  };

  const onSkillKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill();
    }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/mine", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const result = (await response.json()) as
        | { data: ProfileData }
        | { error: string };
      if (!response.ok || !("data" in result)) {
        throw new Error("error" in result ? result.error : "Could not save your profile.");
      }
      setProfile(result.data);

      const normalizedName = fullName.trim();
      if (normalizedName && normalizedName !== name) {
        const update = await authClient.updateUser({ name: normalizedName });
        if (update.error) {
          showToast(
            update.error.message ??
              "Professional details saved, but your name could not be updated.",
            "error",
          );
          return;
        }
      }
      showToast("Your profile has been saved.", "success");
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : "Could not save your profile.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordBusy(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        showToast(result.error.message ?? "Could not reset your password.", "error");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordForm(false);
      showToast("Your password has been updated.", "success");
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : "Could not reset your password.",
        "error",
      );
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0b0d] p-2.5 text-white sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.25rem)] max-w-[1600px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d10] shadow-2xl sm:min-h-[calc(100vh-2rem)]">
        <aside className="hidden w-[228px] shrink-0 flex-col border-r border-white/[0.07] bg-[#09090b] p-4 lg:flex">
          <Logo className="mb-7 px-1 [&_img]:h-[28px]" />
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#151519] px-3 py-2.5">
            <Avatar name={fullName || email} image={image} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{fullName || "Job Seeker"}</p>
              <p className="mt-0.5 text-[10px] text-[#85858e]">Job Seeker</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navigation.map(({ label, href, icon: Icon }) => (
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
          <div className="mt-auto">
            <Link
              href="/jobs"
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-white text-xs font-semibold text-black transition hover:bg-[#e8e8ed]"
            >
              <BriefcaseBusiness className="size-4" />
              Find a job
            </Link>
            <SeekerSidebarActions />
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[60px] shrink-0 items-center border-b border-white/[0.07] px-4 sm:px-6">
            <Logo className="mr-auto [&_img]:h-[26px] lg:hidden" />
            <p className="hidden text-[10px] text-[#777781] lg:block">
              Account settings
            </p>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-6 sm:pt-7">
            <div className="mb-5">
              <h1 className="text-[22px] font-semibold tracking-tight sm:text-[25px]">
                Settings
              </h1>
              <p className="mt-1 text-[11px] text-[#9696a0]">
                Manage your account details and professional profile.
              </p>
            </div>

            {error && (
              <p role="alert" className="mb-4 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-xs text-rose-200">
                {error}
              </p>
            )}

            <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
              <div className="space-y-3">
                <section className="rounded-xl border border-white/[0.07] bg-[#131317] p-4 sm:p-5">
                  <h2 className="text-sm font-semibold">Profile Information</h2>
                  <div className="mt-4 flex items-center gap-3">
                    <Avatar name={fullName || email} image={avatarPreview} large />
                    <div className="min-w-0">
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
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Field label="Full Name">
                      <input
                        value={fullName}
                        onChange={(event) => setFullName(event.currentTarget.value)}
                        maxLength={120}
                        className={inputClass}
                        autoComplete="name"
                      />
                    </Field>
                    <Field label="Email Address">
                      <input value={email} readOnly className={`${inputClass} text-[#777781]`} />
                    </Field>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                    <button
                      type="submit"
                      form="profile-form"
                      disabled={saving || loading}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-white px-3 text-[10px] font-semibold text-black transition hover:bg-[#e8e8ed] disabled:opacity-50"
                    >
                      {saving && <LoaderCircle className="size-3 animate-spin" />}
                      Update Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm((current) => !current);
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/[0.08] px-3 text-[10px] text-[#b8b8c0] transition hover:bg-white/[0.04]"
                    >
                      <LockKeyhole className="size-3" />
                      Reset Password
                    </button>
                  </div>
                  {showPasswordForm && (
                    <form onSubmit={changePassword} className="mt-4 grid gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-2">
                      <Field label="Current Password">
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(event) => setCurrentPassword(event.currentTarget.value)}
                          required
                          autoComplete="current-password"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="New Password">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.currentTarget.value)}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          className={inputClass}
                        />
                      </Field>
                      <button
                        type="submit"
                        disabled={passwordBusy}
                        className="inline-flex h-8 w-fit items-center gap-1.5 rounded-md bg-white px-3 text-[10px] font-semibold text-black disabled:opacity-50 sm:col-span-2"
                      >
                        {passwordBusy && <LoaderCircle className="size-3 animate-spin" />}
                        Save Password
                      </button>
                    </form>
                  )}
                </section>

                <form id="profile-form" onSubmit={saveProfile}>
                  <section className="rounded-xl border border-white/[0.07] bg-[#131317] p-4 sm:p-5">
                    <h2 className="text-sm font-semibold">Professional Details</h2>
                    <div className="mt-4 space-y-3">
                      <Field label="Professional Headline">
                        <input
                          value={profile.headline}
                          onChange={(event) =>
                            setProfile((current) => ({
                              ...current,
                              headline: event.currentTarget.value,
                            }))
                          }
                          maxLength={120}
                          placeholder="e.g. Senior UX/UI Designer"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Bio">
                        <textarea
                          value={profile.bio}
                          onChange={(event) =>
                            setProfile((current) => ({
                              ...current,
                              bio: event.currentTarget.value,
                            }))
                          }
                          maxLength={1000}
                          rows={4}
                          placeholder="Tell employers about your experience and what you bring to a team."
                          className={`${inputClass} min-h-24 resize-y py-2`}
                        />
                      </Field>
                      <Field label="Skills">
                        <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#0d0d10] p-1.5">
                          {profile.skills.map((skill) => (
                            <span key={skill} className="inline-flex items-center gap-1 rounded bg-[#26262c] px-2 py-1 text-[9px] text-[#d0d0d6]">
                              {skill}
                              <button
                                type="button"
                                aria-label={`Remove ${skill}`}
                                onClick={() =>
                                  setProfile((current) => ({
                                    ...current,
                                    skills: current.skills.filter((item) => item !== skill),
                                  }))
                                }
                                className="text-[#8f8f99] hover:text-white"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <input
                            value={skillDraft}
                            onChange={(event) => setSkillDraft(event.currentTarget.value)}
                            onKeyDown={onSkillKeyDown}
                            onBlur={addSkill}
                            maxLength={40}
                            placeholder="Add a skill..."
                            className="min-w-28 flex-1 bg-transparent px-1 py-1 text-[10px] outline-none placeholder:text-[#686872]"
                          />
                          <button
                            type="button"
                            onClick={addSkill}
                            aria-label="Add skill"
                            className="grid size-6 shrink-0 place-items-center rounded text-[#85858e] hover:bg-white/[0.06] hover:text-white"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </Field>
                    </div>
                    <div className="mt-4 border-t border-white/[0.06] pt-3">
                      <button
                        type="submit"
                        disabled={saving || loading}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-white px-3 text-[10px] font-semibold text-black transition hover:bg-[#e8e8ed] disabled:opacity-50"
                      >
                        {saving && <LoaderCircle className="size-3 animate-spin" />}
                        Save Details
                      </button>
                    </div>
                  </section>
                </form>
              </div>

              <div className="space-y-3">
                <section className="rounded-xl border border-white/[0.07] bg-[#131317] p-4">
                  <h2 className="text-sm font-semibold">Resume</h2>
                  <p className="mt-1 text-[10px] leading-relaxed text-[#85858e]">
                    Choose a recent resume to keep it ready for your applications.
                  </p>
                  <div className="mt-3 flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.1] bg-[#0d0d10] p-3 text-center">
                    <FileText className="size-5 text-[#777781]" />
                    <p className="mt-2 max-w-full truncate text-[10px] font-medium text-[#d0d0d6]">
                      {resumeName ?? "No resume selected"}
                    </p>
                    <p className="mt-1 text-[9px] text-[#777781]">
                      {resumeName ? "Selected on this device; not uploaded" : "PDF, DOC, or DOCX"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-white/10 px-2.5 text-[9px] text-white hover:bg-white/[0.05]">
                        <Upload className="size-3" />
                        {resumeName ? "Replace" : "Choose file"}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="sr-only"
                          onChange={(event) => setResumeName(event.currentTarget.files?.[0]?.name ?? null)}
                        />
                      </label>
                      {resumeName && (
                        <button
                          type="button"
                          onClick={() => setResumeName(null)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-white/10 px-2.5 text-[9px] text-[#aaaab3] hover:text-white"
                        >
                          <Trash2 className="size-3" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-white/[0.07] bg-[#131317] p-4">
                  <div className="flex items-start gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-[#a6a6af]">
                      <ShieldCheck className="size-4" />
                    </span>
                    <div>
                      <h2 className="text-[11px] font-semibold">Account Security</h2>
                      <p className="mt-1 text-[9px] leading-relaxed text-[#85858e]">
                        Review and sign out devices currently connected to your account.
                      </p>
                      <Link href="/settings/sessions" className="mt-2 inline-flex items-center gap-1 text-[9px] text-white hover:text-violet-200">
                        <UserRound className="size-3" />
                        Manage active sessions
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const inputClass =
  "h-8 w-full rounded-md border border-white/[0.08] bg-[#0d0d10] px-2.5 text-[10px] text-white outline-none placeholder:text-[#686872] focus:border-violet-400/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[9px] text-[#a3a3ad]">{label}</span>
      {children}
    </label>
  );
}

function Avatar({
  name,
  image,
  large = false,
}: {
  name: string;
  image: string | null;
  large?: boolean;
}) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#24242b] font-semibold text-white ${large ? "size-12 text-sm" : "size-8 text-[10px]"}`}>
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
          .toUpperCase() || "JS"
      )}
    </span>
  );
}
