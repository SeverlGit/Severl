"use client";

import React, { useEffect, useState } from "react";
import { UserProfile, useUser } from "@clerk/nextjs";
import { usePlan } from "@/lib/billing/plan-context";
import { usePrefs } from "@/lib/prefs-context";
import type { UserPrefs, Density, CurrencyFormat, WeekStart, DueDayPreset } from "@/lib/prefs-context";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Sliders,
  Receipt,
  LayoutGrid,
  CheckCircle2,
  PlayCircle,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { useTour } from "@/lib/tour-context";

// ─── Style tokens matching our OS ─────────────────────────────────────────────

const labelClass = "block text-[10px] uppercase tracking-wider font-medium text-txt-muted mb-1.5";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className={cn(labelClass, "mb-3 mt-1")}>{children}</p>;
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-txt-primary">{label}</p>
        {description && <p className="mt-0.5 text-[11px] leading-relaxed text-txt-muted">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id?: string }) {
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
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

function SegmentedControl<T extends string | number>({ options, value, onChange }: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
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

// ─── Custom Pages ─────────────────────────────────────────────────────────────

function AppSettingsContent() {
  const { prefs, setPref } = usePrefs();
  const { openTour } = useTour();
  const [draft, setDraft] = useState<UserPrefs>(prefs);
  const [saved, setSaved] = useState(true);

  // When Clerk switches tabs, this component mounts/unmounts, syncing to live prefs.
  useEffect(() => {
    setDraft(prefs);
    setSaved(true);
  }, [prefs]);

  const update = <K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    (Object.keys(draft) as (keyof UserPrefs)[]).forEach((key) => {
      setPref(key, draft[key] as UserPrefs[typeof key]);
    });
    setSaved(true);
  };

  const handleCancel = () => {
    setDraft(prefs);
    setSaved(true);
  };

  return (
    <div className="flex flex-col h-full relative space-y-8 pb-20">
      
      <div>
        <h1 className="text-xl font-semibold text-txt-primary mb-1">App Settings</h1>
        <p className="text-[13px] text-txt-muted">Manage your dashboard display, invoicing preferences, and workflows.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-8">
        {/* Display */}
        <div>
          <SectionLabel>
            <span className="inline-flex items-center gap-1.5">
              <LayoutGrid className="h-3 w-3" /> Display
            </span>
          </SectionLabel>
          <div className="rounded-md border border-border bg-surface px-3">
            <SettingRow label="Density" description="Row height and padding across tables.">
              <SegmentedControl<Density>
                options={[{ label: "Compact", value: "compact" }, { label: "Normal", value: "comfortable" }, { label: "Spacious", value: "spacious" }]}
                value={draft.density}
                onChange={(v) => update("density", v)}
              />
            </SettingRow>
            <SettingRow label="Completion %" description="Progress % on deliverable client headers.">
              <Toggle checked={draft.showCompletionPercent} onChange={(v) => update("showCompletionPercent", v)} />
            </SettingRow>
            <SettingRow label="Retainer in deliverables" description="Show retainer value next to client name.">
              <Toggle checked={draft.showRetainerInDeliverables} onChange={(v) => update("showRetainerInDeliverables", v)} />
            </SettingRow>
          </div>
        </div>

        {/* Invoicing */}
        <div>
          <SectionLabel>
            <span className="inline-flex items-center gap-1.5">
              <Receipt className="h-3 w-3" /> Invoicing
            </span>
          </SectionLabel>
          <div className="rounded-md border border-border bg-surface px-3">
            <SettingRow label="Currency" description="Applied to all invoices and revenue figures.">
              <SegmentedControl<CurrencyFormat>
                options={[{ label: "USD", value: "USD" }, { label: "EUR", value: "EUR" }, { label: "GBP", value: "GBP" }, { label: "CAD", value: "CAD" }]}
                value={draft.currency}
                onChange={(v) => update("currency", v)}
              />
            </SettingRow>
            <SettingRow label="Default due days" description="Pre-filled when creating a new invoice.">
              <SegmentedControl<DueDayPreset>
                options={[{ label: "7d", value: 7 }, { label: "14d", value: 14 }, { label: "30d", value: 30 }]}
                value={draft.defaultDueDays}
                onChange={(v) => update("defaultDueDays", v)}
              />
            </SettingRow>
          </div>
        </div>

        {/* Workflow */}
        <div>
          <SectionLabel>
            <span className="inline-flex items-center gap-1.5">
              <Sliders className="h-3 w-3" /> Workflow
            </span>
          </SectionLabel>
          <div className="rounded-md border border-border bg-surface px-3">
            <SettingRow label="Week starts on" description="Affects calendar and date range views.">
              <SegmentedControl<WeekStart>
                options={[{ label: "Mon", value: "monday" }, { label: "Sun", value: "sunday" }]}
                value={draft.weekStart}
                onChange={(v) => update("weekStart", v)}
              />
            </SettingRow>
            <SettingRow label="Confirm before delete" description="Show a confirmation dialog before deleting items.">
              <Toggle checked={draft.confirmBeforeDelete} onChange={(v) => update("confirmBeforeDelete", v)} />
            </SettingRow>
            <SettingRow label="Replay welcome tour" description="Watch the onboarding spotlight again.">
              <button
                type="button"
                onClick={() => setTimeout(() => openTour(), 200)}
                className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-xs font-medium text-txt-primary shadow-sm transition-colors hover:bg-surface-hover hover:text-brand-rose"
              >
                <PlayCircle className="h-3.5 w-3.5 text-txt-muted group-hover:text-brand-rose" />
                Replay
              </button>
            </SettingRow>
          </div>
        </div>
      </div>

      {/* Sticky Save Footer */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-border bg-panel py-4 px-2">
        <div>
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
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleCancel} className="text-sm text-txt-muted transition-colors hover:text-txt-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            className="rounded bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}

function BillingSettingsContent({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const { planTier } = usePlan();
  
  const TIER_STYLE: Record<string, { label: string; className: string }> = {
    essential: { label: "Essential", className: "bg-surface-hover text-txt-secondary border-border" },
    pro:       { label: "Pro",       className: "bg-brand-rose-dim text-brand-rose-deep border-brand-rose/20" },
    elite:     { label: "Elite",     className: "bg-brand-plum-dim text-brand-plum-deep border-brand-plum/20" },
    agency:    { label: "Agency",    className: "bg-brand-plum text-white border-transparent" },
  };

  const tier = TIER_STYLE[planTier] ?? TIER_STYLE.essential;

  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-txt-primary mb-1">Plan & Billing</h1>
        <p className="text-[13px] text-txt-muted">View your current subscription limits and manage your billing through Stripe.</p>
      </div>

      <div className="max-w-md">
        <SectionLabel>Current Plan</SectionLabel>
        <Link
          href="/billing"
          onClick={() => onOpenChange(false)}
          className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-hover hover:border-brand-rose/40 group"
        >
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[14px] font-medium text-txt-primary">
                Organization Plan
              </p>
              <span className={cn("rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", tier.className)}>
                {tier.label}
              </span>
            </div>
            <p className="mt-1 text-[12px] text-txt-muted group-hover:text-txt-secondary transition-colors">
              Manage subscription, limits & upgrade options →
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Wrapper Component ───────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsPanel({ open, onOpenChange }: Props) {
  // Wait until mounted to prevent hydration mismatches with Clerk
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-5xl w-full h-[85vh] p-0 border-border bg-panel shadow-2xl overflow-hidden" 
        size="xl"
      >
        {/* Render UserProfile embedded inside Radix Dialog context seamlessly */}
        {mounted && (
          <UserProfile 
            routing="virtual"
            appearance={{
              elements: {
                rootBox: "w-full h-full",
                card: "w-full h-full shadow-none bg-panel rounded-none",
                navbar: "border-r border-border bg-panel pt-4",
                navbarMobileMenuRow: "bg-surface border-border",
                navbarMobileMenuButton: "text-txt-primary",
                
                // Sidebar items
                navbarButton: "text-txt-muted hover:text-txt-primary hover:bg-surface transition-colors",
                navbarButton__active: "text-brand-rose bg-brand-rose/10",
                
                // Content area
                scrollBox: "bg-panel",
                pageScrollBox: "px-8 py-6", // Native padding for custom pages
                
                // Native headers
                headerTitle: "text-xl font-semibold text-txt-primary",
                headerSubtitle: "text-[13px] text-txt-muted",
                
                // Form elements
                profileSectionTitle: "text-sm font-medium text-txt-primary border-b border-border pb-2",
                profileSectionTitleText: "text-txt-primary",
                profileSectionContent: "text-txt-secondary",
                
                // Buttons & Inputs inside Clerk
                formButtonPrimary: "bg-brand-rose hover:bg-brand-rose/90 text-white",
                formButtonReset: "text-txt-muted hover:bg-surface",
                formFieldInput: "bg-surface border-border text-txt-primary focus:border-brand-rose",
                formFieldLabel: "text-txt-muted text-xs uppercase tracking-wider font-medium",
                
                // Footer
                footer: "hidden", // Hide Clerk watermark
              },
              variables: {
                colorPrimary: "#e11d48", // brand-rose
                colorBackground: "#09090b", // zinc-950
                colorText: "#e4e4e7", // zinc-200
                colorTextSecondary: "#a1a1aa", // zinc-400
                colorDanger: "#ef4444", // red-500
                colorInputBackground: "#18181b", // zinc-900 (surface)
              }
            }}
          >
            {/* Custom: App Settings */}
            <UserProfile.Page 
              label="App Settings" 
              labelIcon={<Sliders className="h-4 w-4" />} 
              url="app"
            >
              <AppSettingsContent />
            </UserProfile.Page>

            {/* Custom: Plan & Billing */}
            <UserProfile.Page 
              label="Plan & Billing" 
              labelIcon={<CreditCard className="h-4 w-4" />} 
              url="billing"
            >
              <BillingSettingsContent onOpenChange={onOpenChange} />
            </UserProfile.Page>

          </UserProfile>
        )}
      </DialogContent>
    </Dialog>
  );
}
