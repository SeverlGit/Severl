import React from "react";
import { getCurrentOrg } from "@/lib/auth";
import { getVerticalConfig } from "@/config/verticals";
import {
  getInvoices,
  getInvoiceSummary,
  getInvoiceCountsByStatus,
  getClientsForInvoiceCreation,
} from "@/lib/invoicing/getInvoicesData";
import { getBatchBillingClients } from "@/lib/invoicing/getBatchBillingData";
import { InvoicesClientLoader } from "./InvoicesClientLoader";

type Props = {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
};

export default async function InvoicesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const org = await getCurrentOrg();
  const vertical = getVerticalConfig(org.vertical);
  const status = sp.status || "all";
  const search = sp.search || "";

  const [invoices, summary, counts, batchClients, invoiceClients] = await Promise.all([
    getInvoices(org.id, status, search),
    getInvoiceSummary(org.id),
    getInvoiceCountsByStatus(org.id),
    getBatchBillingClients(org.id),
    getClientsForInvoiceCreation(org.id),
  ]);

  return (
    <InvoicesClientLoader
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
