"use client";

import React, { createContext, useContext, useState } from "react";
import type { OrgUIMeta } from "@/lib/database.types";
import { WalkthroughTour } from "@/components/dashboard/WalkthroughTour";
import { MilestoneDialogs } from "@/components/dashboard/MilestoneDialogs";

type TourContextValue = {
  openTour: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export type UIMetrics = {
  clients: number;
  deliverables: number;
  invoices: number;
};

type Props = {
  uiMeta: OrgUIMeta;
  metrics: UIMetrics;
  children: React.ReactNode;
};

export function TourProvider({ uiMeta, metrics, children }: Props) {
  // If the user hasn't seen the tour, open it automatically
  const [tourOpen, setTourOpen] = useState(() => !uiMeta.has_seen_tour);

  return (
    <TourContext.Provider value={{ openTour: () => setTourOpen(true) }}>
      {children}
      
      <WalkthroughTour 
        open={tourOpen} 
        onOpenChange={setTourOpen} 
        hasSeen={Boolean(uiMeta.has_seen_tour)}
      />
      
      <MilestoneDialogs uiMeta={uiMeta} metrics={metrics} />
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside TourProvider");
  return ctx;
}
