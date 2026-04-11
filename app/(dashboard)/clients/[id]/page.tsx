import React from "react";
import { getCurrentOrg } from "@/lib/auth";
import { getVerticalConfig } from "@/config/verticals";
import {
  getClient360,
  getClientActivity,
  getClientDeliverables,
  getClientInvoices,
  getClientNotes,
  getTeamMembers,
  getTeamMembersAll,
  getTeamMemberDeliverableCount,
} from "@/lib/clients/getClient360";
import { getBrandAssets } from "@/lib/clients/getBrandAssets";
import { Client360ClientLoader } from "./Client360ClientLoader";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ClientProfilePage({ params, searchParams }: Props) {
  const { id: clientId } = await params;
  const { tab: tabParam } = await searchParams;
  const org = await getCurrentOrg();
  const vertical = getVerticalConfig(org.vertical);
  const showTeam = vertical.crm.profileSections.includes("team");

  const [client, activity, deliverables, invoices, notes, teamMembers, teamMembersAll, teamCounts, brandAssets] = await Promise.all([
    getClient360(clientId, org.id),
    getClientActivity(clientId, org.id),
    getClientDeliverables(clientId, org.id, new Date()),
    getClientInvoices(clientId, org.id),
    getClientNotes(clientId, org.id),
    showTeam ? getTeamMembers(org.id) : Promise.resolve([]),
    showTeam ? getTeamMembersAll(org.id) : Promise.resolve([]),
    showTeam ? getTeamMemberDeliverableCount(org.id) : Promise.resolve({}),
    getBrandAssets(clientId, org.id),
  ]);

  if (!client) {
    return <div className="p-4 text-[10px] text-txt-muted">{vertical.crm.clientLabel} not found.</div>;
  }

  const tab = tabParam ?? "overview";

  return (
    <Client360ClientLoader
      client={client}
      activity={activity}
      deliverables={deliverables}
      invoices={invoices}
      notes={notes}
      vertical={vertical}
      orgId={org.id}
      verticalSlug={org.vertical}
      clientId={clientId}
      activeTab={tab}
      teamMembers={teamMembers}
      teamMembersForManagement={teamMembersAll}
      teamDeliverableCounts={teamCounts as Record<string, number>}
      brandAssets={brandAssets}
    />
  );
}
