import { SiteDataset } from './types';
import { bajajEnergyDataset } from './bajaj-energy';
import { demoPharmaDataset } from './demo-pharma';
import { bharatConsumerDataset } from './bharat-consumer';

const REGISTRY: Record<string, SiteDataset> = {
  'bajaj-energy': bajajEnergyDataset,
  'bharat-consumer': bharatConsumerDataset,
  demo: demoPharmaDataset,
};

/** Resolve a dataset by key, falling back to the generic pharma demo. */
export function getDataset(key: string | null | undefined): SiteDataset {
  if (key && REGISTRY[key]) return REGISTRY[key];
  return demoPharmaDataset;
}

export { SiteDataset };
