"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "";

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFF]">
      <header className="border-b border-[#0D0106]/10 px-4 py-4 flex justify-center">
        <Image src="/goreinvent-logo.svg" alt="GoReinvent" width={160} height={67} priority />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="w-14 h-14 bg-[#3626A7] flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-[#FBFBFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-bold text-[#0D0106] mb-4">
            Your answers are being analysed now.
          </h1>
          <p className="text-base text-[#0D0106]/70 mb-4">
            Your Reinvention Readiness Report will arrive in your inbox within 10 minutes{name ? `, ${name}` : ""}.
          </p>
          <p className="text-sm text-[#0D0106]/60 mb-8">
            Check your spam folder if you don&apos;t see it, and add{" "}
            <span className="font-semibold text-[#0D0106]">hello@goreinvent.com</span>{" "}
            to your contacts to make sure future messages land.
          </p>
          <div className="border-t border-[#0D0106]/10 pt-6">
            <p className="text-sm text-[#0D0106]/50 mb-2">While you wait:</p>
            <a
              href="https://goreinvent.com/?utm_source=start&utm_medium=thankyou&utm_campaign=reinvention-readiness"
              target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium text-[#3626A7] hover:underline"
            >
              GoReinvent: Helping experienced professionals build income outside employment
            </a>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#0D0106]/10 px-4 py-6 text-center">
        <p className="text-xs text-[#0D0106]/50">
          &copy; {new Date().getFullYear()} GoReinvent &middot; goreinvent.com
        </p>
      </footer>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouContent />
    </Suspense>
  );
}
