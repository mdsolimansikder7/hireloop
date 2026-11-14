"use client";

const SEGMENT_COLORS = ["#f87171", "#fb923c", "#facc15", "#34d399"];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;

  const filled = Math.max(0, Math.min(4, score));

  return (
    <div className="mt-2.5 w-full">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{
              backgroundColor:
                i < filled ? SEGMENT_COLORS[i] : "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[12px] text-[#6b7280]">
        At least 8 characters, with a number and a symbol
      </p>
    </div>
  );
}
