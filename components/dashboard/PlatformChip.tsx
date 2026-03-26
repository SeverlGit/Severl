"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

type Props = {
  label: string;
  className?: string;
};

export function PlatformChip({ label, className }: Props) {
  return (
    <Badge variant="muted" className={className}>
      {label}
    </Badge>
  );
}
