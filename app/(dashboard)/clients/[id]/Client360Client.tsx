"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { AnyVerticalConfig } from "@/lib/vertical-config";
import { ClientTagPill } from "@/components/clients/ClientTagPill";
import { CompletionBar } from "@/components/deliverables/CompletionBar";
import { ActivityTimeline } from "@/components/clients/ActivityTimeline";
import { RenewalCountdown } from "@/components/clients/RenewalCountdown";
import { BrandGuideTab } from "@/components/clients/BrandGuideTab";
import { NotesTab } from "@/components/clients/NotesTab";
import { StatusPill } from "@/components/shared/StatusPill";
import { StatusDropdown } from "@/components/deliverables/StatusDropdown";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { EditClientDialog } from "@/components/clients/EditClientDialog";
import { TeamManagementDialog } from "@/components/clients/TeamManagementDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { archiveClient, reassignAccountManager } from "@/lib/clients/actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createDeliverable } from "@/lib/deliverables/actions";
import { markInvoicePaid, markInvoiceSent, voidInvoice } from "@/lib/invoicing/actions";
import type { DeliverableStatus, InvoiceStatus } from "@/lib/types";
import { Archive, ArrowLeft, ArrowRight, ExternalLink, Pencil } from "lucide-react";
import { useTopbarDetailTitle } from "@/components/dashboard/TopbarTitleContext";
import type {
  Client360,
  DeliverableRow,
  InvoiceRow,
  ClientNoteRow,
  TeamMemberRow,
} from "@/lib/database.types";

const TAB_LABELS: Record<string, string> = {
  overview: "Overview",
  deliverables: "Deliverables",
  invoices: "Invoices",
  brand_guide: "Brand guide",
  team: "Team",
  notes: "Notes",
};

type Props = {
  client: Client360;
  activity: Pick<import("@/lib/database.types").EventRow, "event_type" | "amount" | "metadata" | "created_at">[];
  deliverables: Pick<DeliverableRow, "id" | "type" | "title" | "status" | "due_date">[];
  invoices: Pick<InvoiceRow, "id" | "invoice_number" | "status" | "total" | "billing_month" | "invoice_type" | "created_at">[];
  notes: Pick<ClientNoteRow, "id" | "author_id" | "body" | "created_at">[];
  vertical: AnyVerticalConfig;
  orgId: string;
  verticalSlug: string;
  clientId: string;
  activeTab: string;
  teamMembers: Pick<TeamMemberRow, "id" | "name" | "email" | "role" | "active">[];
  teamMembersForManagement?: Pick<TeamMemberRow, "id" | "name" | "email" | "role" | "active">[];
  teamDeliverableCounts: Record<string, number>;
};

export type Client360ClientProps = Props;

