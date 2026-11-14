"use client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M45.12 24.5c0-1.56-.14-3.06-.38-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 18.91 2 20.94 2 24s.85 5.09 2.34 7.18z" />
      <path d="M24 10.75c3.23 0 6.12 1.11 8.38 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 12.18l7.35 5.7C13.42 14.87 18.27 10.75 24 10.75z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M6.94 8.5H3.56V19h3.38V8.5ZM5.25 3A1.97 1.97 0 1 0 5.3 6.94 1.97 1.97 0 0 0 5.25 3ZM20.44 12.97c0-3.24-1.73-4.75-4.04-4.75-1.86 0-2.69 1.03-3.16 1.75V8.5h-3.38c.04.98 0 10.5 0 10.5h3.38v-5.86c0-.31.02-.63.12-.85.25-.63.83-1.28 1.8-1.28 1.27 0 1.78.97 1.78 2.39V19H20.44v-6.03Z" />
    </svg>
  );
}

type SocialButtonsProps = {
  onSocial?: (provider: string) => void;
  disabled?: boolean;
};

export function SocialButtons({ onSocial, disabled }: SocialButtonsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
      <button
        type="button"
        onClick={() => onSocial?.("google")}
        disabled={disabled}
        className="flex h-[44px] items-center justify-center gap-2.5 rounded-[10px] border border-white/[0.08] bg-[#111] px-4 text-[13px] font-medium text-white transition-colors hover:border-[#5b4ff5]/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon className="size-4 text-[#9ca3af]" />
        Google
      </button>
      <button
        type="button"
        onClick={() => onSocial?.("linkedin")}
        disabled={disabled}
        className="flex h-[44px] items-center justify-center gap-2.5 rounded-[10px] border border-white/[0.08] bg-[#111] px-4 text-[13px] font-medium text-white transition-colors hover:border-[#5b4ff5]/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LinkedInIcon className="size-4 text-[#9ca3af]" />
        LinkedIn
      </button>
    </div>
  );
}
