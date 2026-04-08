"use client";

import React, { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { usePlan } from "@/lib/billing/plan-context";
import { usePrefs } from "@/lib/prefs-context";
import type { UserPrefs, Density, CurrencyFormat, WeekStart, DueDayPreset } from "@/lib/prefs-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Sliders,
  Receipt,
  BellRing,
  LayoutGrid,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

// ─── Style tokens matching AddClientDialog ────────────────────────────────────

const labelClass =
  "block text-[10px] uppercase tracking-wider font-medium text-txt-muted mb-1.5";

// ─── Primitives ───────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className={cn(labelClass, "mb-3 mt-1")}>
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
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-txt-primary">{label}</p>
        {description && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-txt-muted">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Pill toggle — same rounded border style as platform chips in AddClientDialog */
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
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/40",
        checked ? "bg-success" : "bg-border-strong",
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

/** Segmented control — styled like the platform pill chips */
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
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded border px-2.5 py-1 text-xs font-medium uppercase tracking-wider transition-colors",
            value === opt.value
              ? "border-success bg-success/15 text-success"
              : "border-border bg-transparent text-txt-muted hover:border-txt-hint",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

const TIER_STYLE: Record<string, { label: string; className: string }> = {
  essential: { label: "Essential", className: "bg-surface-hover text-txt-secondary border-border" },
  pro:       { label: "Pro",       className: "bg-brand-rose-dim text-brand-rose-deep border-brand-rose/20" },
  elite:     { label: "Elite",     className: "bg-brand-plum-dim text-brand-plum-deep border-brand-plum/20" },
  agency:    { label: "Agency",    className: "bg-brand-plum text-white border-transparent" },
};

// ─── Main component ───────────────────────────────────────────────────────────

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

  // ── Draft state — local copy; only committed on Save ─────────────────────
  const [draft, setDraft] = useState<UserPrefs>(prefs);
  const [saved, setSaved] = useState(true);

  // Sync draft when dialog opens (pick up any externally changed prefs)
  useEffect(() => {
    if (open) {
      setDraft(prefs);
      setSaved(true);
    }
  }, [open]);

  const update = <K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // Commit all draft keys at once
    (Object.keys(draft) as (keyof UserPrefs)[]).forEach((key) => {
      setPref(key, draft[key] as UserPrefs[typeof key]);
    });
    setSaved(true);
  };

  const handleCancel = () => {
    setDraft(prefs);
    setSaved(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
      <DialogContent size="lg" className="p-0 gap-0">

        {/* Header — matches AddClientDialog DialogHeader */}
        <DialogHeader>
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
            <div className="min-w-0 flex-1">
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription className="truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </DialogDescription>
            </div>
            <span
              className={cn(
                "rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                tier.className,
              )}
            >
              {tier.label}
            </span>
          </div>
        </DialogHeader>

        {/* Body — two-column grid matching AddClientDialog's px-6 py-4 */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 px-6 py-5">

          {/* ─── Display ──────────────────────────────────────── */}
          <div>
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <LayoutGrid className="h-3 w-3" /> Display
              </span>
            </SectionLabel>
            <div className="rounded-md border border-border bg-surface px-3">
              <SettingRow
                label="Density"
                description="Row height and padding across tables."
              >
                <SegmentedControl<Density>
                  options={[
                    { label: "Compact", value: "compact" },
                    { label: "Normal", value: "comfortable" },
                    { label: "Spacious", value: "spacious" },
                  ]}
                  value={draft.density}
                  onChange={(v) => update("density", v)}
                />
              </SettingRow>
              <SettingRow
                label="Completion %"
                description="Progress % on deliverable client headers."
              >
                <Toggle
                  id="pref-completion"
                  checked={draft.showCompletionPercent}
                  onChange={(v) => update("showCompletionPercent", v)}
                />
              </SettingRow>
              <SettingRow
                label="Retainer in deliverables"
                description="Show retainer value next to client name."
              >
                <Toggle
                  id="pref-retainer"
                  checked={draft.showRetainerInDeliverables}
                  onChange={(v) => update("showRetainerInDeliverables", v)}
                />
              </SettingRow>
            </div>
          </div>

          {/* ─── Invoicing ────────────────────────────────────── */}
          <div>
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Receipt className="h-3 w-3" /> Invoicing
              </span>
            </SectionLabel>
            <div className="rounded-md border border-border bg-surface px-3">
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
                  value={draft.currency}
                  onChange={(v) => update("currency", v)}
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
                  value={draft.defaultDueDays}
                  onChange={(v) => update("defaultDueDays", v)}
                />
              </SettingRow>
            </div>
          </div>

          {/* ─── Workflow ─────────────────────────────────────── */}
          <div>
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <Sliders className="h-3 w-3" /> Workflow
              </span>
            </SectionLabel>
            <div className="rounded-md border border-border bg-surface px-3">
              <SettingRow
                label="Week starts on"
                description="Affects calendar and date range views."
              >
                <SegmentedControl<WeekStart>
                  options={[
                    { label: "Mon", value: "monday" },
                    { label: "Sun", value: "sunday" },
                  ]}
                  value={draft.weekStart}
                  onChange={(v) => update("weekStart", v)}
                />
              </SettingRow>
              <SettingRow
                label="Confirm before delete"
                description="Show a confirmation dialog before deleting items."
              >
                <Toggle
                  id="pref-confirm-delete"
                  checked={draft.confirmBeforeDelete}
                  onChange={(v) => update("confirmBeforeDelete", v)}
                />
              </SettingRow>
            </div>
          </div>

          {/* ─── Notifications + Plan (stacked right column) ── */}
          <div className="flex flex-col gap-6">
            <div>
              <SectionLabel>
                <span className="inline-flex items-center gap-1.5">
                  <BellRing className="h-3 w-3" /> Notifications
                </span>
              </SectionLabel>
              <div className="rounded-md border border-border bg-surface px-4 py-3">
                <p className="text-[12px] text-txt-muted">
                  Email notifications are managed through your Clerk account settings.
                </p>
                <button
                  type="button"
                  onClick={() => { onOpenChange(false); openUserProfile(); }}
                  className="mt-2 text-[12px] text-brand-rose transition-colors hover:underline"
                >
                  Open account settings →
                </button>
              </div>
            </div>

            <div>
              <SectionLabel>Plan &amp; Billing</SectionLabel>
              <Link
                href="/billing"
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-hover"
              >
                <div>
                  <p className="text-[13px] font-medium text-txt-primary">
                    {tier.label} plan
                  </p>
                  <p className="text-[11px] text-txt-muted">
                    Manage subscription &amp; upgrade
                  </p>
                </div>
                <span className="text-txt-muted">→</span>
              </Link>
            </div>

            <div>
              <SectionLabel>
                <span className="inline-flex items-center gap-1.5 text-danger">
                  <AlertTriangle className="h-3 w-3" /> Danger zone
                </span>
              </SectionLabel>
              <div className="rounded-md border border-danger/20 bg-danger-bg px-4 py-3">
                <p className="text-[12px] text-danger">
                  Account deletion is permanent — all clients, deliverables, and invoices will be erased.
                </p>
                <button
                  type="button"
                  onClick={() => { onOpenChange(false); openUserProfile(); }}
                  className="mt-2 text-[12px] font-medium text-danger transition-colors hover:underline"
                >
                  Manage account deletion →
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer — matches AddClientDialog DialogFooter */}
        <DialogFooter>
          {/* Unsaved / saved indicator */}
          <div className="mr-auto">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-txt-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse inline-block" />
                Unsaved changes
              </span>
            )}
          </div>

          <DialogClose asChild>
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-txt-muted transition-colors hover:text-txt-secondary"
            >
              Cancel
            </button>
          </DialogClose>

          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            className="rounded bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save settings
          </button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
