import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 999;
  const target = new Date(dateStr);
  return Math.round((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function renewalUrgency(daysRemaining: number): 'red' | 'amber' | 'green' {
  if (daysRemaining < 14) return 'red';
  if (daysRemaining <= 30) return 'amber';
  return 'green';
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
