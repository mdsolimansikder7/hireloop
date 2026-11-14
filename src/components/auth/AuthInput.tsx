"use client";

import { useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

export interface AuthInputProps {
  id: string;
  label?: string;
  type?: string;
  placeholder?: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  name?: string;
  disabled?: boolean;
  onBlur?: () => void;
  style?: React.CSSProperties;
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5 shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function AuthInput({
  id,
  label,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  onChange,
  error,
  autoComplete,
  name,
  disabled,
  onBlur,
  style,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className="w-full animate-[fade-up_0.5s_ease-out_both]" style={style}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-2 block text-[13px] font-medium text-[#d1d5db]"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-[#6b7280] focus-within:text-[#e9d5ff]"
          aria-hidden="true"
        />
        <input
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={
            "h-[44px] w-full rounded-[10px] border bg-[#0d0d0d] pl-11 pr-11 text-[14px] text-white outline-none transition-colors placeholder:text-[#6b7280] " +
            "border-white/[0.08] focus:border-[#5b4ff5] focus:ring-[3px] focus:ring-[#5b4ff5]/20 " +
            (error
              ? "border-[#f87171] focus:border-[#f87171] focus:ring-[#f87171]/20"
              : "") +
            (disabled ? "opacity-50" : "")
          }
        />
        {type === "password" ? (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-[#6b7280] transition-colors hover:text-white"
          >
            {showPassword ? (
              <EyeOff className="size-[18px]" />
            ) : (
              <Eye className="size-[18px]" />
            )}
          </button>
        ) : null}
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#f87171]"
        >
          <AlertIcon />
          {error}
        </p>
      ) : null}
    </div>
  );
}
