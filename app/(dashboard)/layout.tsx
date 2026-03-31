import React from "react";
import { getCurrentOrg } from "@/lib/auth";
import { VerticalConfigProvider } from "@/lib/vertical-config";
import LabelNav from "@/components/dashboard/LabelNav";
import Topbar from "@/components/dashboard/Topbar";
import { TopbarTitleProvider } from "@/components/dashboard/TopbarTitleContext";
import { PlanProvider } from "@/lib/billing/plan-context";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const org = await getCurrentOrg();
  
  // Count active clients to hydrate plan context limits
  const supabase = getSupabaseAdminClient();
  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id)
    .is("archived_at", null);

  const clientsUsed = count || 0;

  return (
    <VerticalConfigProvider verticalSlug={org.vertical}>
      <PlanProvider planTier={org.plan_tier} clientsUsed={clientsUsed}>
        <TopbarTitleProvider>
          <div className="flex h-screen overflow-hidden bg-page">
            <LabelNav org={org} orgId={org.id} />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Topbar />
              <div className="flex-1 overflow-auto">{children}</div>
            </div>
          </div>
        </TopbarTitleProvider>
      </PlanProvider>
    </VerticalConfigProvider>
  );
}
