import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout Cancelled — hireloop",
  description: "Stripe checkout was cancelled before completion.",
};

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen w-full bg-[#050505] text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[680px] flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <div className="w-full rounded-[20px] border border-white/[0.08] bg-[#111111] p-8 text-left sm:p-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-amber-400/10 text-amber-400">
              <span className="text-2xl font-semibold" aria-hidden="true">
                ✕
              </span>
            </span>
            <h1 className="text-[22px] font-semibold tracking-tight text-white">
              Checkout cancelled
            </h1>
            <p className="text-[12px] leading-relaxed text-[#9a9aa3]">
              Your Stripe checkout session was cancelled before the payment
              completed. No amount was charged and no payment was saved.
            </p>
          </div>
        </div>

        <div className="mt-6 flex w-full max-w-[320px] flex-col gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/#pricing" />}
            className="h-10 rounded-lg bg-[#0a66ff] text-[13px] font-medium text-white hover:bg-[#0b5ae0]"
          >
            Back to Plans
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/billing" />}
            variant="outline"
            className="h-10 rounded-lg border-white/15 bg-transparent px-3 text-[13px] font-medium text-white hover:bg-white/[0.06] hover:text-white"
          >
            Back to Billing
          </Button>
        </div>
      </div>
    </div>
  );
}
