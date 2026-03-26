import smmFreelanceConfig from './smm_freelance';
import smmAgencyConfig from './smm_agency';

export const verticalConfigs = {
  smm_freelance: smmFreelanceConfig,
  smm_agency: smmAgencyConfig,
} as const;

export function getVerticalConfig(vertical: string) {
  if (vertical === 'smm_agency') {
    return verticalConfigs.smm_agency;
  }
  return verticalConfigs.smm_freelance;
}

