import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="hireloop — home"
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      <Image
        src="/images/logo.png"
        alt=""
        width={154}
        height={44}
        priority
        className="h-[30px] w-auto"
      />
    </Link>
  );
}
