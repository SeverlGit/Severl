"use client";

/**
 * App-specific settings panel — covers preferences that make sense for this
 * dashboard: display density, currency format, default invoice due days,
 * week start, timezone display, and notification preferences.
 *
 * All prefs are stored in localStorage under "severl:prefs" and read back
 * via the usePrefs() hook so any component can consume them.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type Density = "compact" | "comfortable" | "spacious";
export type CurrencyFormat = "USD" | "EUR" | "GBP" | "CAD" | "AUD";
export type WeekStart = "monday" | "sunday";
export type DueDayPreset = 7 | 14 | 30;

export type UserPrefs = {
  density: Density;
  currency: CurrencyFormat;
  defaultDueDays: DueDayPreset;
  weekStart: WeekStart;
  showRetainerInDeliverables: boolean;
  showCompletionPercent: boolean;
  confirmBeforeDelete: boolean;
  compactSidebar: boolean;
};

const DEFAULT_PREFS: UserPrefs = {
  density: "comfortable",
  currency: "USD",
  defaultDueDays: 14,
  weekStart: "monday",
  showRetainerInDeliverables: true,
  showCompletionPercent: true,
  confirmBeforeDelete: true,
  compactSidebar: false,
};

const STORAGE_KEY = "severl:prefs";

function loadPrefs(): UserPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: UserPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

// ─── Context ─────────────────────────────────────────────────────────────────

type PrefsContextValue = {
  prefs: UserPrefs;
  setPref: <K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) => void;
};

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const setPref = useCallback(<K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      savePrefs(next);
      return next;
    });
  }, []);

  return (
    <PrefsContext.Provider value={{ prefs, setPref }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}
