"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  monthStr: string; // "YYYY-MM"
};

export function MonthNav({ monthStr }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = (delta: number) => {
    const [y, m] = monthStr.split("-").map(Number);
    // new Date(y, m-1+delta, 1) is always local-time — no UTC serialization issue
    const next = new Date(y, m - 1 + delta, 1);
    const iso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", iso);
    router.push(`/deliverables?${params.toString()}`);
  };

  // Parse from integers so local-time Date is used — avoids UTC midnight → prev-day shift
  const [y, m] = monthStr.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString(undefined, {
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

