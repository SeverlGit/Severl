"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PlatformChip } from "@/components/dashboard/PlatformChip";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { useVerticalConfig } from "@/lib/vertical-config";
import { updateClientTag } from "@/lib/clients/actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ClientWithManager } from "@/lib/database.types";

const TAG_BORDER_COLORS: Record<string, string> = {
  prospect: "border-l-zinc-600",
  onboarding: "border-l-blue-400",
  active: "border-l-success",
  at_risk: "border-l-warning",
  paused: "border-l-zinc-600",
  churned: "border-l-danger",
};

type Props = {
  client: ClientWithManager;
  index: number;
  orgId: string;
  verticalSlug: "smm_freelance" | "smm_agency";
  showAccountManager: boolean;
};

export function ClientRow({ client, index, orgId, verticalSlug, showAccountManager }: Props) {
  const vertical = useVerticalConfig();
  const router = useRouter();
  const [tag, setTag] = useState<string>(client.tag);
  const [isPending, startTransition] = useTransition();

  const handleTagChange = (newTag: string) => {
    const prev = tag;
    setTag(newTag);
    startTransition(async () => {
      try {
        await updateClientTag({ clientId: client.id, orgId, vertical: verticalSlug, newTag });
        router.refresh();
      } catch {
        toast.error("Failed to update client tag");
        setTag(prev);
      }
    });
  };

  const platforms: string[] = client.platforms ?? [];
  const renewalColor = (() => {
    if (!client.contract_renewal) return "text-txt-muted";
    const d = new Date(client.contract_renewal);
    const diffDays = Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays < 14) return "text-danger";
    if (diffDays <= 30) return "text-warning";
    return "text-txt-muted";
  })();

  const renewalLabel = (() => {
    if (!client.contract_renewal) return '—';
    const [y, m, d] = client.contract_renewal.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  })();

  return (
    <motion.tr
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.04 }}
      className="transition-colors hover:bg-surface"
    >
      <td
        className={cn(
          "border-l-2 border-solid px-3 py-2.5",
          TAG_BORDER_COLORS[tag] ?? "border-l-transparent",
        )}
      >
        <div className="flex items-center gap-2.5">
          <ClientAvatar name={client.brand_name} tag={client.tag} />
          <div className="flex flex-col">
            <span className="text-[14px] text-txt-primary">{client.brand_name}</span>
            <span className="text-[12px] text-txt-muted">
              {[client.contact_name, client.contact_email].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <Select value={tag} onValueChange={handleTagChange} disabled={isPending}>
          <SelectTrigger className="h-7 w-[120px] text-[12px]" aria-label="Client tag">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {vertical.crm.tags.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap gap-1">
          {platforms.slice(0, 3).map((p: string) => (
            <PlatformChip key={p} label={p} className="bg-surface text-txt-secondary px-2 py-0.5 text-[10px] rounded" />
          ))}
          {platforms.length > 3 && (
            <span className="text-[12px] text-txt-muted">+{platforms.length - 3}</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 font-mono text-[13px] tabular-nums text-txt-primary">
        {client.retainer_amount
          ? `$${Number(client.retainer_amount).toLocaleString()}/mo`
          : <span className="text-txt-muted">—</span>}
      </td>
      <td className={`px-3 py-2.5 font-mono text-[13px] tabular-nums ${renewalColor}`}>{renewalLabel}</td>
      {showAccountManager && (
        <td className="px-3 py-2.5 text-[13px] text-txt-muted">
          {client.team_members?.name ?? "—"}
        </td>
      )}
      <td className="px-3 py-2.5 text-right text-[13px]">
        <Link
          href={`/clients/${client.id}`}
          className="rounded px-2 py-1 text-brand-rose transition-colors hover:bg-brand-rose-dim hover:text-brand-rose-deep focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-rose/50"
        >
          View →
        </Link>
      </td>
    </motion.tr>
  );
}
