import Link from "next/link";

import { Logo } from "@/components/logo";

import CTASection from "@/components/cta-section";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Job discovery", href: "/jobs" },
      { label: "Worker AI", href: "/worker-ai" },
      { label: "Companies", href: "/company" },
      { label: "Salary data", href: "/salary" },
    ],
  },
  {
    title: "Navigations",
    links: [
      { label: "Help center", href: "/help" },
      { label: "Career library", href: "/library" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Brand Guideline", href: "/brand" },
      { label: "Newsroom", href: "/newsroom" },
    ],
  },
];

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.19 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.75 8.43-4.92 8.43-9.94Z" />
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

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.04 2C6.58 2 3 5.64 3 10.42c0 2.3 1.23 5.17 3.2 6.08.3.14.46.08.53-.21l.22-.9c.06-.21.03-.39-.14-.6-.65-.79-1.17-2.24-1.17-3.59 0-3.47 2.63-6.83 7.1-6.83 3.86 0 6.56 2.63 6.56 6.4 0 4.25-2.14 7.2-4.94 7.2-1.54 0-2.7-1.28-2.33-2.84.44-1.87 1.3-3.88 1.3-5.23 0-1.2-.65-2.21-1.99-2.21-1.58 0-2.85 1.63-2.85 3.82 0 1.39.47 2.33.47 2.33l-1.85 7.84c-.5 2.11.07 4.7.13 4.95.03.14.18.18.26.07.11-.15 1.48-2.2 1.95-4.26l.74-2.83c.39.74 1.52 1.36 2.72 1.36 3.58 0 6.17-3.3 6.17-7.75C21.08 5.25 17.72 2 12.04 2Z" />
    </svg>
  );
}

export function CtaFooter() {
  return (
    <div className="bg-black">
      <CTASection />

      <footer className="bg-black px-5 pt-[60px] pb-10 sm:px-6">
        <div className="mx-auto max-w-[1100px]">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[180px]">
              <Logo className="[&_img]:h-7" />
              <p className="mt-4 text-[11px] leading-relaxed text-[#6b7280]">
                The AI-native career platform. Built for people who take their
                work seriously.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:gap-x-12">
              {footerColumns.map((column) => (
                <nav key={column.title} aria-label={column.title}>
                  <h3 className="text-xs font-medium text-[#5b4ff5]">
                    {column.title}
                  </h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-[11px] text-[#6b7280] transition-colors hover:text-white"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>

          <div className="mt-[60px] flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <a
                href="https://facebook.com"
                aria-label="Facebook"
                className="grid size-7 place-items-center rounded-md bg-[#1a1a1a] text-[#9ca3af] transition-colors hover:bg-[#5b4ff5] hover:text-white"
              >
                <FacebookIcon className="size-3.5" />
              </a>
              <a
                href="https://pinterest.com"
                aria-label="Pinterest"
                className="grid size-7 place-items-center rounded-md bg-[#5b4ff5] text-white transition-colors hover:bg-[#6d61ff]"
              >
                <PinterestIcon className="size-3.5" />
              </a>
              <a
                href="https://linkedin.com"
                aria-label="LinkedIn"
                className="grid size-7 place-items-center rounded-md bg-[#1a1a1a] text-[#9ca3af] transition-colors hover:bg-[#5b4ff5] hover:text-white"
              >
                <LinkedInIcon className="size-3.5" />
              </a>
            </div>

            <div className="flex flex-col items-center gap-1 text-center text-[11px] text-[#6b7280] sm:flex-row sm:gap-4 sm:text-left">
              <span>Copyright 2024 - Hireloop</span>
              <span className="flex items-center gap-3 text-[#9ca3af]">
                <Link href="/terms" className="hover:text-white">
                  Terms &amp; Policy
                </Link>
                <span aria-hidden="true" className="text-[#6b7280]">
                  -
                </span>
                <Link href="/privacy" className="hover:text-white">
                  Privacy Guideline
                </Link>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
