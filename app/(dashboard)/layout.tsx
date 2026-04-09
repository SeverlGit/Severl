import React, { Suspense } from "react";
import { getCurrentOrg } from "@/lib/auth";
import { VerticalConfigProvider } from "@/lib/vertical-config";
import LabelNav from "@/components/dashboard/LabelNav";
import Topbar from "@/components/dashboard/Topbar";
import { TopbarTitleProvider } from "@/components/dashboard/TopbarTitleContext";
import { PlanProvider } from "@/lib/billing/plan-context";
import { PrefsProvider } from "@/lib/prefs-context";
import { TourProvider } from "@/lib/tour-context";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { NavigationProgress } from "@/components/dashboard/NavigationProgress";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const org = await getCurrentOrg();
  
  // Fetch counts in parallel for limits and contextual milestones
  const supabase = getSupabaseAdminClient();
  const [
    { count: clientCountRes },
    { count: deliverableCountRes },
    { count: invoiceCountRes }
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("org_id", org.id).is("archived_at", null),
    supabase.from("deliverables").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("org_id", org.id)
  ]);

  const clientsUsed = clientCountRes || 0;
  const metrics = {
    clients: clientsUsed,
    deliverables: deliverableCountRes || 0,
    invoices: invoiceCountRes || 0,
  };

  return (
    <VerticalConfigProvider verticalSlug={org.vertical}>
      <PlanProvider planTier={org.plan_tier} clientsUsed={clientsUsed}>
        <PrefsProvider>
          <TourProvider uiMeta={org.ui_meta || {}} metrics={metrics}>
            <TopbarTitleProvider>
              <Suspense fallback={null}>
                <NavigationProgress />
              </Suspense>
              <div className="flex h-screen overflow-hidden bg-page">
                <LabelNav org={org} orgId={org.id} />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <Topbar />
                  <div className="flex-1 overflow-auto">{children}</div>
                </div>
              </div>
            </TopbarTitleProvider>
          </TourProvider>
        </PrefsProvider>
      </PlanProvider>
    </VerticalConfigProvider>
  );
}
