"use client";

import React, { useState } from "react";
import { ChevronDownIcon as ChevronDown, ChevronRightIcon as ChevronRight } from "@radix-ui/react-icons";
import type { AnyVerticalConfig } from "@/lib/vertical-config";
import type { DeliverableWithClient, TeamMemberRow } from "@/lib/database.types";
import { PlatformChip } from "@/components/dashboard/PlatformChip";
import { CompletionBar } from "./CompletionBar";
import { DeliverableRow } from "./DeliverableRow";
import { AddDeliverableRow } from "./AddDeliverableRow";

type Props = {
  clientId: string;
  brandName: string;
  platforms: string[] | null;
  deliverables: DeliverableWithClient[];
  stats: { total: number; published: number } | undefined;
  orgId: string;
  monthIso: string;
  vertical: AnyVerticalConfig;
  verticalSlug: "smm_freelance" | "smm_agency";
  teamMembers?: Pick<TeamMemberRow, "id" | "name" | "email" | "role">[];
};

export function ClientSection({
  clientId,
  brandName,
  platforms,
  deliverables,
  stats,
  orgId,
  monthIso,
  vertical,
  verticalSlug,
  teamMembers,
}: Props) {
  const [open, setOpen] = useState(true);
  const total = stats?.total ?? deliverables.length;
  const published = stats?.published ?? 0;

  return (
    <section className="rounded-lg border border-border bg-brand-navy px-3 py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3 w-3 text-txt-muted" /> : <ChevronRight className="h-3 w-3 text-txt-muted" />}
          <span className="text-[14px] font-medium text-txt-primary">{brandName}</span>
          <div className="flex flex-wrap gap-1">
            {(platforms ?? []).slice(0, 3).map((p) => (
              <PlatformChip key={p} label={p} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-txt-muted">
          <span>
            {published} / {total}
          </span>
          <CompletionBar total={total} published={published} />
        </div>
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-1.5">
          {deliverables.map((d, idx) => (
            <DeliverableRow
              key={d.id}
              deliverable={d}
              orgId={orgId}
              vertical={vertical}
              verticalSlug={verticalSlug}
              teamMembers={teamMembers}
              index={idx}
            />
          ))}
          <AddDeliverableRow
            orgId={orgId}
            clientId={clientId}
            month={monthIso}
            verticalSlug={verticalSlug}
          />
        </div>
      )}
    </section>
  );
}

