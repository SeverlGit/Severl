import React from "react";
import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { getCurrentOrg } from "@/lib/auth";
import { getVerticalConfig } from "@/config/verticals";
import {
  getMonthlyDeliverables,
  computeDeliverableStats,
  getActiveOnboardingClientsForDeliverables,
} from "@/lib/deliverables/getDeliverableData";
import { getMonthCloseOutData } from "@/lib/deliverables/actions";
import { getTeamMembers } from "@/lib/clients/getClient360";
import { MonthNav } from "@/components/deliverables/MonthNav";
import { ClientSection } from "@/components/deliverables/ClientSection";
import { AlertStrip } from "@/components/dashboard/AlertStrip";
import { EmptyState } from "@/components/shared/EmptyState";
import { CloseOutDialogDynamic, StatusBoardDynamic } from "./DeliverablesDynamic";

type Props = {
  searchParams: Promise<{
    month?: string;
    view?: "client" | "status";
  }>;
};

export default async function DeliverablesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const org = await getCurrentOrg();
  const vertical = getVerticalConfig(org.vertical);
  const view = sp.view === "status" ? "status" : "client";

  const now = new Date();
  const monthParam = sp.month;
  const currentMonth = (() => {
    if (monthParam) {
      const parts = monthParam.split("-");
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
        return new Date(y, m - 1, 1);
      }
    }
    return new Date(now.getFullYear(), now.getMonth(), 1);
  })();

  const showAssignee = vertical.deliverables.showAssignee;
  const [deliverables, activeClients, closeOutData, teamMembers] = await Promise.all([
    getMonthlyDeliverables(org.id, currentMonth),
    getActiveOnboardingClientsForDeliverables(org.id),
    getMonthCloseOutData(org.id, currentMonth),
    showAssignee ? getTeamMembers(org.id) : Promise.resolve([]),
  ]);

  const stats = computeDeliverableStats(deliverables);

  const overdueItems = deliverables.filter(
    (d) => d.due_date && new Date(d.due_date) < new Date() && d.status !== "published",
  );

  const overdueClientNames = Array.from(
    new Set(overdueItems.map((d) => d.clients?.brand_name).filter(Boolean) as string[]),
  );

  const monthIso = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-01`;

  const groupedByClient = deliverables.reduce<
    Record<string, { brand_name: string; platforms: string[] | null; items: (typeof deliverables)[number][] }>
  >((acc, d) => {
    const clientId = d.client_id as string;
    if (!acc[clientId]) {
      acc[clientId] = {
        brand_name: d.clients?.brand_name ?? "Unknown",
        platforms: d.clients?.platforms ?? [],
        items: [],
      };
    }
    acc[clientId].items.push(d);
    return acc;
  }, {});

  const clientRows = activeClients.map((c) => {
    const g = groupedByClient[c.id];
    return {
      clientId: c.id,
      brandName: g?.brand_name ?? c.brand_name,
      platforms: g?.platforms ?? c.platforms,
      items: g?.items ?? [],
    };
  });

  const monthLabel = currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <MonthNav currentMonth={currentMonth} />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border border-border bg-surface text-[14px] uppercase tracking-[0.04em]">
            <a
              href={`/deliverables?month=${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}&view=client`}
              className={`px-3 py-1.5 ${view === "client" ? "bg-surface-hover text-brand-rose-deep" : "text-txt-muted"}`}
            >
              By {vertical.crm.clientLabel.toLowerCase()}
            </a>
            <a
              href={`/deliverables?month=${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}&view=status`}
              className={`px-3 py-1.5 ${view === "status" ? "bg-surface-hover text-brand-rose-deep" : "text-txt-muted"}`}
            >
              By status
            </a>
          </div>
          <CloseOutDialogDynamic
            orgId={org.id}
            month={currentMonth}
            verticalSlug={org.vertical}
            closeOutData={closeOutData}
          />
        </div>
      </header>

      <AlertStrip
        show={overdueItems.length > 0}
        tone="warning"
        message={`${overdueItems.length} deliverable${overdueItems.length === 1 ? "" : "s"} past due across ${overdueClientNames.length} client${overdueClientNames.length === 1 ? "" : "s"}${overdueClientNames.length ? ` — ${overdueClientNames.join(", ")}` : ""}`}
        href="/deliverables"
        linkLabel="View board →"
      />

      {activeClients.length === 0 ? (
        <div className="flex min-h-[min(360px,55vh)] items-center justify-center rounded-lg border border-border bg-surface px-6 py-16">
          <EmptyState
            icon={<CheckSquare className="h-10 w-10 text-txt-muted" />}
            title="No deliverables yet"
            description="Add clients to start managing their monthly deliverables."
            action={
              <Link href="/clients" className="text-sm text-brand-rose hover:underline">
                Add your first client →
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {deliverables.length === 0 && (
            <div
              role="status"
              className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-txt-secondary"
            >
              No deliverables for {monthLabel}. Add deliverables to your clients to get started.
            </div>
          )}

          {view === "client" && (
            <div className="flex flex-col gap-2">
              {clientRows.map((row) => (
                <ClientSection
                  key={row.clientId}
                  clientId={row.clientId}
                  brandName={row.brandName}
                  platforms={row.platforms}
                  deliverables={row.items}
                  stats={stats[row.clientId]}
                  orgId={org.id}
                  monthIso={monthIso}
                  vertical={vertical}
                  verticalSlug={org.vertical}
                  teamMembers={teamMembers}
                />
              ))}
            </div>
          )}

          {view === "status" && (
            <div className="rounded-md border border-border bg-surface px-3.5 py-3.5">
              <StatusBoardDynamic
                orgId={org.id}
                verticalSlug={org.vertical}
                deliverables={deliverables}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
