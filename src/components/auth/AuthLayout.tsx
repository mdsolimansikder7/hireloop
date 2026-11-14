import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(91,79,245,0.35)_0%,rgba(91,79,245,0.16)_30%,transparent_70%)]"
      />

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 760"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <radialGradient id="auth-glow" cx="50%" cy="0%" r="50%">
            <stop offset="0" stopColor="#5b4ff5" stopOpacity="0.55" />
            <stop offset="0.35" stopColor="#5b4ff5" stopOpacity="0.18" />
            <stop offset="0.7" stopColor="#5b4ff5" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="auth-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="1" />
          </linearGradient>
          <clipPath id="auth-dome">
            <ellipse cx="720" cy="700" rx="680" ry="500" />
          </clipPath>
        </defs>

        <rect width="1440" height="760" fill="url(#auth-glow)" />
        <g
          clipPath="url(#auth-dome)"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.04"
          strokeWidth="1"
        >
          <ellipse cx="720" cy="700" rx="680" ry="500" />
          <ellipse cx="720" cy="700" rx="540" ry="400" />
          <ellipse cx="720" cy="700" rx="400" ry="300" />
          <ellipse cx="720" cy="700" rx="260" ry="200" />
          <ellipse cx="720" cy="700" rx="120" ry="90" />
        </g>
        <rect width="1440" height="760" fill="url(#auth-fade)" />
      </svg>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] flex-col items-center justify-center px-5 pt-28 pb-16 md:px-6 md:pt-28 md:pb-16">
        <div className="w-full max-w-[440px]">
          <div className="animate-[fade-up_0.5s_ease-out_both] relative w-full rounded-[24px] border border-white/[0.08] bg-[#0f0f0f]/70 p-6 backdrop-blur-xl shadow-[0_0_80px_-20px_rgba(91,79,245,0.35)] md:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
