'use client';

import React, { createContext, useContext } from 'react';
import smmFreelanceConfig, {
  type VerticalConfig as FreelanceVerticalConfig,
} from '@/config/verticals/smm_freelance';
import smmAgencyConfig, {
  type VerticalConfig as AgencyVerticalConfig,
} from '@/config/verticals/smm_agency';

export type AnyVerticalConfig = FreelanceVerticalConfig | AgencyVerticalConfig;

type VerticalConfigContextValue = {
  vertical: AnyVerticalConfig;
};

const VerticalConfigContext = createContext<VerticalConfigContextValue | null>(null);

type ProviderProps = {
  verticalSlug: 'smm_freelance' | 'smm_agency';
  children: React.ReactNode;
};

export function VerticalConfigProvider({ verticalSlug, children }: ProviderProps) {
  const vertical =
    verticalSlug === 'smm_agency'
      ? (smmAgencyConfig as AnyVerticalConfig)
      : (smmFreelanceConfig as AnyVerticalConfig);

  return (
    <VerticalConfigContext.Provider value={{ vertical }}>
      {children}
    </VerticalConfigContext.Provider>
  );
}

export function useVerticalConfig() {
  const ctx = useContext(VerticalConfigContext);
  if (!ctx) {
    throw new Error('useVerticalConfig must be used within VerticalConfigProvider');
  }
  return ctx.vertical;
}

