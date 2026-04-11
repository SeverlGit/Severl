'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type RequiredTier = 'pro' | 'elite' | 'agency';

const TIER_LABELS: Record<RequiredTier, string> = {
  pro: 'Pro',
  elite: 'Elite',
  agency: 'Agency',
};

type Props = {
  featureName: string;
  requiredTier: RequiredTier;
  /** true = icon + text inline; false (default) = banner card */
  compact?: boolean;
  className?: string;
};

/**
 * UpgradePrompt — shown inline wherever a gated feature is triggered.
 *
 * Compact mode: renders a small inline nudge (icon + text + link).
 * Default mode: renders a blush-tinted banner card suitable for empty states.
 *
 * Example:
 *   <UpgradePrompt featureName="invoice payment links" requiredTier="pro" />
 */
export function UpgradePrompt({ featureName, requiredTier, compact = false, className }: Props) {
  const tierLabel = TIER_LABELS[requiredTier];

  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-[11px] text-txt-muted', className)}>
        <Sparkles className="h-3 w-3 shrink-0 text-brand-rose" />
        <span>
          {featureName} is available on{' '}
          <Link
            href="/billing"
            className="font-medium text-brand-rose underline-offset-2 hover:underline"
          >
            {tierLabel}+
          </Link>
        </span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-brand-rose/20 bg-brand-rose-dim px-4 py-3',
        className,
      )}
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-brand-rose-deep">
          {featureName.charAt(0).toUpperCase() + featureName.slice(1)} is a{' '}
          <span className="font-semibold">{tierLabel}</span> feature
        </p>
        <p className="mt-0.5 text-[11px] text-txt-muted">
          Upgrade to unlock this and other professional features.
        </p>
      </div>
      <Link
        href="/billing"
        className="shrink-0 self-center rounded-md bg-brand-rose px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-rose-deep"
      >
        Upgrade
      </Link>
    </div>
  );
}
