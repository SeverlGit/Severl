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

function StatCellDisplay({ stat, isLast }: { stat: StatCell; isLast: boolean }) {
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

  const deltaColor =
    stat.deltaTone === "green"
      ? "text-brand-mint"
      : stat.deltaTone === "red"
        ? "text-danger"
        : "text-txt-muted";

  const inner = (
    <div className="relative">
      <div className="text-[10px] font-medium uppercase tracking-wider text-txt-muted">
        {stat.label}
      </div>
      <div className="flex items-baseline gap-1 text-3xl font-mono font-medium tabular-nums text-txt-primary">
        {displayValue}
        {stat.href && <span className="text-[12px] text-txt-hint opacity-0 transition-opacity group-hover:opacity-100">→</span>}
      </div>
      {stat.delta && (
        <div className={`mt-0.5 text-xs font-mono tabular-nums ${deltaColor}`}>
          {stat.delta}
        </div>
      )}
      {stat.sparkline && stat.sparkline.length >= 2 && (
        <div className="pointer-events-none absolute bottom-1 right-2 opacity-50">
          <Sparkline data={stat.sparkline} color={stat.sparklineColor ?? "#6EE7B7"} />
        </div>
      )}
    </div>
  );

  const cls = `px-4 py-2.5 ${isLast ? "" : "border-r border-border-subtle"} group cursor-pointer border-b border-transparent transition-colors hover:border-b-[rgba(255,255,255,0.10)]`;

  if (stat.href) {
    return <Link href={stat.href} className={cls}>{inner}</Link>;
  }
  return <div className={cls}>{inner}</div>;
}

export function StatsStrip({ stats }: Props) {
  return (
    <div className="grid shrink-0 grid-cols-3 border-b border-border-subtle bg-brand-navy">
      {stats.map((stat, i) => (
        <StatCellDisplay key={stat.label} stat={stat} isLast={i === stats.length - 1} />
      ))}
    </div>
  );
}
