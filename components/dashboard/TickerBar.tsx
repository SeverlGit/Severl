"use client";

import React from "react";
import { motion } from "framer-motion";

type TickerItem = {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "green" | "red" | "amber" | "neutral";
};

type Props = {
  items: TickerItem[];
};

export function TickerBar({ items }: Props) {
  return (
    <motion.div
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="flex h-[34px] shrink-0 items-center gap-5 overflow-hidden border-t border-white/5 bg-sidebar px-4"
    >
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <div className="h-[14px] w-px shrink-0 bg-white/[0.07]" />}
          <div className="flex shrink-0 items-center gap-[5px]">
            <span className="font-sans font-semibold text-[8.5px] uppercase tracking-[0.08em] text-white/[0.28]">
              {item.label}
            </span>
            <span className="font-sans font-medium text-[11px] tabular-nums text-white/75">
              {item.value}
            </span>
            {item.delta && (
              <span className="rounded bg-brand-rose/[0.18] px-1 text-[8.5px] font-medium tabular-nums text-brand-rose-mid">
                {item.delta}
              </span>
            )}
          </div>
        </React.Fragment>
      ))}
    </motion.div>
  );
}
