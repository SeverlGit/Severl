"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useFormState, useFormStatus } from "react-dom";
import { createOrg } from "./actions";
import AuthShell from "@/components/brand/AuthShell";
import { cn } from "@/lib/utils";

type Step = 1 | 2;

const initialState = { error: undefined as string | undefined };
const ease = [0.16, 1, 0.3, 1] as const;

// ─── Icons ────────────────────────────────────────────────────────────────────

function SoloIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="6.5" r="3.5" stroke="#8C5562" strokeWidth="1.5" />
      <path
        d="M3 18c0-3.5 3-6 7-6s7 2.5 7 6"
        stroke="#8C5562"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
      <circle cx="8.5" cy="6" r="3" stroke="#8C5562" strokeWidth="1.5" />
      <path
        d="M2 18c0-3 2.5-5 6.5-5s6.5 2 6.5 5"
        stroke="#8C5562"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="7" r="2.5" stroke="#6B6178" strokeWidth="1.25" />
      <path
        d="M16.5 12c2.5.4 4.5 2 4.5 4.5"
        stroke="#6B6178"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {([1, 2] as const).map((n) => (
        <div
          key={n}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            n === step
              ? "w-6 bg-brand-rose"
              : n < step
              ? "w-3 bg-brand-rose/40"
              : "w-3 bg-border-strong"
          )}
        />
      ))}
      <span className="ml-1 text-[11px] text-txt-muted">Step {step} of 2</span>
    </div>
  );
}

// ─── Vertical option cards ────────────────────────────────────────────────────

function VerticalOptions() {
  const { pending } = useFormStatus();

  const options = [
    {
      key: "smm_freelance" as const,
      icon: <SoloIcon />,
      title: "I work solo",
      subtitle: "Freelance · up to 10 clients",
      tag: "Freelancer",
    },
    {
      key: "smm_agency" as const,
      icon: <TeamIcon />,
      title: "I run a team",
      subtitle: "Agency · team management",
      tag: "Agency",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option, index) => (
          <motion.button
            key={option.key}
            type="submit"
            name="vertical"
            value={option.key}
            disabled={pending}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: index * 0.07 }}
            className={cn(
              "group flex flex-col rounded-xl border bg-surface p-4 text-left",
              "transition-all duration-150",
              "hover:border-brand-rose/40 hover:bg-brand-rose-dim hover:shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose/40",
              "disabled:cursor-wait disabled:opacity-50",
              "border-border"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-rose-dim border border-brand-rose/20 transition-colors group-hover:bg-white">
                {option.icon}
              </div>
              <span className="rounded border border-brand-plum/20 bg-brand-plum-dim px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-plum-deep">
                {option.tag}
              </span>
            </div>
            <span className="mt-3 text-[14px] font-semibold text-txt-primary">
              {option.title}
            </span>
            <span className="mt-0.5 text-[12px] text-txt-muted">
              {option.subtitle}
            </span>
          </motion.button>
        ))}
      </div>

      {pending && (
        <p className="mt-4 flex items-center justify-center gap-2 text-[12px] text-txt-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-rose animate-pulse inline-block" />
          Creating your workspace…
        </p>
      )}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OnboardingClient() {
  const [step, setStep] = useState<Step>(1);
  const [businessName, setBusinessName] = useState("");
  const [touched, setTouched] = useState(false);
  const [state, formAction] = useFormState(createOrg, initialState);

  const [timezone] = useState(() =>
    typeof window !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC"
  );

  const isNameValid = businessName.trim().length > 0;
  const showNameError = touched && !isNameValid;

  const handleContinue = () => {
    setTouched(true);
    if (!isNameValid) return;
    setStep(2);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleContinue();
  };

  return (
    <AuthShell>
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease, delay: 0.08 }}
        className="w-full max-w-[420px] rounded-xl border border-border bg-panel p-7 shadow-sm"
      >
        <StepIndicator step={step} />

        {/* ── Step 1: Business name ── */}
        {step === 1 && (
          <div className="flex flex-col">
            <h2 className="font-display text-[22px] font-medium leading-snug text-txt-primary">
              What&apos;s your business called?
            </h2>
            <p className="mb-5 mt-1.5 text-[13px] text-txt-muted">
              This is how your workspace will be labelled.
            </p>

            <input
              autoFocus
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                if (touched) setTouched(false);
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => setTouched(true)}
              placeholder="e.g. Jade Social Studio"
              maxLength={80}
              aria-label="Business name"
              aria-describedby={showNameError ? "name-error" : undefined}
              className={cn(
                "h-11 w-full rounded-lg border px-4 text-[13px] text-txt-primary bg-surface outline-none",
                "placeholder:text-txt-hint transition-colors duration-150",
                showNameError
                  ? "border-danger/50 bg-danger-bg focus:border-danger/60"
                  : "border-border focus:border-brand-rose/50 focus:ring-1 focus:ring-brand-rose/10"
              )}
            />
            {showNameError && (
              <p id="name-error" className="mt-1.5 text-[12px] text-danger">
                Please enter your business name.
              </p>
            )}

            <button
              type="button"
              onClick={handleContinue}
              className="mt-4 h-11 w-full rounded-lg bg-brand-rose text-[13px] font-medium text-white transition-colors hover:bg-brand-rose-deep disabled:cursor-default disabled:opacity-40"
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 2: Vertical ── */}
        {step === 2 && (
          <form action={formAction} className="flex flex-col">
            <input type="hidden" name="business_name" value={businessName} />
            <input type="hidden" name="timezone" value={timezone} />

            <div className="mb-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[12px] text-txt-muted transition-colors hover:text-txt-primary"
                aria-label="Go back"
              >
                ← Back
              </button>
              <span className="text-[12px] text-txt-hint">
                &middot; {businessName}
              </span>
            </div>

            <h2 className="font-display text-[22px] font-medium leading-snug text-txt-primary">
              How do you work?
            </h2>
            <p className="mb-5 mt-1.5 text-[13px] text-txt-muted">
              This personalises your workspace and feature set.
            </p>

            <VerticalOptions />

            {state?.error && (
              <p className="mt-3 text-[13px] text-danger">{state.error}</p>
            )}
          </form>
        )}
      </motion.div>
    </AuthShell>
  );
}