export default function Client360Client({ client, activity, deliverables, invoices, notes, vertical, orgId, verticalSlug, clientId, activeTab, teamMembers, teamMembersForManagement = [], teamDeliverableCounts }: Props) {
  const router = useRouter();
  const { setDetailTitle } = useTopbarDetailTitle();
  const tabs = vertical.crm.profileSections;
  const platforms: string[] = client.platforms ?? [];
  const [editOpen, setEditOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [addDeliverablePending, startAddDeliverable] = useTransition();
  const [invoicePendingId, setInvoicePendingId] = useState<string | null>(null);
  const [voidInvoiceTarget, setVoidInvoiceTarget] = useState<Pick<InvoiceRow, "id" | "invoice_number"> | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickType, setQuickType] = useState(vertical.deliverables.defaultDeliverableTypes[0]?.key ?? "");
  const [quickDue, setQuickDue] = useState("");
  const currentAM = teamMembers.find((m) => m.id === client.account_manager_id);

  const deliverablesMonthParam = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

  const verticalAction = verticalSlug as "smm_freelance" | "smm_agency";

  const handleQuickAddDeliverable = () => {
    if (!quickType) return;
    startAddDeliverable(async () => {
      try {
        await createDeliverable({
          orgId,
          clientId,
          month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          type: quickType,
          title: quickTitle.trim() || quickType,
          dueDate: quickDue.trim() || null,
          vertical: verticalAction,
        });
        toast.success("Deliverable added");
        setQuickTitle("");
        setQuickDue("");
        router.refresh();
      } catch {
        toast.error("Could not add deliverable");
      }
    });
  };

  const handleInvoiceSend = (invoiceId: string) => {
    setInvoicePendingId(invoiceId);
    startTransition(async () => {
      try {
        await markInvoiceSent({ invoiceId, orgId, vertical: verticalAction });
        toast.success("Invoice sent");
        router.refresh();
      } catch {
        toast.error("Could not send invoice");
      } finally {
        setInvoicePendingId(null);
      }
    });
  };

  const handleInvoiceMarkPaid = (invoiceId: string) => {
    setInvoicePendingId(invoiceId);
    startTransition(async () => {
      try {
        await markInvoicePaid({
          invoiceId,
          orgId,
          vertical: verticalAction,
          paymentMethod: "bank_transfer",
          paidDate: new Date().toISOString().slice(0, 10),
        });
        toast.success("Invoice marked as paid");
        router.refresh();
      } catch {
        toast.error("Could not mark invoice paid");
      } finally {
        setInvoicePendingId(null);
      }
    });
  };

  const handleInvoiceVoid = () => {
    if (!voidInvoiceTarget) return;
    const inv = voidInvoiceTarget;
    setVoidInvoiceTarget(null);
    setInvoicePendingId(inv.id);
    startTransition(async () => {
      try {
        await voidInvoice({ invoiceId: inv.id, orgId, vertical: verticalAction });
        toast.success("Invoice voided");
        router.refresh();
      } catch {
        toast.error("Could not void invoice");
      } finally {
        setInvoicePendingId(null);
      }
    });
  };

  useEffect(() => {
    const label = client.brand_name?.trim() || vertical.crm.clientLabel;
    setDetailTitle(label);
    return () => setDetailTitle(null);
  }, [client.brand_name, client.id, setDetailTitle, vertical.crm.clientLabel]);

  const setTab = (tab: string) => {
    router.push(`/clients/${clientId}?tab=${tab}`);
  };

  const handleReassign = (memberId: string) => {
    startTransition(async () => {
      try {
        await reassignAccountManager({ clientId, orgId, teamMemberId: memberId });
        toast.success("Account manager updated");
        router.refresh();
      } catch {
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 p-5">
      <Link href="/clients" className="group flex w-fit items-center gap-1.5 text-[13px] text-txt-hint transition-colors hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to {vertical.crm.clientsLabel}</span>
      </Link>

      <header className="flex flex-col gap-3 rounded-lg border border-border bg-brand-navy p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ClientAvatar name={client.brand_name} tag={client.tag} size="lg" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-medium text-txt-primary">{client.brand_name}</h1>
                <ClientTagPill tag={client.tag} />
              </div>
              <p className="text-sm text-txt-muted">{client.contact_name} · {client.contact_email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-txt-muted">Retainer</span>
            <span className="font-mono text-[16px] font-medium tabular-nums tracking-[-0.03em] text-brand-mint">
              {client.retainer_amount ? `${formatCurrency(Number(client.retainer_amount))}/mo` : "No retainer"}
            </span>
            <span className="font-mono text-[13px] tabular-nums text-txt-muted">
              Renews {client.contract_renewal ? new Date(client.contract_renewal).toLocaleDateString() : "—"}
            </span>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs text-txt-secondary transition-colors hover:bg-brand-navy"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs text-danger transition-colors hover:bg-danger/10"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive {client.brand_name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the client from your active roster. Their data will be preserved but they won&apos;t appear in your client list, deliverables, or invoices.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await archiveClient({ orgId, clientId: client.id });
                          toast.success(`${client.brand_name} archived`);
                          router.push("/clients");
                        } catch {
                          toast.error("Failed to archive client");
                        }
                      }}
                      className="bg-danger text-white hover:bg-danger/90"
                    >
                      Archive client
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <EditClientDialog
        client={{
          id: client.id,
          brand_name: client.brand_name,
          contact_name: client.contact_name ?? "",
          contact_email: client.contact_email ?? "",
          platforms: client.platforms ?? [],
          retainer_amount: client.retainer_amount ? Number(client.retainer_amount) : null,
          contract_start: client.contract_start ?? null,
          contract_renewal: client.contract_renewal ?? null,
        }}
        orgId={orgId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <section className="grid gap-px rounded-lg border border-border bg-brand-navy md:grid-cols-4">
        {[
          { label: "Platforms", value: String(platforms.length), sub: platforms.join(", ") || "No platforms set", mono: true },
          { label: "This month", value: `${client.deliverables_done}/${client.deliverables_total}`, sub: "deliverables", mono: true },
          { label: "Revenue to date", value: formatCurrency(client.revenue_to_date), sub: "total billed", mono: true },
          { label: "Balance owed", value: formatCurrency(client.balance_owed), sub: "outstanding", tone: client.balance_owed > 0 ? "danger" : "neutral" as const, mono: true },
        ].map((card) => (
          <div key={card.label} className="bg-brand-navy/80 first:rounded-l-lg last:rounded-r-lg px-4 py-3">
            <div className="text-[12px] font-medium uppercase tracking-[0.06em] text-txt-muted">{card.label}</div>
            <div className={`mt-1 font-mono text-[16px] font-medium tabular-nums tracking-[-0.03em] ${card.tone === "danger" ? "text-[#f87171]" : "text-white"}`}>{card.value}</div>
            <div className="mt-0.5 text-[13px] text-txt-muted">{card.sub}</div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-brand-navy p-4">
        <Tabs value={activeTab} onValueChange={setTab}>
          <TabsList className="w-full justify-start">
            {tabs.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {TAB_LABELS[tab] ?? tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18, ease: "easeOut" }}>
              <TabsContent value="overview" forceMount={activeTab === "overview" ? true : undefined} className={activeTab !== "overview" ? "hidden" : ""}>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-txt-muted">This month</span>
                    <span className="font-mono text-[12px] tabular-nums text-txt-hint">{client.deliverables_done}/{client.deliverables_total}</span>
                  </div>
                  <CompletionBar total={client.deliverables_total} published={client.deliverables_done} />
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <div>
                      <h2 className="mb-2 text-[12px] font-medium text-txt-secondary">Recent activity</h2>
                      <ActivityTimeline events={activity} />
                    </div>
                    {client.contract_renewal && (
                      <div>
                        <h2 className="mb-2 text-[12px] font-medium text-txt-secondary">Renewal</h2>
                        <RenewalCountdown clientId={clientId} orgId={orgId} contractRenewal={client.contract_renewal} />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="deliverables" forceMount={activeTab === "deliverables" ? true : undefined} className={activeTab !== "deliverables" ? "hidden" : ""}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-end">
                    <Link
                      href={`/deliverables?month=${deliverablesMonthParam}`}
                      className="inline-flex items-center gap-1 text-sm text-txt-secondary transition-colors hover:text-brand-mint"
                    >
                      View all in Deliverables
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  {deliverables.length === 0 ? (
                    <p className="py-2 text-center text-[13px] text-txt-muted">No deliverables this month.</p>
                  ) : (
                    deliverables.map((d) => (
                      <div
                        key={d.id}
                        className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex flex-col">
                          <span className="truncate text-[14px] text-white">{d.title}</span>
                          <span className="text-[12px] text-txt-muted">
                            {d.type} · due{" "}
                            {d.due_date
                              ? new Date(d.due_date).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </span>
                        </div>
                        <StatusDropdown
                          deliverableId={d.id}
                          orgId={orgId}
                          verticalSlug={verticalAction}
                          status={d.status as DeliverableStatus}
                        />
                      </div>
                    ))
                  )}
                  <div className="rounded-lg border border-dashed border-border px-3 py-2.5">
                    <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-txt-muted">Add deliverable</div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                      <Select value={quickType} onValueChange={setQuickType}>
                        <SelectTrigger className="h-8 w-full text-[12px] sm:w-[140px]" aria-label="Deliverable type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {vertical.deliverables.defaultDeliverableTypes.map((t) => (
                            <SelectItem key={t.key} value={t.key}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={quickTitle}
                        onChange={(e) => setQuickTitle(e.target.value)}
                        placeholder={vertical.deliverables.deliverableLabel}
                        className="h-8 flex-1 min-w-[120px] text-[13px]"
                      />
                      <Input
                        type="date"
                        value={quickDue}
                        onChange={(e) => setQuickDue(e.target.value)}
                        className="h-8 w-full text-[13px] sm:w-[130px]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={addDeliverablePending || !quickType}
                        onClick={handleQuickAddDeliverable}
                        className="h-8 shrink-0"
                      >
                        {addDeliverablePending ? "…" : "Add"}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="invoices" forceMount={activeTab === "invoices" ? true : undefined} className={activeTab !== "invoices" ? "hidden" : ""}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-end">
                    <Link
                      href="/invoices"
                      className="inline-flex items-center gap-1 text-sm text-txt-secondary transition-colors hover:text-brand-mint"
                    >
                      View all in Invoices
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  {invoices.length === 0 ? (
                    <p className="py-4 text-center text-[13px] text-txt-muted">No invoices for this {vertical.crm.clientLabel.toLowerCase()}.</p>
                  ) : (
                    invoices.map((inv) => {
                      const busy = invoicePendingId === inv.id;
                      const statusLabel = inv.status.replace(/_/g, " ");
                      return (
                        <div
                          key={inv.id}
                          className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 flex-col sm:flex-1">
                            <span className="font-mono text-[12px] text-txt-hint">{inv.invoice_number}</span>
                            <span className="font-mono text-[13px] tabular-nums text-txt-muted">
                              {inv.billing_month
                                ? new Date(inv.billing_month).toLocaleDateString(undefined, {
                                    month: "long",
                                    year: "numeric",
                                  })
                                : "—"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <span className="font-mono text-[13px] tabular-nums text-white">{formatCurrency(inv.total ?? 0)}</span>
                            <StatusPill
                              variant="invoice"
                              status={inv.status as InvoiceStatus}
                              label={statusLabel}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-txt-muted hover:text-txt-primary"
                                aria-label="View printable invoice"
                                onClick={() => window.open(`/api/invoices/${inv.id}`, "_blank")}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                              {inv.status === "draft" && (
                                <>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleInvoiceSend(inv.id)}
                                    className="text-xs text-txt-secondary transition-colors hover:text-brand-mint disabled:opacity-40"
                                  >
                                    Send
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                      setVoidInvoiceTarget({
                                        id: inv.id,
                                        invoice_number: inv.invoice_number,
                                      })
                                    }
                                    className="text-xs text-txt-secondary transition-colors hover:text-brand-mint disabled:opacity-40"
                                  >
                                    Void
                                  </button>
                                </>
                              )}
                              {inv.status === "sent" && (
                                <>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleInvoiceMarkPaid(inv.id)}
                                    className="text-xs text-txt-secondary transition-colors hover:text-brand-mint disabled:opacity-40"
                                  >
                                    Mark paid
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                      setVoidInvoiceTarget({
                                        id: inv.id,
                                        invoice_number: inv.invoice_number,
                                      })
                                    }
                                    className="text-xs text-txt-secondary transition-colors hover:text-brand-mint disabled:opacity-40"
                                  >
                                    Void
                                  </button>
                                </>
                              )}
                              {inv.status === "overdue" && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleInvoiceMarkPaid(inv.id)}
                                  className="text-xs text-txt-secondary transition-colors hover:text-brand-mint disabled:opacity-40"
                                >
                                  Mark paid
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="brand_guide" forceMount={activeTab === "brand_guide" ? true : undefined} className={activeTab !== "brand_guide" ? "hidden" : ""}>
                <BrandGuideTab clientId={clientId} orgId={orgId} vertical={vertical} verticalData={client.vertical_data ?? {}} />
              </TabsContent>

              <TabsContent value="team" forceMount={activeTab === "team" ? true : undefined} className={activeTab !== "team" ? "hidden" : ""}>
                <div className="flex flex-col gap-5">
                  {verticalSlug === "smm_agency" && (
                    <div className="flex justify-end">
                      <TeamManagementDialog orgId={orgId} teamMembers={teamMembersForManagement} />
                    </div>
                  )}
                  <div>
                    <h3 className="mb-3 text-[12px] font-medium uppercase tracking-[0.06em] text-txt-muted">Account manager</h3>
                    {currentAM ? (
                      <div className="flex items-center gap-3">
                        <ClientAvatar name={currentAM.name} tag="active" />
                        <div className="flex flex-col">
                          <span className="text-[14px] font-medium text-white">{currentAM.name}</span>
                          <span className="text-[12px] text-txt-muted">{currentAM.email}</span>
                        </div>
                        <Badge variant="muted">Account manager</Badge>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="ml-auto">Reassign</Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-52 p-1">
                            {teamMembers.map((m) => (
                              <button key={m.id} type="button" className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-left text-[13px] text-txt-secondary transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-white" onClick={() => handleReassign(m.id)}>
                                <ClientAvatar name={m.name} size="sm" />
                                {m.name}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] text-txt-muted">No account manager assigned.</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="terminal" size="sm">Assign</Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-52 p-1">
                            {teamMembers.map((m) => (
                              <button key={m.id} type="button" className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-left text-[13px] text-txt-secondary transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-white" onClick={() => handleReassign(m.id)}>
                                <ClientAvatar name={m.name} size="sm" />
                                {m.name}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <h3 className="mb-3 text-[12px] font-medium uppercase tracking-[0.06em] text-txt-muted">Team</h3>
                    {teamMembers.length === 0 ? (
                      <p className="text-[14px] text-txt-muted">No team members yet.</p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {teamMembers.map((m) => {
                          const count = teamDeliverableCounts[m.id] ?? 0;
                          const countVariant = count > 15 ? "red" as const : count > 10 ? "amber" as const : "green" as const;
                          return (
                            <div key={m.id} className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-[rgba(255,255,255,0.04)]">
                              <ClientAvatar name={m.name} size="sm" />
                              <span className="flex-1 text-[14px] text-white">{m.name}</span>
                              <span className="text-[12px] text-txt-muted">{m.role}</span>
                              <Badge variant={countVariant}>{count} active</Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" forceMount={activeTab === "notes" ? true : undefined} className={activeTab !== "notes" ? "hidden" : ""}>
                <NotesTab clientId={clientId} orgId={orgId} notes={notes} />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </section>

      <AlertDialog
        open={!!voidInvoiceTarget}
        onOpenChange={(open) => {
          if (!open) setVoidInvoiceTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void invoice {voidInvoiceTarget?.invoice_number}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleInvoiceVoid}
              className="bg-danger text-white hover:bg-danger/90"
            >
              Void invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
