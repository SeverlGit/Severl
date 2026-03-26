"use client";

import React from "react";
import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import AuthShell from "@/components/brand/AuthShell";

const ease = [0.16, 1, 0.3, 1] as const;

export default function SignInPage() {
  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.1 }}
        className="w-full max-w-[380px] overflow-hidden rounded-[14px] border border-white/[0.08] bg-[rgba(8,8,8,0.85)] p-7 backdrop-blur-[20px] backdrop-saturate-[180%]"
      >
        <SignIn signUpUrl="/sign-up" />
      </motion.div>
    </AuthShell>
  );
}
