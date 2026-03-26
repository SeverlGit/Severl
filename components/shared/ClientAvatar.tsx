"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ClientTag = "active" | "at_risk" | "prospect" | "onboarding" | "paused" | "churned";

type Props = {
  name: string;
  tag?: ClientTag | string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const tagStyles: Record<string, string> = {
  active: "bg-[rgba(110,231,183,0.10)] text-[#6EE7B7]",
  at_risk: "bg-[rgba(248,113,113,0.10)] text-[#f87171]",
  prospect: "bg-[rgba(255,255,255,0.06)] text-txt-hint",
  onboarding: "bg-[rgba(110,231,183,0.10)] text-brand-mint",
  paused: "bg-[rgba(255,255,255,0.06)] text-txt-hint",
  churned: "bg-[rgba(255,255,255,0.06)] text-txt-hint",
};

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-[12px]",
  lg: "h-10 w-10 text-[14px]",
};

export function ClientAvatar({ name, tag, size = "md", className }: Props) {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const colorStyle = tag ? (tagStyles[tag] ?? tagStyles.prospect) : "bg-[rgba(255,255,255,0.06)] text-txt-hint";

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className={cn(colorStyle)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
