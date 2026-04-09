"use client";

import React from "react";
import { Users } from "lucide-react";
import { ClientRow } from "./ClientRow";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ClientWithManager } from "@/lib/database.types";

type Props = {
  clients: ClientWithManager[];
  filter: string;
  orgId: string;
  verticalSlug: "smm_freelance" | "smm_agency";
  showAccountManager: boolean;
  emptyStateAction?: React.ReactNode;
};

export function ClientTable({ clients, filter, orgId, verticalSlug, showAccountManager, emptyStateAction }: Props) {
  const emptyMessage = (() => {
    switch (filter) {
      case "at_risk":
        return "No at-risk clients right now — things are looking good.";
      case "prospect":
        return "No prospects yet. Add potential clients to track them.";
      case "onboarding":
        return "No clients in onboarding right now.";
      case "paused":
        return "No paused clients.";
      case "churned":
        return "No churned clients. Keep it that way.";
      default:
        return "No clients yet. Add your first one to get started.";
    }
  })();

  const isFullEmpty = filter === "all" || !filter;

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
              <td
                className="px-3 py-16 text-center align-middle"
                colSpan={showAccountManager ? 7 : 6}
              >
                {isFullEmpty ? (
                  <EmptyState
                    icon={<Users strokeWidth={1.25} />}
                    title="No clients yet"
                    description="Add your first client to start tracking retainers and deliverables."
                    actionNode={emptyStateAction}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[14px] font-medium text-txt-muted">{emptyMessage}</span>
                  </div>
                )}
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
