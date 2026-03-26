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
  danger: "border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.06)] text-[#f87171]",
  warning: "border-[rgba(250,204,21,0.25)] bg-[rgba(250,204,21,0.06)] text-[#facc15]",
  info: "border-brand-mint/25 bg-brand-mint/5 text-brand-mint",
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
