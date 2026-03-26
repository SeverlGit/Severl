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
  const deltaColor = (tone?: string) => {
    switch (tone) {
      case "green": return "text-brand-mint";
      case "red": return "text-danger";
      case "amber": return "text-warning";
      default: return "text-txt-muted";
    }
  };

  return (
    <motion.div
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="flex h-[36px] shrink-0 items-center gap-5 overflow-hidden border-t border-border-subtle bg-brand-navy px-4"
    >
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <div className="h-2.5 w-px shrink-0 bg-border" />}
          <div className="flex shrink-0 items-center gap-[5px]">
            <span className="text-[12px] uppercase tracking-[0.05em] text-txt-muted">
              {item.label}
            </span>
            <span className="font-mono text-[14px] tabular-nums text-txt-primary">{item.value}</span>
            {item.delta && (
              <span className={`font-mono text-[12px] tabular-nums ${deltaColor(item.deltaTone)}`}>
                {item.delta}
              </span>
            )}
          </div>
        </React.Fragment>
      ))}
    </motion.div>
  );
}
