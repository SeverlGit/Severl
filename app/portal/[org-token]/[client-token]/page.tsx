import { notFound } from "next/navigation";
import { getPortalData } from "@/lib/portal/getPortalData";
import { PortalClient } from "./PortalClient";

type Props = {
  params: Promise<{ "org-token": string; "client-token": string }>;
};

export default async function PortalPage({ params }: Props) {
  const { "org-token": orgToken, "client-token": clientToken } = await params;

  const data = await getPortalData(orgToken, clientToken);
  if (!data) notFound();

  return (
    <PortalClient
      org={data.org}
      client={data.client}
      brandAssets={data.brandAssets}
      pendingDeliverables={data.pendingDeliverables}
      invoices={data.invoices}
      activity={data.activity}
    />
  );
}
