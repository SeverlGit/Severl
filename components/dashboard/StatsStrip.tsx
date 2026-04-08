"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkline } from "@/components/shared/Sparkline";

type StatCell = {
  label: string;
  value: number;
  format: "currency" | "number" | "text";
  displayValue?: string;
  delta?: string;
  deltaTone?: "green" | "red" | "neutral";
  href?: string;
  sparkline?: number[];
  sparklineColor?: string;
  accentClass?: string;
};

type Props = {
  stats: StatCell[];
};

function useCountUp(target: number, duration: number = 1000) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return current;
}

function StatCellDisplay({ stat }: { stat: StatCell }) {
  const animatedValue = useCountUp(
    stat.format === "text" ? 0 : stat.value,
    1000,
  );

  const displayValue =
    stat.format === "text"
      ? stat.displayValue ?? String(stat.value)
      : stat.format === "currency"
        ? `$${animatedValue.toLocaleString()}`
        : String(animatedValue);

  const isOnTrack = stat.format === "text";

  const inner = (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-4 group">
      {/* Top accent strip */}
      {stat.accentClass && (
        <span className={`absolute inset-x-0 top-0 h-[2px] ${stat.accentClass}`} />
      )}
      <div className="mb-2 font-sans text-[9px] font-semibold uppercase tracking-[0.10em] text-txt-muted">
        {stat.label}
      </div>
      <div
        className={
          isOnTrack
            ? "font-display font-light italic text-[24px] leading-none text-success"
            : "font-display font-normal text-[36px] leading-none tracking-[-0.03em] text-txt-primary tabular-nums"
        }
      >
        {displayValue}
        {stat.href && (
          <span className="ml-1 text-[12px] text-txt-hint opacity-0 transition-opacity group-hover:opacity-100">
            →
          </span>
        )}
      </div>
      {stat.delta && (
        <div
          className={`mt-1.5 font-sans text-[10px] tabular-nums ${
            stat.deltaTone === "green"
              ? "text-success"
              : stat.deltaTone === "red"
                ? "text-danger"
                : "text-txt-muted"
          }`}
        >
          {stat.delta}
        </div>
      )}
      {stat.sparkline && stat.sparkline.length >= 2 && (
        <div className="pointer-events-none absolute bottom-2 right-3 opacity-40">
          <Sparkline data={stat.sparkline} color={stat.sparklineColor ?? "#C4909A"} />
        </div>
      )}
    </div>
  );

  if (stat.href) {
    return (
      <Link
        href={stat.href}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose/40 focus-visible:ring-offset-1"
        aria-label={`${stat.label}: ${displayValue}${stat.delta ? `, ${stat.delta}` : ''}`}
      >
        {inner}
      </Link>
    );
  }
  return <div>{inner}</div>;
}

export function StatsStrip({ stats }: Props) {
  return (
    <div className="grid shrink-0 grid-cols-3 gap-3 px-4 py-3">
      {stats.map((stat) => (
        <StatCellDisplay key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
