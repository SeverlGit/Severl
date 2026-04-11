"use client";

import React from "react";
import { Users, SearchX, UserCheck } from "lucide-react";
import { ClientRow } from "./ClientRow";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ClientWithManager } from "@/lib/database.types";

type Props = {
  clients: ClientWithManager[];
  filter: string;
  search: string;
  totalClients: number;
  activeClients: number;
  orgId: string;
  verticalSlug: "smm_freelance" | "smm_agency";
  showAccountManager: boolean;
  emptyStateAction?: React.ReactNode;
};

export function ClientTable({ clients, filter, search, totalClients, activeClients, orgId, verticalSlug, showAccountManager, emptyStateAction }: Props) {
  const colSpan = showAccountManager ? 7 : 6;

  const emptyContent = (() => {
    // 1. Search returned nothing
    if (search && clients.length === 0) {
      return (
        <EmptyState
          icon={<SearchX strokeWidth={1.25} />}
          title={`No results for "${search}"`}
          description="Try a different brand name, contact name, or email address."
        />
      );
    }

    // 2. Has clients but none are active/onboarding — can't start deliverables
    if (!search && (filter === "all" || !filter) && totalClients > 0 && activeClients === 0) {
      return (
        <EmptyState
          icon={<UserCheck strokeWidth={1.25} />}
          title="No active clients yet"
          description="You have clients, but none are set to Active or Onboarding. Update a client's tag to Active to start tracking deliverables."
        />
      );
    }

    // 3. No clients at all
    if (!search && (filter === "all" || !filter) && totalClients === 0) {
      return (
        <EmptyState
          icon={<Users strokeWidth={1.25} />}
          title="No clients yet"
          description="Add your first client to start tracking retainers and deliverables."
          actionNode={emptyStateAction}
        />
      );
    }

    // 4. Filter tab with no matches
    const filterMessage: Record<string, string> = {
      at_risk:    "No at-risk clients right now — things are looking good.",
      prospect:   "No prospects yet. Add potential clients to track them.",
      onboarding: "No clients in onboarding right now.",
      paused:     "No paused clients.",
      churned:    "No churned clients. Keep it that way.",
      active:     "No active clients. Set a client's tag to Active to get started.",
    };
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[14px] font-medium text-txt-muted">
          {filterMessage[filter] ?? "No clients match this filter."}
        </span>
      </div>
    );
  })();

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-border">
      <table className="min-w-full border-collapse text-[14px]">
        <thead className="border-b border-border bg-surface text-left">
          <tr>
            <th className="px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider text-txt-muted">Brand</th>
            <th className="px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider text-txt-muted">Tag</th>
            <th className="px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider text-txt-muted">Platforms</th>
            <th className="px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider text-txt-muted">Retainer</th>
            <th className="px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider text-txt-muted">Renewal</th>
            {showAccountManager && (
              <th className="px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider text-txt-muted">AM</th>
            )}
            <th className="px-3 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider text-txt-muted">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {clients.length === 0 && (
            <tr>
              <td className="px-3 py-16 text-center align-middle" colSpan={colSpan}>
                {emptyContent}
              </td>
            </tr>
          )}
          {clients.map((client, index) => (
            <ClientRow
              key={client.id}
              client={client}
              index={index}
              orgId={orgId}
              verticalSlug={verticalSlug}
              showAccountManager={showAccountManager}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
