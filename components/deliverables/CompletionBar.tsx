"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";

type Props = {
  total: number;
  published: number;
  className?: string;
};

export function CompletionBar({ total, published, className }: Props) {
  const pct = total === 0 ? 0 : (published / total) * 100;
  const indicatorClass = pct >= 90 ? "bg-[#6EE7B7]" : pct >= 70 ? "bg-[#facc15]" : "bg-[#f87171]";

  return (
    <Progress
      value={Math.min(100, pct)}
      className={`h-[3px] w-24 ${className ?? ""}`}
      indicatorClassName={indicatorClass}
    />
  );
}
