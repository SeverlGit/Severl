import React from "react";
import { getCurrentOrg } from "@/lib/auth";
import { VerticalConfigProvider } from "@/lib/vertical-config";
import LabelNav from "@/components/dashboard/LabelNav";
import Topbar from "@/components/dashboard/Topbar";
import { TopbarTitleProvider } from "@/components/dashboard/TopbarTitleContext";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const org = await getCurrentOrg();

  return (
    <VerticalConfigProvider verticalSlug={org.vertical}>
      <TopbarTitleProvider>
        <div className="flex h-screen overflow-hidden bg-brand-navy">
          <LabelNav org={org} orgId={org.id} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar />
            <div className="flex-1 overflow-auto">{children}</div>
          </div>
        </div>
      </TopbarTitleProvider>
    </VerticalConfigProvider>
  );
}
