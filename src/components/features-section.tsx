import {
  Bookmark,
  Building2,
  FileText,
  Hexagon,
  LineChart,
  MousePointerClick,
  Search,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: Search,
    title: "Smart Search",
    description: "Find your ideal job with advanced filters.",
  },
  {
    icon: LineChart,
    title: "Salary Insights",
    description: "Get real salary data to negotiate confidently.",
  },
  {
    icon: Building2,
    title: "Top Companies",
    description: "Apply to vetted companies that are hiring.",
  },
  {
    icon: Bookmark,
    title: "Saved Jobs",
    description: "Manage apps & favorites on your dashboard.",
  },
  {
    icon: MousePointerClick,
    title: "One-Click Apply",
    description: "Simplify your job applications for an easier process!",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description: "Create professional resumes with modern templates.",
  },
  {
    icon: Hexagon,
    title: "Skill-Based Matching",
    description: "Discover jobs that match your skills and experience.",
  },
  {
    icon: TrendingUp,
    title: "Career Growth Resources",
    description: "Boost your career with quick interview tips.",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative bg-[#0d0d0d] py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto w-full max-w-[1100px] px-5 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-[2px] bg-[#5b4ff5]"
            />
            <span className="font-mono text-[11px] font-medium tracking-[0.28em] text-[#9ca3af] uppercase sm:text-xs">
              Features Job
            </span>
            <span
              aria-hidden="true"
              className="size-1.5 rounded-[2px] bg-[#5b4ff5]"
            />
          </div>

          <h2 className="mt-4 max-w-xl text-balance text-4xl leading-[1.1] font-semibold tracking-tight text-white sm:mt-5 sm:text-5xl">
            Everything you need
            <br />
            to succeed
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 min-[520px]:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="group flex items-start gap-3">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-white/[0.08] bg-[linear-gradient(180deg,#1a1a1a_0%,#0a0a0a_100%)] text-[#e9d5ff] transition-[border-color,box-shadow] duration-200 group-hover:border-[#5b4ff5]/60 group-hover:shadow-[0_0_18px_-6px_rgba(91,79,245,0.55)]"
                aria-hidden="true"
              >
                <feature.icon className="size-[18px]" strokeWidth={1.5} />
              </span>

              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold leading-snug text-white sm:text-sm">
                  {feature.title}
                </h3>
                <p className="mt-1 max-w-[170px] text-xs leading-relaxed text-[#9ca3af]">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
