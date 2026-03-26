"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function isActionLink(
  a: unknown
): a is { label: string; href: string } {
  return (
    typeof a === "object" &&
    a !== null &&
    "href" in a &&
    "label" in a &&
    typeof (a as { href: unknown }).href === "string" &&
    typeof (a as { label: unknown }).label === "string"
  );
}

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Link (`{ label, href }`) or custom node (e.g. `<Link>…</Link>`) */
  action?: { label: string; href: string } | React.ReactNode;
  /** Custom action node — takes precedence over `action` when set */
  actionNode?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionNode,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        className
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center text-txt-hint [&>svg]:h-10 [&>svg]:w-10">
        {icon}
      </div>
      <h3 className="text-base font-medium text-txt-secondary">{title}</h3>
      <p className="mt-1 max-w-xs text-center text-sm text-txt-muted">
        {description}
      </p>
      {actionNode ? (
        <div className="mt-3">{actionNode}</div>
      ) : action ? (
        isActionLink(action) ? (
          <Link
            href={action.href}
            className="mt-3 text-sm text-brand-mint hover:underline"
          >
            {action.label}
          </Link>
        ) : (
          <div className="mt-3">{action}</div>
        )
      ) : null}
    </div>
  );
}
