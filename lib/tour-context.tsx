"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { OrgUIMeta } from "@/lib/database.types";
import { startMainTour } from "@/lib/tour-guides";

type TourContextValue = {
  openTour: () => void;
  uiMeta: OrgUIMeta;
  markLocalSeen: (key: keyof OrgUIMeta) => void;
};

const TourContext = createContext<TourContextValue | null>(null);

type Props = {
  uiMeta: OrgUIMeta;
  children: React.ReactNode;
};

export function TourProvider({ uiMeta: initialUiMeta, children }: Props) {
  const [uiMeta, setUiMeta] = useState<OrgUIMeta>(initialUiMeta);

  // Sync if server prop changes
  useEffect(() => {
    setUiMeta(initialUiMeta);
  }, [initialUiMeta]);

  // Main global welcome tour triggers once on load if unseen
  useEffect(() => {
    if (!uiMeta.has_seen_tour) {
      // Small delay ensures DOM nodes like #tour-nav-* are painted
      const t = setTimeout(() => {
        startMainTour();
        setUiMeta((prev) => ({ ...prev, has_seen_tour: true }));
      }, 800);
      return () => clearTimeout(t);
    }
  }, [uiMeta.has_seen_tour]);

  const markLocalSeen = (key: keyof OrgUIMeta) => {
    setUiMeta((prev) => ({ ...prev, [key]: true }));
  };

  const openTour = () => {
    // Give time for any sidebars/menus to close
    setTimeout(() => {
      startMainTour();
    }, 200);
  };

  return (
    <TourContext.Provider value={{ openTour, uiMeta, markLocalSeen }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside TourProvider");
  return ctx;
}
