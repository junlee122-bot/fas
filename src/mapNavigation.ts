import type { StrategicMapRegionDefinition } from './mapRegions';
import type { Territory } from './types';

function normalizeSearchText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ko').replace(/\s+/g, ' ').trim();
}

/** Match every query word while preserving the authored navigation order. */
export function filterMapDestinations(
  regions: StrategicMapRegionDefinition[],
  cities: Territory[],
  query: string,
): { regions: StrategicMapRegionDefinition[]; cities: Territory[] } {
  const words = normalizeSearchText(query).split(' ').filter(Boolean);
  const matches = (values: string[]) => {
    const text = normalizeSearchText(values.join(' '));
    return words.every((word) => text.includes(word));
  };
  return {
    regions: regions.filter((region) => matches([region.name, region.shortName, region.subtitle])),
    cities: cities.filter((city) => matches([city.name, city.region])),
  };
}
