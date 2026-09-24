import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { getGeographicMapPlacement } from './geographicMap';
import { projectGeographicPoint, unwrapGeographicLongitude } from './geographicProjection';
import { getTerritoryGeography } from './territoryGeography';
import { clusterMapPoints, getMapScreenScale } from './mapInteraction';
import { clampMapCamera } from './mapPresentation';
import { getDefaultMapRegion, getMapRegionCamera, getMapRegionForTerritory, getMapRegionsForTheater, getTerritoriesForMapRegion, strategicMapRegions } from './mapRegions';

describe('regional strategic maps', () => {
  it('provides an overview and multiple detailed maps for both theaters', () => {
    expect(strategicMapRegions).toHaveLength(22);
    expect(getMapRegionsForTheater('europe')).toHaveLength(11);
    expect(getMapRegionsForTheater('asia')).toHaveLength(11);
    expect(getDefaultMapRegion('europe').id).toBe('europe-overview');
    expect(getDefaultMapRegion('asia').id).toBe('asia-overview');
  });

  it('focuses regional maps on real geographic membership', () => {
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

  it('keeps every detailed region in the continuous geographic frame and declared degree bounds', () => {
    strategicMapRegions.filter((region) => !region.overview).forEach((region) => {
      expect(region.frameId, region.id).toBe('main');
      expect(region.geographicArea, region.id).toBeDefined();
      const members = getTerritoriesForMapRegion(territories, region);
      expect(members.length, region.id).toBeGreaterThan(0);
      if (region.territoryIds) expect(members.map((territory) => territory.id).sort(), region.id).toEqual([...region.territoryIds].sort());
      members.forEach((territory) => {
        const coordinate = getTerritoryGeography(territory.id)!;
        const longitude = unwrapGeographicLongitude(region.theater, coordinate.longitude);
        const area = region.geographicArea!;
        expect(getGeographicMapPlacement(region.theater, territory)!.frame, `${region.id}: ${territory.id}`).toBe('main');
        expect(longitude, `${region.id}: ${territory.id}`).toBeGreaterThanOrEqual(area.west);
        expect(longitude, `${region.id}: ${territory.id}`).toBeLessThanOrEqual(area.east);
        expect(coordinate.latitude, `${region.id}: ${territory.id}`).toBeGreaterThanOrEqual(area.south);
        expect(coordinate.latitude, `${region.id}: ${territory.id}`).toBeLessThanOrEqual(area.north);
      });
    });
  });

  it('selects Pacific membership by geography rather than the removed archive inset', () => {
    ['china-korea', 'manchuria-korea-detail'].forEach((id) => {
      const region = strategicMapRegions.find((candidate) => candidate.id === id)!;
      const ids = getTerritoriesForMapRegion(territories, region).map((territory) => territory.id);
      expect(ids, id).not.toContain('guam');
      expect(ids, id).not.toContain('iwo_jima');
      expect(ids, id).not.toContain('hawaii');
    });
    const japan = strategicMapRegions.find((candidate) => candidate.id === 'japan-philippines')!;
    const japanIds = getTerritoriesForMapRegion(territories, japan).map(({ id }) => id);
    expect(japanIds).toContain('iwo_jima');
    expect(japanIds).toContain('japan_home');
    expect(japanIds).not.toContain('guam');
    expect(japanIds).not.toContain('hawaii');
  });

  it('uses a focused island group for Palau, Guam and Saipan shortcuts', () => {
    const region = strategicMapRegions.find((candidate) => candidate.id === 'marianas-carolines')!;
    const ids = getTerritoriesForMapRegion(territories, region).map((territory) => territory.id);
    expect(ids).toEqual(expect.arrayContaining(['palau', 'guam', 'saipan', 'truk']));
    expect(ids).not.toContain('hawaii');
    expect(ids).not.toContain('attu');
    expect(ids).not.toContain('philippines');
    ['palau', 'guam', 'saipan'].forEach((id) => {
      expect(getMapRegionForTerritory(territories, id, 'asia').id, id).toBe(region.id);
    });
    expect(getMapRegionForTerritory(territories, 'hawaii', 'asia').id).toBe('central-north-pacific');
  });

  it('keeps theater overviews inclusive of the full continuous Pacific', () => {
    const overview = getDefaultMapRegion('asia');
    const ids = getTerritoriesForMapRegion(territories, overview).map((territory) => territory.id);
    expect(overview.frameId).toBe('all');
    expect(ids).toContain('japan_home');
    expect(ids).toContain('hawaii');
    expect(ids).toContain('kiska');
    expect(ids).toContain('dutch_harbor');
    expect(ids).toHaveLength(territories.filter((territory) => territory.theater === 'asia').length);
  });

  it('exports normalized cameras so the region reset state matches its displayed viewport', () => {
    strategicMapRegions.forEach((region) => {
      expect(region.camera, region.id).toEqual(clampMapCamera(region.camera));
      expect(getMapRegionCamera(region), region.id).toEqual(region.camera);
    });
    strategicMapRegions.filter((region) => region.geographicArea).forEach((region) => {
      const area = region.geographicArea!;
      const camera = getMapRegionCamera(region);
      [projectGeographicPoint(region.theater, { latitude: area.north, longitude: area.west }),
        projectGeographicPoint(region.theater, { latitude: area.south, longitude: area.east })].forEach((point) => {
        expect(Math.abs(point.x - camera.centerX), region.id).toBeLessThanOrEqual(600 / camera.zoom);
        expect(Math.abs(point.y - camera.centerY), region.id).toBeLessThanOrEqual(380 / camera.zoom);
      });
    });
  });

  it('uses the same normalized camera for membership even when passed an unnormalized region', () => {
    const region = strategicMapRegions.find((candidate) => candidate.id === 'africa-middle-east')!;
    const unnormalized = { ...region, camera: { centerX: 725, centerY: 660, zoom: 1.85 } };
    const memberIds = (candidate: typeof region) => getTerritoriesForMapRegion(territories, candidate).map((territory) => territory.id);
    expect(memberIds(unnormalized)).toEqual(memberIds(region));
    expect(memberIds(unnormalized)).toContain('cairo');
    expect(memberIds(unnormalized)).toContain('tehran');
    expect(memberIds(unnormalized)).not.toContain('germany');
  });

  it.each([
    ['normalized canvas', 1200, 760],
    ['1080p', 1920, 1080],
    ['1440p', 2560, 1440],
    ['4K', 3840, 2160],
  ] as const)('keeps all 219 destination shortcuts visible and selectable at %s', (_label, width, height) => {
    expect(territories).toHaveLength(219);
    territories.forEach((territory) => {
      const theater = territory.theater ?? 'europe';
      const region = getMapRegionForTerritory(territories, territory.id, theater);
      const members = getTerritoriesForMapRegion(territories, region);
      const point = getGeographicMapPlacement(theater, territory)!;
      const camera = getMapRegionCamera(region);
      const scale = getMapScreenScale(width, height, camera);
      const label = `${region.id}: ${territory.id}`;
      expect(members.map(({ id }) => id), label).toContain(territory.id);
      expect(Math.abs(point.x - camera.centerX), label).toBeLessThanOrEqual(600 / camera.zoom);
      expect(Math.abs(point.y - camera.centerY), label).toBeLessThanOrEqual(380 / camera.zoom);
      const screenX = width / 2 + (point.x - camera.centerX) * scale;
      const screenY = height / 2 + (point.y - camera.centerY) * scale;
      expect(screenX, label).toBeGreaterThanOrEqual(0);
      expect(screenX, label).toBeLessThanOrEqual(width);
      expect(screenY, label).toBeGreaterThanOrEqual(0);
      expect(screenY, label).toBeLessThanOrEqual(height);
      const points = members.map((member) => ({ id: member.id, ...getGeographicMapPlacement(theater, member)! }));
      const clusters = clusterMapPoints(points, scale, territory.id);
      // Shared real places (Cairo/command district, for example) must remain
      // available in a cluster, with the actively selected ID as its anchor.
      expect(clusters.flatMap((cluster) => cluster.members.map(({ id }) => id)).sort()).toEqual(members.map(({ id }) => id).sort());
      expect(clusters.some((cluster) => cluster.anchor.id === territory.id), label).toBe(true);
    });
  });
});
