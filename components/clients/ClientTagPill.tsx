"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";

type Props = {
  tag: string;
  className?: string;
};

const tagVariant: Record<string, BadgeProps["variant"]> = {
  at_risk: "red",
  prospect: "muted",
  onboarding: "green",
  paused: "muted",
  churned: "muted",
};

export function ClientTagPill({ tag, className }: Props) {
  if (tag === "active") return null;

  const variant = tagVariant[tag] ?? "default";
  const extraClass = tag === "paused" ? "italic" : tag === "churned" ? "line-through" : "";

  return (
    <Badge variant={variant} className={`${extraClass} ${className ?? ""} text-white`}>
      {tag.replace("_", " ")}
    </Badge>
  );
}
