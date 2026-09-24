import { describe, expect, it } from 'vitest';
import { filterMapDestinations } from './mapNavigation';
import type { StrategicMapRegionDefinition } from './mapRegions';
import type { Territory } from './types';

const regions: StrategicMapRegionDefinition[] = [
  { id: 'overview', theater: 'europe', frameId: 'main', name: '유럽 전체', shortName: '전체', subtitle: '전구 전체 보기', camera: { centerX: 600, centerY: 380, zoom: 1 }, overview: true },
  { id: 'west', theater: 'europe', frameId: 'main', name: '서유럽 작전구', shortName: '서유럽', subtitle: '노르망디·Paris 방면', camera: { centerX: 430, centerY: 430, zoom: 2 } },
];
const cities: Territory[] = [
  { id: 'normandy', name: '노르망디', region: '프랑스 서부', x: 10, y: 10, controller: 'axis', value: 8, supply: 70, terrain: '평야', neighbors: [] },
  { id: 'paris', name: 'Paris', region: '프랑스 수도', x: 20, y: 10, controller: 'axis', value: 10, supply: 80, terrain: '도시', neighbors: [] },
];

describe('map destination search', () => {
  it('keeps authored order and all scoped destinations for an empty search', () => {
    expect(filterMapDestinations(regions, cities, '  ')).toEqual({ regions, cities });
  });

  it('matches region subtitles and city names with case and unicode normalization', () => {
    const result = filterMapDestinations(regions, cities, ' ＰＡＲＩＳ ');
    expect(result.regions.map((region) => region.id)).toEqual(['west']);
    expect(result.cities.map((city) => city.id)).toEqual(['paris']);
  });

  it('requires all query words across name and region fields', () => {
    expect(filterMapDestinations(regions, cities, '  프랑스  노르망디 ').cities.map((city) => city.id)).toEqual(['normandy']);
    expect(filterMapDestinations(regions, cities, '노르망디 수도').cities).toEqual([]);
  });

  it('does not invent destinations outside the provided scope or mutate inputs', () => {
    const regionIds = regions.map((region) => region.id);
    const cityIds = cities.map((city) => city.id);
    expect(filterMapDestinations(regions, cities.slice(0, 1), 'Paris').cities).toEqual([]);
    expect(filterMapDestinations(regions, cities, '존재하지않는도시')).toEqual({ regions: [], cities: [] });
    expect(regions.map((region) => region.id)).toEqual(regionIds);
    expect(cities.map((city) => city.id)).toEqual(cityIds);
  });
});
