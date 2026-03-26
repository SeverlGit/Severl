"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import SeverlLogo from "./SeverlLogo";

const ease = [0.16, 1, 0.3, 1] as const;

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches && videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover opacity-[0.35]"
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/30 to-black/60" />

      <div className="relative z-[2] flex min-h-screen w-full flex-col items-center justify-center gap-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="flex flex-col items-center"
        >
          <SeverlLogo />
          <h1 className="mt-[10px] text-[31px] font-medium tracking-[-0.02em] text-white">
            Severl
          </h1>
          <p className="mt-1 text-[14px] font-light text-white/40">
            The OS for social media managers
          </p>
        </motion.div>

        {children}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease, delay: 0.3 }}
          className="flex items-center gap-4"
        >
          <Link href="/privacy" className="text-[12px] text-white/20">
            Privacy
          </Link>
          <span className="text-[12px] text-white/[0.15]">·</span>
          <Link href="/terms" className="text-[12px] text-white/20">
            Terms
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
