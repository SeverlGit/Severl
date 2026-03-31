"use client";

import React, { useState } from "react";
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
  const showTeamNav = vertical.slug === "smm_agency";

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
        <div className="flex flex-col w-full items-center justify-center pt-3 pb-1 gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-gradient-to-br from-brand-rose to-brand-plum font-display text-[13px] font-medium text-white shadow-sm">
                S
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{org.name}</p>
              <p className="text-[11px] text-txt-muted">{vertical.name}</p>
            </TooltipContent>
          </Tooltip>

          <div className={`rounded mr-1.5 ml-1.5 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider ${planTier === 'essential' ? 'bg-surface-hover text-txt-muted' :
            planTier === 'pro' ? 'bg-brand-rose-dim text-brand-rose-deep' :
              planTier === 'elite' ? 'bg-brand-plum-dim text-brand-plum-deep' :
                'bg-brand-plum text-white'
            }`}>
            {planTier}
          </div>
        </div>

        <nav className="flex w-full flex-col items-center gap-1 pt-2">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
            const isHome = item.href === "/" && pathname === "/";
            const isActive = active || isHome;
            const label = item.key === "dashboard" ? "Dashboard" : resolveLabel(item.key);
            const Icon = item.icon;

            return (
              <React.Fragment key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={`relative flex h-9 w-full items-center justify-center transition-colors duration-150 ease-out ${isActive
                        ? "bg-[rgba(221,180,188,0.10)] text-[#DDB4BC]"
                        : "text-white/30 hover:text-white/60"
                        }`}
                      aria-label={label}
                    >
                      {isActive && (
                        <span className="absolute left-0 h-5 w-[3px] rounded-r bg-brand-rose" />
                      )}
                      <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2 : 1.5} />
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
                        className="relative flex h-9 w-full items-center justify-center text-white/30 transition-colors duration-150 ease-out hover:text-white/60"
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

        <div className="mt-auto pb-3">
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
