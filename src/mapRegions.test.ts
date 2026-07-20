import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { getDefaultMapRegion, getMapRegionForTerritory, getMapRegionsForTheater, getTerritoriesForMapRegion, strategicMapRegions } from './mapRegions';

describe('regional strategic maps', () => {
  it('provides an overview and multiple detailed maps for both theaters', () => {
    expect(strategicMapRegions).toHaveLength(14);
    expect(getMapRegionsForTheater('europe')).toHaveLength(7);
    expect(getMapRegionsForTheater('asia')).toHaveLength(7);
    expect(getDefaultMapRegion('europe').id).toBe('europe-overview');
    expect(getDefaultMapRegion('asia').id).toBe('asia-overview');
  });

  it('focuses regional maps on calibrated territory coordinates', () => {
    const westernEurope = strategicMapRegions.find((region) => region.id === 'western-europe')!;
    const indiaBurma = strategicMapRegions.find((region) => region.id === 'india-burma')!;
    const westernIds = new Set(getTerritoriesForMapRegion(territories, westernEurope).map((territory) => territory.id));
    const indiaBurmaIds = new Set(getTerritoriesForMapRegion(territories, indiaBurma).map((territory) => territory.id));

    expect(westernIds.has('normandy')).toBe(true);
    expect(westernIds.has('moscow')).toBe(false);
    expect(indiaBurmaIds.has('imphal')).toBe(true);
    expect(indiaBurmaIds.has('japan_home')).toBe(false);
  });

  it('opens both the Chongqing command seat and Joseon homeland in the China–Korea regional map', () => {
    expect(getMapRegionForTerritory(territories, 'china_interior', 'asia').id).toBe('china-korea');
    expect(getMapRegionForTerritory(territories, 'korea', 'asia').id).toBe('china-korea');
  });
});
