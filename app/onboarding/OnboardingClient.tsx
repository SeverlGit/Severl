"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useFormState, useFormStatus } from "react-dom";
import { createOrg } from "./actions";
import AuthShell from "@/components/brand/AuthShell";

type Step = 1 | 2;

const initialState = { error: undefined as string | undefined };
const ease = [0.16, 1, 0.3, 1] as const;

function SoloIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="#6EE7B7" strokeWidth="1.5" />
      <path
        d="M2.5 14.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
        stroke="#6EE7B7"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
      <circle cx="7" cy="4.5" r="2.5" stroke="#6EE7B7" strokeWidth="1.5" />
      <path
        d="M2 14c0-2.5 2-4.5 5-4.5s5 2 5 4.5"
        stroke="#6EE7B7"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="13" cy="5.5" r="2" stroke="#6EE7B7" strokeWidth="1.2" />
      <path
        d="M13.5 9.5c1.8.3 3.5 1.5 3.5 3.5"
        stroke="#6EE7B7"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VerticalOptions() {
  const { pending } = useFormStatus();

  const options = [
    {
      key: "smm_freelance" as const,
      icon: <SoloIcon />,
      iconBg: "rgba(110,231,183,0.12)",
      title: "I work solo",
      subtitle: "Freelance · up to 10 clients",
    },
    {
      key: "smm_agency" as const,
      icon: <TeamIcon />,
      iconBg: "rgba(110,231,183,0.12)",
      title: "I run a team",
      subtitle: "Agency · team management",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-[10px]">
        {options.map((option, index) => (
          <motion.button
            key={option.key}
            type="submit"
            name="vertical"
            value={option.key}
            disabled={pending}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: index * 0.06 }}
            className="flex flex-col rounded-[10px] border border-white/[0.08] bg-white/[0.04] p-5 text-left transition-colors hover:border-[rgba(110,231,183,0.20)] hover:bg-[rgba(110,231,183,0.05)] disabled:cursor-wait disabled:opacity-60"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-[7px]"
              style={{ background: option.iconBg }}
            >
              {option.icon}
            </div>
            <span className="mt-3 text-[14px] font-medium text-white">
              {option.title}
            </span>
            <span className="mt-1 text-[12px] text-white/40">
              {option.subtitle}
            </span>
          </motion.button>
        ))}
      </div>

      {pending && (
        <p className="mt-3 text-center text-[12px] text-white/40">
          Creating your workspace…
        </p>
      )}
    </>
  );
}

export default function OnboardingClient() {
  const [step, setStep] = useState<Step>(1);
  const [businessName, setBusinessName] = useState("");
  const [touched, setTouched] = useState(false);
  const [state, formAction] = useFormState(createOrg, initialState);

  const [timezone] = useState(() =>
    typeof window !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC",
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.1 }}
        className="w-full max-w-[420px] rounded-[14px] border border-white/[0.08] bg-[rgba(8,8,8,0.85)] p-7 backdrop-blur-[20px] backdrop-saturate-[180%]"
      >
        {step === 1 && (
          <div className="flex flex-col">
            <h2 className="text-[13px] font-medium tracking-[-0.02em] text-white">
              What&apos;s your business called?
            </h2>
            <p className="mb-5 mt-1.5 text-[13px] text-white/40">
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
              placeholder="e.g. Severl Social Studio"
              maxLength={80}
              aria-label="Business name"
              aria-describedby={showNameError ? "name-error" : undefined}
              className={[
                "h-12 w-full rounded-lg px-4 text-[13px] text-white outline-none",
                "transition-[border-color,background] duration-150",
                "placeholder:text-white/25",
                showNameError
                  ? "border border-red-400/40 bg-red-400/[0.06]"
                  : "border border-white/10 bg-white/[0.06] focus:border-[rgba(110,231,183,0.40)] focus:bg-white/[0.08]",
              ].join(" ")}
            />
            {showNameError && (
              <p id="name-error" className="mt-1.5 text-[12px] text-[#f87171]">
                Please enter your business name.
              </p>
            )}
            <button
              type="button"
              onClick={handleContinue}
              disabled={touched && !isNameValid}
              className="mt-3 h-11 w-full rounded-lg bg-[#6EE7B7] text-[13px] font-medium text-[#0D1B2A] transition-colors hover:bg-[#5DD4A4] disabled:cursor-default disabled:bg-[rgba(110,231,183,0.3)] disabled:hover:bg-[rgba(110,231,183,0.3)]"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <form action={formAction} className="flex flex-col">
            <input type="hidden" name="business_name" value={businessName} />
            <input type="hidden" name="timezone" value={timezone} />

            <div className="mb-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[12px] text-white/[0.35] transition-colors hover:text-white"
                aria-label="Go back"
              >
                ← Back
              </button>
            </div>

            <h2 className="text-[13px] font-medium tracking-[-0.02em] text-white">
              How do you work?
            </h2>
            <p className="mb-5 mt-1.5 text-[13px] text-white/40">
              This personalises your workspace.
            </p>

            <VerticalOptions />

            {state?.error && (
              <p className="mt-3 text-[13px] text-[#f87171]">
                {state.error}
              </p>
            )}
          </form>
        )}
      </motion.div>
    </AuthShell>
  );
}
