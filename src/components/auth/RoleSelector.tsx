"use client"

import type { KeyboardEvent } from "react"
import { Shield, User, Users, type LucideIcon } from "lucide-react"

import type { Role } from "@/lib/roles"

type RoleOption = {
  value: Role
  label: string
  icon: LucideIcon
}

const ALL_OPTIONS: RoleOption[] = [
  { value: "seeker", label: "Job Seeker", icon: Users },
  { value: "recruiter", label: "Recruiter", icon: User },
  { value: "admin", label: "Admin", icon: Shield },
]

export interface RoleSelectorProps {
  value: Role
  onChange: (role: Role) => void
  error?: string
  /** Limit selectable roles, e.g. social onboarding (["seeker", "recruiter"]). */
  roles?: Role[]
}

export function RoleSelector({ value, onChange, error, roles }: RoleSelectorProps) {
  const options = roles ? ALL_OPTIONS.filter((o) => roles.includes(o.value)) : ALL_OPTIONS

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = options.findIndex((o) => o.value === value)
    let next: number

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowUp":
        next = currentIndex <= 0 ? options.length - 1 : currentIndex - 1
        break
      case "ArrowRight":
      case "ArrowDown":
        next = currentIndex >= options.length - 1 ? 0 : currentIndex + 1
        break
      case "Home":
        next = 0
        break
      case "End":
        next = options.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    onChange(options[next].value)
    requestAnimationFrame(() => {
      const nextOption = event.currentTarget.querySelector<HTMLButtonElement>(
        `button[data-role-value="${options[next].value}"]`,
      )
      nextOption?.focus()
    })
  }

  return (
    <div>
      <span className="mb-2.5 block text-[15px] font-medium text-white">
        Joining HireLoop as
      </span>

      <div
        role="radiogroup"
        aria-label="Joining HireLoop as"
        onKeyDown={handleKeyDown}
        className="flex gap-2.5 overflow-x-auto"
      >
        {options.map(({ value: optionValue, label, icon: Icon }) => {
          const selected = optionValue === value
          return (
            <button
              key={optionValue}
              type="button"
              role="radio"
              aria-checked={selected}
              data-role-value={optionValue}
              tabIndex={selected ? 0 : -1}
              onClick={(e) => {
                if (optionValue !== value) onChange(optionValue)
                e.currentTarget.blur()
              }}
              className={
                "flex h-[88px] min-w-[116px] flex-1 flex-col items-center justify-center gap-2 rounded-[14px] border transition-all duration-200 focus-visible:outline-none " +
                (selected
                  ? "border-[#6c63ff] bg-[rgba(91,79,245,0.16)] shadow-[0_0_0_1px_rgba(108,99,255,0.35),0_10px_32px_-8px_rgba(91,79,245,0.45)]"
                  : "border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.22)] hover:bg-[rgba(255,255,255,0.05)]") +
                (error ? "" : "")
              }
            >
              <Icon
                className={
                  "size-[24px] transition-colors " +
                  (selected ? "text-white" : "text-[#c9cdd6]")
                }
                aria-hidden="true"
              />
              <span
                className={
                  "text-[14px] transition-colors " +
                  (selected ? "font-medium text-white" : "font-medium text-[#c9cdd6]")
                }
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {error ? (
        <p className="mt-1.5 text-[12px] text-[#f87171]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
