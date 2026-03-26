import React from "react";
import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";

interface AuthShellProps {
  mode: "signin" | "signup";
}

const KPI_CARDS = [
  { label: "Avg MRR / client", value: "$1,240", delta: "+12% this quarter" },
  { label: "Delivery rate",     value: "98.2%",  delta: "on track"           },
  { label: "Client retention",  value: "94%",    delta: "+3 pts YoY"         },
];

export default function AuthShell({ mode }: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full">
      {/* ── Left brand panel (55%) ── */}
      <div className="relative hidden w-[55%] overflow-hidden bg-sidebar lg:flex lg:flex-col">
        {/* Decorative glows — CSS only, no images */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-rose opacity-[0.07] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-24 right-4 h-96 w-96 rounded-full bg-brand-plum opacity-[0.09] blur-[80px]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-rose-mid opacity-[0.04] blur-[60px]" />

        {/* Panel content */}
        <div className="relative z-10 flex flex-1 flex-col px-10 py-10">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md font-display text-[15px] font-medium text-white"
              style={{ background: "linear-gradient(135deg, #C4909A 0%, #6B6178 100%)" }}
            >
              S
            </div>
            <span className="font-sans text-[15px] font-medium text-white/90">Severl</span>
          </div>

          {/* Headline */}
          <div className="mt-16">
            <h1 className="font-display text-[38px] font-light leading-[1.1] tracking-[-0.02em] text-white">
              Your social media<br />
              <span className="italic text-brand-rose-mid">business OS.</span>
            </h1>
            <p className="mt-4 font-sans text-[14px] leading-relaxed text-white/40">
              Deliverables, clients, invoicing — all in one place,<br />
              built for freelancers and agencies who mean business.
            </p>
          </div>

          {/* KPI cards */}
          <div className="mt-12 grid grid-cols-3 gap-3">
            {KPI_CARDS.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-3.5"
              >
                <p className="font-sans text-[9.5px] font-medium uppercase tracking-[0.08em] text-white/30">
                  {kpi.label}
                </p>
                <p className="mt-2 font-display text-[22px] font-normal leading-none text-white">
                  {kpi.value}
                </p>
                <p className="mt-1.5 font-sans text-[11px] text-white/35">
                  {kpi.delta}
                </p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-10 border-l-[3px] border-brand-rose pl-4">
            <p className="font-sans text-[13px] italic leading-relaxed text-white/55">
              "Severl helped me cut admin time in half and finally feel on top of my client work."
            </p>
            <p className="mt-2 font-sans text-[11px] text-white/30">
              Maya R. — Social Media Freelancer
            </p>
          </div>

          {/* Brand stats footer */}
          <div className="mt-auto flex items-center gap-6 pt-10">
            {[
              { value: "500+",  label: "Freelancers"   },
              { value: "12k+",  label: "Deliverables"  },
              { value: "98%",   label: "Satisfaction"  },
            ].map((stat, i, arr) => (
              <React.Fragment key={stat.label}>
                <div>
                  <p className="font-display text-[20px] font-normal text-white">{stat.value}</p>
                  <p className="font-sans text-[9.5px] uppercase tracking-[0.08em] text-white/30">{stat.label}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="h-6 w-px bg-white/10" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-page px-6 py-12">

        {/* Tab navigation */}
        <div className="mb-8 flex rounded-lg border border-border bg-surface p-1">
          <Link
            href="/sign-in"
            className={[
              "rounded-md px-5 py-1.5 font-sans text-[13px] font-medium transition-colors",
              mode === "signin"
                ? "bg-brand-rose text-white"
                : "text-txt-muted hover:text-txt-secondary",
            ].join(" ")}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className={[
              "rounded-md px-5 py-1.5 font-sans text-[13px] font-medium transition-colors",
              mode === "signup"
                ? "bg-brand-rose text-white"
                : "text-txt-muted hover:text-txt-secondary",
            ].join(" ")}
          >
            Create account
          </Link>
        </div>

        {/* Clerk component */}
        <div className="w-full max-w-[400px]">
          {mode === "signin" ? (
            <SignIn signUpUrl="/sign-up" />
          ) : (
            <SignUp signInUrl="/sign-in" />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center gap-4">
          <Link href="/privacy" className="font-sans text-[11px] text-txt-hint transition-colors hover:text-txt-muted">
            Privacy
          </Link>
          <span className="font-sans text-[11px] text-txt-hint">·</span>
          <Link href="/terms" className="font-sans text-[11px] text-txt-hint transition-colors hover:text-txt-muted">
            Terms
          </Link>
        </div>
      </div>
    </div>
  );
}
