import React from "react";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";

type TagTone = "green" | "red" | "amber" | "blue" | "muted";

type Props = {
  children: React.ReactNode;
  tone?: TagTone;
  className?: string;
};

const toneToVariant: Record<TagTone, BadgeProps["variant"]> = {
  green: "green",
  red: "red",
  amber: "amber",
  blue: "green",
  muted: "muted",
};

export function Tag({ children, tone = "muted", className = "" }: Props) {
  return (
    <Badge variant={toneToVariant[tone]} className={className}>
      {children}
    </Badge>
  );
}
