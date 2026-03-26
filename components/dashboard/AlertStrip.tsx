"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type AlertStripProps = {
  show: boolean;
  tone: "danger" | "warning" | "info";
  message: string;
  href: string;
  linkLabel: string;
};

const toneMap = {
  danger:  "border-danger/20 bg-danger-bg text-danger",
  warning: "border-warning/20 bg-warning-bg text-warning",
  info:    "border-brand-rose/25 bg-brand-rose-dim text-brand-rose-deep",
};

export function AlertStrip({ show, tone, message, href, linkLabel }: AlertStripProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`flex items-center justify-between rounded-md border px-3 py-2 text-[13px] ${toneMap[tone]}`}
        >
          <span>{message}</span>
          <Link href={href} className="text-[12px] underline-offset-2 hover:underline">
            {linkLabel}
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
