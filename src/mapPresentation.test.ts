import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { getHistoricalMapPlacement } from './historicalMaps';
import { clampMapCamera, deriveCrossFrameMapConnections, deriveFrontLabelAnchors, deriveFrontSummaries, deriveMapConnections, deriveMapMarkerPresentation, deriveSameFrameMapConnections, deriveValidTargetIds, deriveVisibleMapLabelIds, getCrossFrameMapTransfer, getTerrainGlyphKind, MAX_MAP_ZOOM } from './mapPresentation';
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

  it('separates land fronts, sea contacts and non-hostile crossings without losing links', () => {
    const connections = deriveMapConnections(territories);
    const connection = (a: string, b: string) => connections.find(({ from, to }) => [from.id, to.id].includes(a) && [from.id, to.id].includes(b));
    expect(connection('egypt', 'libya')).toMatchObject({ isFront: true, isLandFront: true, isSeaContact: false, routeKind: 'land' });
    expect(connection('britain', 'channel')).toMatchObject({ isFront: true, isLandFront: false, isSeaContact: true, routeKind: 'sea' });
    expect(connection('japan_home', 'midway')).toMatchObject({ isFront: true, isLandFront: false, isSeaContact: true, routeKind: 'sea-crossing' });
    expect(connection('tunisia', 'sicily')).toMatchObject({ isFront: false, isLandFront: false, isSeaContact: false, routeKind: 'sea-crossing' });
    connections.forEach((item) => expect(Number(item.isLandFront) + Number(item.isSeaContact)).toBe(Number(item.isFront)));
  });

  it('breaks front totals into land and sea contacts instead of implying every island link is a land battle', () => {
    const summaries = deriveFrontSummaries(territories, strategicFronts, 'allies');
    summaries.forEach((front) => expect(front.activeContacts).toBe(front.landContacts + front.seaContacts));
    const centralPacific = summaries.find((front) => front.id === 'central-pacific');
    expect(centralPacific?.landContacts).toBe(0);
    expect(centralPacific?.seaContacts).toBeGreaterThan(0);
    expect(summaries.find((front) => front.id === 'egypt-suez')?.landContacts).toBeGreaterThan(0);
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

  it('uses screen scales below one for fixed-size labels in a narrow desktop map', () => {
    const candidates = [
      { id: 'a', x: 0, y: 0, text: 'A', width: 80, height: 18, priority: 20 },
      { id: 'b', x: 100, y: 0, text: 'B', width: 80, height: 18, priority: 10 },
    ];
    expect([...deriveVisibleMapLabelIds(candidates, .5, 0)]).toEqual(['a']);
    expect([...deriveVisibleMapLabelIds(candidates, 1, 0)]).toEqual(['a', 'b']);
    expect([...deriveVisibleMapLabelIds(candidates, 2, 0)]).toEqual(['a', 'b']);
  });

  it('falls back to a neutral label scale for invalid measurements', () => {
    const candidates = [
      { id: 'a', x: 0, y: 0, text: 'A', width: 80, height: 18, priority: 20 },
      { id: 'b', x: 60, y: 0, text: 'B', width: 80, height: 18, priority: 10 },
    ];
    [0, -1, Number.NaN, Number.POSITIVE_INFINITY].forEach((scale) => {
      expect([...deriveVisibleMapLabelIds(candidates, scale, 0)]).toEqual(['a']);
    });
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

  it('preserves every cross-frame adjacency as a renderable transfer instead of dropping it', () => {
    const asia = territories.filter((territory) => territory.theater === 'asia');
    const positions = Object.fromEntries(asia.map((territory) => [territory.id, getHistoricalMapPlacement('asia', territory)]));
    const connections = deriveMapConnections(asia);
    const direct = deriveSameFrameMapConnections(connections, positions);
    const transfers = deriveCrossFrameMapConnections(connections, positions);
    const keys = transfers.map((connection) => connection.id);

    expect(direct.length + transfers.length).toBe(connections.length);
    expect(new Set(keys).size).toBe(transfers.length);
    expect(keys).toContain('japan_home:midway');
    expect(keys).toContain('attu:hokkaido');
    const hostile = transfers.find((connection) => connection.id === 'japan_home:midway')!;
    expect(hostile.isFront).toBe(true);
    expect(hostile.fromPoint).toMatchObject({ ...positions[hostile.from.id] });
    expect(hostile.toPoint).toMatchObject({ ...positions[hostile.to.id] });
    transfers.forEach((connection) => expect(connection.fromPoint.frame).not.toBe(connection.toPoint.frame));
  });

  it('retains directional endpoints for approved orders crossing frames', () => {
    const positions = {
      main: { x: 100, y: 200 },
      inset: { x: 800, y: 400, frame: 'pacific-inset' },
      neighbor: { x: 120, y: 220, frame: 'main' },
    };
    expect(getCrossFrameMapTransfer('inset', 'main', positions)).toEqual({
      fromPoint: positions.inset,
      toPoint: { ...positions.main, frame: 'main' },
    });
    expect(getCrossFrameMapTransfer('main', 'neighbor', positions)).toBeNull();
    expect(getCrossFrameMapTransfer('missing', 'inset', positions)).toBeNull();
    expect(getCrossFrameMapTransfer('main', 'missing', positions)).toBeNull();
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
