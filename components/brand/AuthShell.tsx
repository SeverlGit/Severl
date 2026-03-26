import React from "react";
import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";

interface AuthShellProps {
  mode?: "signin" | "signup";
  children?: React.ReactNode;
}

const KPI_CARDS = [
  { label: "Avg MRR / client", value: "$1,240", delta: "+12% this quarter" },
  { label: "Delivery rate",    value: "98.2%",  delta: "on track"          },
  { label: "Client retention", value: "94%",    delta: "+3 pts YoY"        },
];

const STATS = [
  { value: "500+", label: "Freelancers"  },
  { value: "12k+", label: "Deliverables" },
  { value: "98%",  label: "Satisfaction" },
];

// ↓ children now destructured — fixes onboarding render
export default function AuthShell({ mode, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full">

      {/* ── Left brand panel (55%) ── */}
      <div className="relative hidden w-[55%] overflow-hidden bg-sidebar lg:flex lg:flex-col">

        {/* Decorative glows */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-rose opacity-[0.07] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-24 right-4 h-96 w-96 rounded-full bg-brand-plum opacity-[0.09] blur-[80px]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-rose-mid opacity-[0.04] blur-[60px]" />

        {/* Panel content */}
        <div className="relative z-10 flex flex-1 flex-col px-10 py-10">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md font-display text-[15px] font-medium text-white"
              style={{ background: "linear-gradient(135deg, #C4909A 0%, #6B6178 100%)" }}
            >
              S
            </div>
            <span className="font-sans text-[15px] font-medium text-white/90">
              Severl
            </span>
          </div>

          {/* Headline */}
          <div className="mt-16">
            <p className="mb-3.5 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-rose-mid">
              SMM Operating System
            </p>
            <h1 className="font-display text-[38px] font-light leading-[1.1] tracking-[-0.025em] text-white">
              Your practice,<br />
              <span className="italic text-brand-rose-mid">running itself.</span>
            </h1>
            <p className="mt-4 max-w-[360px] font-sans text-[13px] font-light leading-relaxed text-white/40">
              Manage clients, deliverables, and invoices in one place —
              built specifically for social media managers who run a real business.
            </p>
          </div>

          {/* KPI preview cards */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {KPI_CARDS.map((kpi, i) => (
              <div
                key={kpi.label}
                className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.04] p-3.5"
              >
                {/* Top accent strip */}
                <div
                  className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl"
                  style={{
                    background: i === 0 ? "#C4909A" : i === 1 ? "#9B92A8" : "#5A8A6A",
                  }}
                />
                <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.08em] text-white/30">
                  {kpi.label}
                </p>
                <p className="mt-2 font-display text-[22px] font-normal leading-none tracking-tight text-white">
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
              "Severl replaced three separate tools for me. I finally know exactly
              what I&apos;m owed, what&apos;s overdue, and what needs to go out this week."
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full
                           font-sans text-[9px] font-semibold text-brand-rose-deep"
                style={{ background: "linear-gradient(135deg, #F7ECED, #EDEBF2)" }}
              >
                JL
              </div>
              <div>
                <p className="font-sans text-[11px] font-medium text-white/55">Jade L.</p>
                <p className="font-sans text-[10px] text-white/28">SMM Freelancer · 9 clients</p>
              </div>
            </div>
          </div>

          {/* Brand stats footer */}
          <div className="mt-auto flex items-center gap-6 pt-10">
            {STATS.map((stat, i) => (
              <React.Fragment key={stat.label}>
                <div>
                  <p className="font-display text-[20px] font-normal leading-none text-white/80">
                    {stat.value}
                  </p>
                  <p className="mt-1 font-sans text-[9px] uppercase tracking-[0.06em] text-white/28">
                    {stat.label}
                  </p>
                </div>
                {i < STATS.length - 1 && (
                  <div className="h-7 w-px bg-white/10" />
                )}
              </React.Fragment>
            ))}
          </div>

        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-page px-6 py-12">

        {/* Tab navigation — auth routes only */}
        {mode && (
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
        )}

        {/* Clerk form OR children (onboarding) */}
        <div className="w-full max-w-[400px]">
          {mode === "signin" ? (
            <SignIn signUpUrl="/sign-up" />
          ) : mode === "signup" ? (
            <SignUp signInUrl="/sign-in" />
          ) : (
            children
          )}
        </div>

        {/* Footer links */}
        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/privacy"
            className="font-sans text-[11px] text-txt-hint transition-colors hover:text-txt-muted"
          >
            Privacy
          </Link>
          <span className="font-sans text-[11px] text-txt-hint">·</span>
          <Link
            href="/terms"
            className="font-sans text-[11px] text-txt-hint transition-colors hover:text-txt-muted"
          >
            Terms
          </Link>
        </div>

      </div>
    </div>
  );
}