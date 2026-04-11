import React from "react";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentOrg } from "@/lib/auth";
import { getVerticalConfig } from "@/config/verticals";
import { getHomeData } from "@/lib/dashboard/getHomeData";
import { DashboardClientLoader } from "./DashboardClientLoader";

export default async function DashboardHomePage() {
  const org = await getCurrentOrg();
  const user = await currentUser();
  const firstName = user?.firstName ?? "";

  const vertical = getVerticalConfig(org.vertical);
  const {
    mrr,
    activeClients,
    deliverablesBehind,
    atRiskCount,
    overdue,
    renewalsCount,
    deliverablesWeek,
    mrrTrend,
    mrrSparkline,
    clientSparkline,
    recentInvoices,
    renewalsList,
    churnRiskScores,
  } = await getHomeData(org.id);

  const latest = mrrTrend[mrrTrend.length - 1]?.mrr ?? 0;
  const prev = mrrTrend[mrrTrend.length - 2]?.mrr ?? 0;
  const mrrDelta = latest - prev;
  const mrrDeltaPct = prev > 0 ? ((mrrDelta / prev) * 100).toFixed(1) : "0";

  const avgRetainer = activeClients > 0 ? Math.round(mrr / activeClients) : 0;

  return (
    <DashboardClientLoader
      firstName={firstName}
      mrr={mrr}
      activeClients={activeClients}
      deliverablesBehind={deliverablesBehind}
      atRiskCount={atRiskCount}
      overdue={overdue}
      renewalsCount={renewalsCount}
      mrrTrend={mrrTrend}
      mrrDelta={mrrDelta}
      mrrDeltaPct={mrrDeltaPct}
      avgRetainer={avgRetainer}
      renewalsList={renewalsList}
      deliverablesWeek={deliverablesWeek}
      recentInvoices={recentInvoices}
      clientsLabel={vertical.crm.clientsLabel}
      mrrSparkline={mrrSparkline}
      clientSparkline={clientSparkline}
      churnRiskScores={churnRiskScores}
    />
  );
}

