import { ROLE_LABELS, redirectForRole, type Role } from "@/lib/roles";

export function WelcomePlaceholder({
  name,
  role,
}: {
  name: string;
  role: Role;
}) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center px-5 text-center">
      <span className="rounded-full border border-[#5b4ff5]/40 bg-[#5b4ff5]/15 px-3 py-1 text-[11px] font-medium text-[#c7d2ff] uppercase tracking-widest">
        {ROLE_LABELS[role]}
      </span>

      <h1 className="mt-4 text-[30px] font-medium leading-[1.15] tracking-tight text-white">
        Welcome, {name}
      </h1>

      <p className="mt-3 max-w-[380px] text-[14px] text-[#9ca3af]">
        Your {ROLE_LABELS[role].toLowerCase()} workspace starts here. This is a
        placeholder page at {redirectForRole(role)}.
      </p>

      <div
        aria-hidden="true"
        className="mt-8 h-px w-40 rounded-full bg-gradient-to-r from-transparent via-[#5b4ff5]/50 to-transparent"
      />
    </main>
  );
}
