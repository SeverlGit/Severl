"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  currentMonth: Date;
};

export function MonthNav({ currentMonth }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = (delta: number) => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + delta);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", iso);
    router.push(`/deliverables?${params.toString()}`);
  };

  const label = currentMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="rounded-full border border-border px-2 py-1 text-[12px] text-txt-secondary transition-colors hover:border-border-strong hover:text-txt-primary"
        aria-label="Previous month"
      >
        ←
      </button>
      <span className="font-sans text-sm font-medium text-txt-primary">
        {label}
      </span>
      <button
        type="button"
        onClick={() => navigate(1)}
        className="rounded-full border border-border px-2 py-1 text-[12px] text-txt-secondary transition-colors hover:border-border-strong hover:text-txt-primary"
        aria-label="Next month"
      >
        →
      </button>
    </div>
  );
}

