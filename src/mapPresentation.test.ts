import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { getHistoricalMapPlacement } from './historicalMaps';
import { clampMapCamera, deriveFrontLabelAnchors, deriveFrontSummaries, deriveMapConnections, deriveMapMarkerPresentation, deriveSameFrameMapConnections, deriveValidTargetIds, deriveVisibleMapLabelIds, getTerrainGlyphKind, MAX_MAP_ZOOM } from './mapPresentation';
import { strategicFronts } from './strategicMapData';

describe('map presentation model', () => {
  const europe = territories.filter((territory) => (territory.theater ?? 'europe') === 'europe');

  it('creates every adjacency once and marks hostile contacts as fronts', () => {
    const connections = deriveMapConnections(europe);
    const connectionKeys = connections.map(({ from, to }) => [from.id, to.id].sort().join(':'));

    expect(new Set(connectionKeys).size).toBe(connectionKeys.length);
    expect(connectionKeys).toContain('channel:france');
    expect(connections.find(({ from, to }) => [from.id, to.id].includes('libya') && [from.id, to.id].includes('egypt'))?.isFront).toBe(true);
    expect(connections.find(({ from, to }) => [from.id, to.id].includes('france') && [from.id, to.id].includes('lowlands'))?.isFront).toBe(false);
  });

  it('offers only adjacent hostile targets during offensive planning', () => {
    const targets = deriveValidTargetIds(europe, 'el_alamein', 'allies');

    expect([...targets]).toEqual(['tobruk']);
    expect(targets.has('alexandria')).toBe(false);
    expect(targets.has('egypt')).toBe(false);
  });

  it('builds numerous named fronts from the same territories used by the map', () => {
    const summaries = deriveFrontSummaries(europe, strategicFronts.filter((front) => front.theater === 'europe'), 'allies');
    const westernDesert = summaries.find((front) => front.id === 'western-desert');

    expect(strategicFronts).toHaveLength(78);
    expect(summaries.length).toBeGreaterThanOrEqual(30);
    expect(westernDesert?.territoryIds).toEqual(expect.arrayContaining(['tobruk', 'tripoli', 'el_agheila']));
    expect(westernDesert?.activeContacts).toBeGreaterThan(0);
    expect(summaries.find((front) => front.id === 'kursk-orel')?.territoryIds).toEqual(expect.arrayContaining(['kursk', 'orel', 'voronezh']));
  });

  it('keeps every strategic connection symmetric and inside its theater', () => {
    const byId = new Map(territories.map((territory) => [territory.id, territory]));
    territories.forEach((territory) => territory.neighbors.forEach((neighborId) => {
      const neighbor = byId.get(neighborId);
      expect(neighbor, `${territory.id} -> ${neighborId}`).toBeDefined();
      expect(neighbor?.neighbors).toContain(territory.id);
      expect(neighbor?.theater ?? 'europe').toBe(territory.theater ?? 'europe');
    }));
  });

  it('assigns every mapped sector to a declared front and every front to sectors', () => {
    const frontIds = new Set(strategicFronts.map((front) => front.id));
    territories.forEach((territory) => expect(frontIds.has(territory.frontId ?? ''), territory.id).toBe(true));
    strategicFronts.forEach((front) => {
      const members = territories.filter((territory) => territory.frontId === front.id);
      expect(members.length, front.id).toBeGreaterThan(0);
      expect(members.every((territory) => (territory.theater ?? 'europe') === front.theater), front.id).toBe(true);
    });
  });

  it('maps historical terrain labels to stable visual symbols', () => {
    expect(getTerrainGlyphKind('산악')).toBe('mountain');
    expect(getTerrainGlyphKind('정글')).toBe('forest');
    expect(getTerrainGlyphKind('해군기지')).toBe('naval');
    expect(getTerrainGlyphKind('강변')).toBe('river');
    expect(getTerrainGlyphKind('평야')).toBe('plains');
  });

  it('keeps zoom and camera movement inside the strategic map', () => {
    expect(clampMapCamera({ centerX: -400, centerY: 9999, zoom: 9 })).toEqual({ centerX: 100, centerY: 696.6666666666666, zoom: MAX_MAP_ZOOM });
    expect(clampMapCamera({ centerX: 300, centerY: 200, zoom: 0.4 })).toEqual({ centerX: 600, centerY: 380, zoom: 1 });
  });

  it('keeps the default map focused while preserving selected and unit locations', () => {
    const ordinary = deriveMapMarkerPresentation({
      mode: 'essential', selected: false, hasUnits: false, planningOrigin: false, validTarget: false,
      siteType: 'city', labelTier: 2, value: 5, frontId: 'western-desert', zoom: 2.4,
    });
    const selected = deriveMapMarkerPresentation({
      mode: 'essential', selected: true, hasUnits: false, planningOrigin: false, validTarget: false,
      siteType: 'city', labelTier: 2, value: 5, frontId: 'western-desert', zoom: 1,
    });
    const occupied = deriveMapMarkerPresentation({
      mode: 'essential', selected: false, hasUnits: true, planningOrigin: false, validTarget: false,
      siteType: 'region', labelTier: 3, value: 4, zoom: 1,
    });

    expect(ordinary).toMatchObject({ showLabel: false, secondary: true });
    expect(selected).toMatchObject({ showLabel: true, secondary: false, showDetailGlyph: true });
    expect(occupied).toMatchObject({ showLabel: true, secondary: false });
  });

  it('reveals more historical place names only when the player asks for denser labels', () => {
    const base = {
      selected: false, hasUnits: false, planningOrigin: false, validTarget: false,
      siteType: 'city' as const, labelTier: 1, value: 8, frontId: 'eastern-front', zoom: 2.2,
    };

    expect(deriveMapMarkerPresentation({ ...base, mode: 'essential' }).showLabel).toBe(false);
    expect(deriveMapMarkerPresentation({ ...base, mode: 'operational' }).showLabel).toBe(true);
    expect(deriveMapMarkerPresentation({ ...base, mode: 'all' }).showLabel).toBe(true);
  });

  it('keeps the higher-priority label when map labels would overlap', () => {
    const visible = deriveVisibleMapLabelIds([
      { id: 'minor-city', x: 200, y: 160, text: 'Minor city', priority: 10 },
      { id: 'selected-city', x: 204, y: 162, text: 'Selected city', priority: 100 },
      { id: 'distant-city', x: 430, y: 290, text: 'Distant city', priority: 20 },
    ], 1);

    expect([...visible]).toEqual(expect.arrayContaining(['selected-city', 'distant-city']));
    expect(visible.has('minor-city')).toBe(false);
  });

  it('never hides the explicitly selected map label', () => {
    const visible = deriveVisibleMapLabelIds([
      { id: 'unit-counter', x: 300, y: 210, text: '', priority: 1200, force: true, width: 52, height: 34 },
      { id: 'selected-city', x: 300, y: 210, text: 'Selected city', priority: 1000, force: true },
    ], 1.8);

    expect(visible.has('selected-city')).toBe(true);
  });

  it('does not draw false straight routes between the main map and a printed inset', () => {
    const asia = territories.filter((territory) => territory.theater === 'asia');
    const positions = Object.fromEntries(asia.map((territory) => [territory.id, getHistoricalMapPlacement('asia', territory)]));
    const connections = deriveMapConnections(asia);
    const visible = deriveSameFrameMapConnections(connections, positions);
    const keys = visible.map(({ from, to }) => [from.id, to.id].sort().join(':'));

    expect(keys).toContain('guam:midway');
    expect(keys).not.toContain('japan_home:midway');
    expect(keys).not.toContain('hokkaido:attu');
  });

  it('anchors front names to same-frame hostile contact segments, not all-member centroids', () => {
    const asia = territories.filter((territory) => territory.theater === 'asia');
    const positions = Object.fromEntries(asia.map((territory) => [territory.id, getHistoricalMapPlacement('asia', territory)]));
    const connections = deriveMapConnections(asia);
    const fronts = deriveFrontSummaries(asia, strategicFronts.filter((front) => front.theater === 'asia'), 'allies');
    const centralPacific = fronts.find((front) => front.id === 'central-pacific')!;
    const [anchor] = deriveFrontLabelAnchors([centralPacific], connections, positions);

    expect(anchor.frame).toBe('pacific-inset');
    expect(anchor.x).toBeGreaterThan(820);
    expect(anchor.x).toBeLessThan(1050);
    expect(anchor.y).toBeGreaterThan(340);
    expect(anchor.y).toBeLessThan(500);
  });
});
