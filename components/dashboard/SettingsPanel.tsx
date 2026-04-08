"use client";

import React from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { usePlan } from "@/lib/billing/plan-context";
import { usePrefs } from "@/lib/prefs-context";
import type { Density, CurrencyFormat, WeekStart, DueDayPreset } from "@/lib/prefs-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Sliders,
  Receipt,
  BellRing,
  LayoutGrid,
  AlertTriangle,
  Check,
} from "lucide-react";
import Link from "next/link";

// ─── Primitives ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-txt-hint">
      {children}
    </p>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border-subtle last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-txt-primary">{label}</p>
        {description && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-txt-muted">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose/40",
        checked ? "bg-brand-rose" : "bg-border-strong",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-md border border-border bg-surface-hover p-0.5">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded px-2.5 py-1 text-[11px] font-medium transition-all duration-150",
            value === opt.value
              ? "bg-surface text-txt-primary shadow-sm"
              : "text-txt-muted hover:text-txt-secondary",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Tier badge ──────────────────────────────────────────────────────────────

const TIER_STYLE: Record<string, { label: string; className: string }> = {
  essential: { label: "Essential", className: "bg-surface-hover text-txt-secondary border-border" },
  pro:       { label: "Pro",       className: "bg-brand-rose-dim text-brand-rose-deep border-brand-rose/20" },
  elite:     { label: "Elite",     className: "bg-brand-plum-dim text-brand-plum-deep border-brand-plum/20" },
  agency:    { label: "Agency",    className: "bg-brand-plum text-white border-transparent" },
};

// ─── Main component ──────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsPanel({ open, onOpenChange }: Props) {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const { planTier } = usePlan();
  const { prefs, setPref } = usePrefs();

  const tier = TIER_STYLE[planTier] ?? TIER_STYLE.essential;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[380px] flex-col gap-0 overflow-y-auto p-0 bg-panel border-border"
      >
        {/* Header */}
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName ?? ""}
                className="h-9 w-9 rounded-full ring-1 ring-border"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-hover text-[13px] font-medium text-txt-secondary ring-1 ring-border">
                {user?.firstName?.[0] ?? "U"}
              </div>
            )}
            <div className="min-w-0">
              <SheetTitle className="text-[14px] font-semibold text-txt-primary">
                {user?.fullName ?? "Settings"}
              </SheetTitle>
              <p className="truncate text-[11px] text-txt-muted">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <span
              className={cn(
                "ml-auto rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                tier.className,
              )}
            >
              {tier.label}
            </span>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">

          {/* ─── Display ─────────────────────────────────────────── */}
          <div>
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <LayoutGrid className="h-3 w-3" /> Display
              </span>
            </SectionLabel>
            <div className="rounded-lg border border-border bg-surface px-3">
              <SettingRow
                label="Density"
                description="Controls row height and padding across tables."
              >
                <SegmentedControl<Density>
                  options={[
                    { label: "Compact", value: "compact" },
                    { label: "Normal", value: "comfortable" },
                    { label: "Spacious", value: "spacious" },
                  ]}
                  value={prefs.density}
                  onChange={(v) => setPref("density", v)}
                />
              </SettingRow>
              <SettingRow
                label="Show completion %"
                description="Display progress percentage on deliverable client headers."
              >
                <Toggle
                  id="pref-completion"
                  checked={prefs.showCompletionPercent}
                  onChange={(v) => setPref("showCompletionPercent", v)}
                />
              </SettingRow>
              <SettingRow
                label="Retainer in deliverables"
                description="Show client retainer value next to their name on the deliverables page."
              >
                <Toggle
                  id="pref-retainer"
                  checked={prefs.showRetainerInDeliverables}
                  onChange={(v) => setPref("showRetainerInDeliverables", v)}
                />
              </SettingRow>
            </div>
          </div>

          {/* ─── Invoicing ───────────────────────────────────────── */}
          <div>
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Receipt className="h-3 w-3" /> Invoicing
              </span>
            </SectionLabel>
            <div className="rounded-lg border border-border bg-surface px-3">
              <SettingRow
                label="Currency"
                description="Applied to all invoices and revenue figures."
              >
                <SegmentedControl<CurrencyFormat>
                  options={[
                    { label: "USD", value: "USD" },
                    { label: "EUR", value: "EUR" },
                    { label: "GBP", value: "GBP" },
                    { label: "CAD", value: "CAD" },
                  ]}
                  value={prefs.currency}
                  onChange={(v) => setPref("currency", v)}
                />
              </SettingRow>
              <SettingRow
                label="Default due days"
                description="Pre-filled when creating a new invoice."
              >
                <SegmentedControl<DueDayPreset>
                  options={[
                    { label: "7d", value: 7 },
                    { label: "14d", value: 14 },
                    { label: "30d", value: 30 },
                  ]}
                  value={prefs.defaultDueDays}
                  onChange={(v) => setPref("defaultDueDays", v)}
                />
              </SettingRow>
            </div>
          </div>

          {/* ─── Workflow ─────────────────────────────────────────── */}
          <div>
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Sliders className="h-3 w-3" /> Workflow
              </span>
            </SectionLabel>
            <div className="rounded-lg border border-border bg-surface px-3">
              <SettingRow
                label="Week starts on"
                description="Affects calendar and date range views."
              >
                <SegmentedControl<WeekStart>
                  options={[
                    { label: "Mon", value: "monday" },
                    { label: "Sun", value: "sunday" },
                  ]}
                  value={prefs.weekStart}
                  onChange={(v) => setPref("weekStart", v)}
                />
              </SettingRow>
              <SettingRow
                label="Confirm before delete"
                description="Show a confirmation dialog before permanently deleting items."
              >
                <Toggle
                  id="pref-confirm-delete"
                  checked={prefs.confirmBeforeDelete}
                  onChange={(v) => setPref("confirmBeforeDelete", v)}
                />
              </SettingRow>
            </div>
          </div>

          {/* ─── Notifications ───────────────────────────────────── */}
          <div>
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <BellRing className="h-3 w-3" /> Notifications
              </span>
            </SectionLabel>
            <div className="rounded-lg border border-border bg-surface px-4 py-3">
              <p className="text-[12px] text-txt-muted">
                Email notifications are managed through your account settings.
              </p>
              <button
                type="button"
                onClick={() => { onOpenChange(false); openUserProfile(); }}
                className="mt-2 text-[12px] text-brand-rose hover:underline"
              >
                Open account settings →
              </button>
            </div>
          </div>

          {/* ─── Plan ─────────────────────────────────────────────── */}
          <div>
            <SectionLabel>Plan &amp; Billing</SectionLabel>
            <Link
              href="/billing"
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-hover"
            >
              <div>
                <p className="text-[13px] font-medium text-txt-primary">
                  {tier.label} plan
                </p>
                <p className="text-[11px] text-txt-muted">
                  Manage subscription, invoices, and upgrade options
                </p>
              </div>
              <span className="text-txt-muted">→</span>
            </Link>
          </div>

          {/* ─── Danger zone ─────────────────────────────────────── */}
          <div>
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5 text-danger">
                <AlertTriangle className="h-3 w-3" /> Danger zone
              </span>
            </SectionLabel>
            <div className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3">
              <p className="text-[12px] text-danger">
                Deleting your account is permanent and cannot be undone. All
                data — clients, deliverables, and invoices — will be erased.
              </p>
              <button
                type="button"
                onClick={() => { onOpenChange(false); openUserProfile(); }}
                className="mt-2 text-[12px] font-medium text-danger hover:underline"
              >
                Manage account deletion →
              </button>
            </div>
          </div>

          {/* Version footer */}
          <p className="pb-2 text-center text-[10px] text-txt-hint">
            Severl · {new Date().getFullYear()}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
