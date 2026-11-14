import {
  Code2,
  LayoutTemplate,
  Network,
  PenTool,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface SkillChipsProps {
  skills: string[];
}

function getSkillIcon(skill: string): LucideIcon {
  const s = skill.toLowerCase();
  if (s.includes("figma") || s.includes("design tool")) {
    return Code2;
  }
  if (s.includes("system")) {
    return Network;
  }
  if (s.includes("ui") || s.includes("ux") || s.includes("design")) {
    return PenTool;
  }
  if (
    s.includes("front") ||
    s.includes("react") ||
    s.includes("code") ||
    s.includes("web")
  ) {
    return LayoutTemplate;
  }
  return Sparkles;
}

export function SkillChips({ skills }: SkillChipsProps) {
  if (!skills || skills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {skills.map((skill) => {
        const Icon = getSkillIcon(skill);
        return (
          <span
            key={skill}
            className="inline-flex h-[34px] items-center gap-2 rounded-[8px] border border-white/[0.08] bg-[#161616] px-3.5 text-[12px] font-medium text-[#e5e5e5]"
          >
            <Icon className="size-3.5 text-[#9ca3af]" aria-hidden="true" />
            <span>{skill}</span>
          </span>
        );
      })}
    </div>
  );
}
