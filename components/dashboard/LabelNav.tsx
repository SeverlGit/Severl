"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/dashboard/UserNav";
import type { OrgRecord } from "@/lib/auth";
import { useVerticalConfig } from "@/lib/vertical-config";
import { usePlan } from "@/lib/billing/plan-context";
import { TeamManagementDialog } from "@/components/clients/TeamManagementDialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Contact,
  Users,
  ListChecks,
  Receipt,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/", key: "dashboard", labelKey: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", key: "clients", labelKey: "Clients", icon: Contact },
  { href: "/deliverables", key: "deliverables", labelKey: "Deliverables", icon: ListChecks },
  { href: "/invoices", key: "invoices", labelKey: "Invoices", icon: Receipt },
  { href: "/analytics", key: "analytics", labelKey: "Analytics", icon: BarChart3 },
] as const;

type Props = { org: OrgRecord; orgId: string };

export default function LabelNav({ org, orgId }: Props) {
  const pathname = usePathname();
  const vertical = useVerticalConfig();
  const { planTier } = usePlan();
  const clientsLabel = vertical.crm.clientsLabel;
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const showTeamNav = vertical.slug === "smm_agency";

  // Clear optimistic state once route actually changes
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const resolveLabel = (itemKey: (typeof navItems)[number]["key"]): string => {
    switch (itemKey) {
      case "clients":
        return clientsLabel;
      default:
        return navItems.find((n) => n.key === itemKey)?.labelKey ?? "";
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="flex h-screen w-[54px] shrink-0 flex-col items-center border-r border-white/5 bg-sidebar">
        {/* Logo mark */}
        <div className="flex w-full items-center justify-center pt-3 pb-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-gradient-to-br from-brand-rose to-brand-plum font-display text-[13px] font-medium text-white shadow-sm cursor-default select-none">
                S
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex flex-col gap-1 p-3">
              <p className="font-semibold text-[13px] text-txt-primary leading-none">{org.name}</p>
              <p className="text-[11px] text-txt-muted">{vertical.name}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                  planTier === 'essential' ? 'bg-surface-hover text-txt-secondary' :
                  planTier === 'pro'       ? 'bg-brand-rose-dim text-brand-rose-deep' :
                  planTier === 'elite'     ? 'bg-brand-plum-dim text-brand-plum-deep' :
                                            'bg-brand-plum text-white'
                }`}>
                  {planTier}
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <nav className="flex w-full flex-col items-center gap-1 pt-2">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
            const isHome = item.href === "/" && pathname === "/";
            const isActive = active || isHome;
            const isPending = pendingHref === item.href && !isActive;
            const label = item.key === "dashboard" ? "Dashboard" : resolveLabel(item.key);
            const Icon = item.icon;

            return (
              <React.Fragment key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      id={`tour-nav-${item.key}`}
                      href={item.href}
                      onClick={() => setPendingHref(item.href)}
                      className={`relative flex h-9 w-full items-center justify-center transition-colors duration-150 ease-out ${
                        isPending
                          ? "bg-[rgba(221,180,188,0.07)] text-[#DDB4BC]/70"
                          : isActive
                          ? "bg-[rgba(221,180,188,0.10)] text-[#DDB4BC]"
                          : "text-white/50 hover:text-white/75"
                      }`}
                      aria-label={label}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {(isActive || isPending) && (
                        <span className={`absolute left-0 h-5 w-[3px] rounded-r bg-brand-rose transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`} />
                      )}
                      <Icon className="h-[18px] w-[18px]" strokeWidth={isActive || isPending ? 2 : 1.5} />
                      {isPending && (
                        <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-brand-rose animate-pulse" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>

                {item.key === "clients" && showTeamNav && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setTeamDialogOpen(true)}
                        className="relative flex h-9 w-full items-center justify-center text-white/50 transition-colors duration-150 ease-out hover:text-white/75"
                        aria-label="Team"
                      >
                        <Users className="h-[18px] w-[18px]" strokeWidth={1.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Team</TooltipContent>
                  </Tooltip>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {showTeamNav && (
          <TeamManagementDialog
            orgId={orgId}
            open={teamDialogOpen}
            onOpenChange={setTeamDialogOpen}
          />
        )}

        <div id="tour-nav-settings" className="mt-auto pb-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <UserNav />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Account</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
