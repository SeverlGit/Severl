"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type TopbarTitleContextValue = {
  detailTitle: string | null;
  setDetailTitle: (title: string | null) => void;
};

const TopbarTitleContext = createContext<TopbarTitleContextValue | null>(null);

export function TopbarTitleProvider({ children }: { children: React.ReactNode }) {
  const [detailTitle, setDetailTitleState] = useState<string | null>(null);

  const setDetailTitle = useCallback((title: string | null) => {
    setDetailTitleState(title);
  }, []);

  const value = useMemo(
    () => ({ detailTitle, setDetailTitle }),
    [detailTitle, setDetailTitle],
  );

  return <TopbarTitleContext.Provider value={value}>{children}</TopbarTitleContext.Provider>;
}

export function useTopbarDetailTitle() {
  const ctx = useContext(TopbarTitleContext);
  if (!ctx) {
    throw new Error("useTopbarDetailTitle must be used within TopbarTitleProvider");
  }
  return ctx;
}
