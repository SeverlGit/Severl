import React from "react";
import dynamic from "next/dynamic";
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
import { Client360Skeleton } from "@/components/shared/Client360Skeleton";

const Client360Client = dynamic(
  () => import("./Client360Client"),
  { ssr: false, loading: () => <Client360Skeleton /> },
);

type Props = {
  params: { id: string };
  searchParams: { tab?: string };
};

export default async function ClientProfilePage({ params, searchParams }: Props) {
  const org = await getCurrentOrg();
  const vertical = getVerticalConfig(org.vertical);
  const showTeam = vertical.crm.profileSections.includes("team");

  const [client, activity, deliverables, invoices, notes, teamMembers, teamMembersAll, teamCounts] = await Promise.all([
    getClient360(params.id, org.id),
    getClientActivity(params.id, org.id),
    getClientDeliverables(params.id, org.id, new Date()),
    getClientInvoices(params.id, org.id),
    getClientNotes(params.id, org.id),
    showTeam ? getTeamMembers(org.id) : Promise.resolve([]),
    showTeam ? getTeamMembersAll(org.id) : Promise.resolve([]),
    showTeam ? getTeamMemberDeliverableCount(org.id) : Promise.resolve({}),
  ]);

  if (!client) {
    return <div className="p-4 text-[10px] text-txt-muted">{vertical.crm.clientLabel} not found.</div>;
  }

  const tab = searchParams.tab ?? "overview";

  return (
    <Client360Client
      client={client}
      activity={activity}
      deliverables={deliverables}
      invoices={invoices}
      notes={notes}
      vertical={vertical}
      orgId={org.id}
      verticalSlug={org.vertical}
      clientId={params.id}
      activeTab={tab}
      teamMembers={teamMembers}
      teamMembersForManagement={teamMembersAll}
      teamDeliverableCounts={teamCounts as Record<string, number>}
    />
  );
}
