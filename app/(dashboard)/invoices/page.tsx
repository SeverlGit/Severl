import React from "react";
import dynamic from "next/dynamic";
import { getCurrentOrg } from "@/lib/auth";
import { getVerticalConfig } from "@/config/verticals";
import {
  getInvoices,
  getInvoiceSummary,
  getInvoiceCountsByStatus,
  getClientsForInvoiceCreation,
} from "@/lib/invoicing/getInvoicesData";
import { getBatchBillingClients } from "@/lib/invoicing/getBatchBillingData";
import { InvoicesSkeleton } from "@/components/shared/InvoicesSkeleton";

const InvoicesClient = dynamic(
  () => import("./InvoicesClient"),
  { ssr: false, loading: () => <InvoicesSkeleton /> },
);

type Props = {
  searchParams: {
    status?: string;
    search?: string;
  };
};

export default async function InvoicesPage({ searchParams }: Props) {
  const org = await getCurrentOrg();
  const vertical = getVerticalConfig(org.vertical);
  const status = searchParams.status || "all";
  const search = searchParams.search || "";

  const [invoices, summary, counts, batchClients, invoiceClients] = await Promise.all([
    getInvoices(org.id, status, search),
    getInvoiceSummary(org.id),
    getInvoiceCountsByStatus(org.id),
    getBatchBillingClients(org.id),
    getClientsForInvoiceCreation(org.id),
  ]);

  return (
    <InvoicesClient
      invoices={invoices}
      summary={summary}
      counts={counts}
      activeStatus={status}
      search={search}
      orgId={org.id}
      verticalSlug={org.vertical}
      vertical={vertical}
      batchClients={batchClients}
      invoiceClients={invoiceClients}
    />
  );
}
