import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { getDefaultMapRegion, getMapRegionForTerritory, getMapRegionsForTheater, getTerritoriesForMapRegion, strategicMapRegions } from './mapRegions';

describe('regional strategic maps', () => {
  it('provides an overview and multiple detailed maps for both theaters', () => {
    expect(strategicMapRegions).toHaveLength(22);
    expect(getMapRegionsForTheater('europe')).toHaveLength(11);
    expect(getMapRegionsForTheater('asia')).toHaveLength(11);
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

  it('opens Chongqing and Joseon in their new close operational maps', () => {
    expect(getMapRegionForTerritory(territories, 'china_interior', 'asia').id).toBe('china-heartland');
    expect(getMapRegionForTerritory(territories, 'korea', 'asia').id).toBe('manchuria-korea-detail');
  });
});
