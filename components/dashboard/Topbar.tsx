"use client";

import React, { useMemo } from "react";
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
    <div className="flex h-[50px] shrink-0 items-center border-b border-border-subtle bg-brand-navy px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span key={path} className="truncate text-sm font-medium text-txt-primary">
          {title}
        </span>
        <span className="shrink-0 font-mono text-xs text-txt-muted" suppressHydrationWarning>
          {dateStr}
        </span>
      </div>
    </div>
  );
}
