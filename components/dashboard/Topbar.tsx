"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVerticalConfig } from "@/lib/vertical-config";
import type { AnyVerticalConfig } from "@/lib/vertical-config";
import { useTopbarDetailTitle } from "@/components/dashboard/TopbarTitleContext";

function normalizePathname(pathname: string | null): string {
  if (!pathname) return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function resolveTopbarTitle(
  path: string,
  vertical: AnyVerticalConfig,
  detailTitle: string | null,
): string {
  if (path === "/") return "Dashboard";
  if (path === "/clients") return vertical.crm.clientsLabel;
  if (path.startsWith("/clients/")) {
    const rest = path.slice("/clients/".length);
    if (rest && !rest.includes("/")) {
      return detailTitle?.trim() || vertical.crm.clientLabel;
    }
    return vertical.crm.clientLabel;
  }
  if (path === "/deliverables") return "Deliverables";
  if (path === "/invoices") return "Invoices";
  if (path === "/analytics") return "Analytics";
  return "Dashboard";
}

export default function Topbar() {
  const pathname = usePathname();
  const vertical = useVerticalConfig();
  const { detailTitle } = useTopbarDetailTitle();

  const path = normalizePathname(pathname);
  const title = useMemo(
    () => resolveTopbarTitle(path, vertical, detailTitle),
    [path, vertical, detailTitle],
  );

  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex h-12 shrink-0 items-center border-b border-border bg-panel px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span key={path} className="truncate font-sans font-semibold text-[13px] text-txt-primary tracking-tight">
          {title}
        </span>
        <span className="shrink-0 text-border-strong">·</span>
        <span
          className="shrink-0 font-sans text-[10.5px] text-txt-muted tabular-nums"
          suppressHydrationWarning
        >
          {dateStr}
        </span>
        <span className="relative ml-1 flex h-[5px] w-[5px] shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-success-bg opacity-75" />
          <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-success" />
        </span>
      </div>
      <Link
        href="/clients"
        className="text-[11px] font-medium px-3 py-1 rounded-sm border border-brand-rose/25 bg-brand-rose-dim text-brand-rose-deep transition-colors hover:bg-brand-rose/10"
      >
        + Add client
      </Link>
    </div>
  );
}
