import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FleetMapLayer } from './FleetMapLayer';
import type { NavalTaskForce } from './jointOperations';
import type { NavalWaypoint } from './navalNavigation';
import { nauticalDistance, resolveNavalTerritoryPoint } from './navalNavigation';
import { projectGeographicPoint } from './geographicProjection';
import { getTerritoryGeography } from './territoryGeography';

const home: NavalWaypoint = { id: 'home', name: '진주만', latitude: 21.35, longitude: -157.95, basin: 'pacific' };
const position: NavalWaypoint = { id: 'at-sea', name: '태평양 항해 중', latitude: 24, longitude: -178, basin: 'pacific' };
const destination: NavalWaypoint = { id: 'destination', name: '사이판 동방', latitude: 15.2, longitude: 146, basin: 'pacific' };

function fleet(overrides: Partial<NavalTaskForce> = {}): NavalTaskForce {
  return {
    id: 'player-pacific', name: '태평양 항모전단', kind: 'carrier', commander: '지휘관', flagship: '기함',
    location: '진주만', ships: 8, readiness: 80, organization: 80, experience: 70, status: 'assigned', assignmentId: 'escort-1', historicalBasis: 'test',
    navigation: {
      version: 1, mode: 'outbound', homePort: home, position, destination, route: [home, position, destination],
      distanceNm: nauticalDistance(home, position) + nauticalDistance(position, destination), traveledNm: nauticalDistance(home, position),
      rangeNm: 10000, remainingRangeNm: 8300, cruiseKnots: 16, departedWeek: 1, lastProcessedWeek: 2,
      refuelWeeks: 0, distanceThisWeekNm: 1700, lastMessage: '합류점 이동 중',
    },
    ...overrides,
  };
}

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  const result: ReactElement<Record<string, unknown>>[] = [];
  Children.forEach(node, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return;
    result.push(child);
    result.push(...elements(child.props.children as ReactNode));
  });
  return result;
}

describe('actual fleet geographic layer', () => {
  it('renders authoritative navigation coordinates, not the fleet location text or home port', () => {
    const html = renderToStaticMarkup(<FleetMapLayer theater="asia" fleets={[fleet()]} onSelect={() => {}} symbolScale={0.5} />);
    const point = projectGeographicPoint('asia', position);
    expect(html).toContain(`data-fleet-map-x="${point.x}"`);
    expect(html).toContain(`data-fleet-map-y="${point.y}"`);
    expect(html).toContain('data-fleet-longitude="-178"');
    expect(html).toContain('24.00°N 178.00°W');
    expect(html).toContain('scale(0.5)');
  });

  it('draws only the selected active voyage and distinguishes distance already traveled', () => {
    const other = fleet({ id: 'other', name: '다른 함대' });
    const unselected = renderToStaticMarkup(<FleetMapLayer theater="asia" fleets={[fleet(), other]} onSelect={() => {}} />);
    expect(unselected).not.toContain('data-fleet-route-id');
    const selected = renderToStaticMarkup(<FleetMapLayer theater="asia" fleets={[fleet(), other]} selectedFleetId="player-pacific" onSelect={() => {}} />);
    expect(selected.match(/data-fleet-route-id=/g)).toHaveLength(1);
    expect(selected).toContain('fleet-map-route-completed');
    expect(selected).toContain('fleet-map-route-remaining');
    expect(selected).not.toContain('NaN');
  });

  it('does not invent positions for missing navigation, invalid points, sunk or out-of-theater fleets', () => {
    const invalid = fleet(); invalid.navigation!.position = { ...position, latitude: NaN };
    const html = renderToStaticMarkup(<FleetMapLayer theater="europe" fleets={[fleet(), fleet({ id: 'unknown', navigation: undefined }), invalid, fleet({ id: 'sunk', ships: 0 })]} onSelect={() => {}} />);
    expect(html).not.toContain('data-fleet-id=');
    expect(html).not.toContain('NaN');
  });

  it('never obtains or exposes a fleet not supplied by the caller', () => {
    const html = renderToStaticMarkup(<FleetMapLayer theater="asia" fleets={[fleet()]} selectedFleetId="enemy-secret" onSelect={() => {}} />);
    expect(html.match(/data-fleet-id=/g)).toHaveLength(1);
    expect(html).not.toContain('enemy-secret');
    expect(html).not.toContain('data-fleet-route-id');
  });

  it('does not draw a stale completed voyage after arriving on station', () => {
    const arrived = fleet(); arrived.navigation!.mode = 'on-station';
    arrived.navigation!.traveledNm = arrived.navigation!.distanceNm;
    arrived.navigation!.position = destination;
    const html = renderToStaticMarkup(<FleetMapLayer theater="asia" fleets={[arrived]} selectedFleetId={arrived.id} onSelect={() => {}} />);
    expect(html).toContain('현장 엄호');
    expect(html).not.toContain('data-fleet-route-id');
  });

  it('shows an unfinished convoy-following leg even while the fleet remains on station', () => {
    const escort = fleet(); escort.navigation!.mode = 'on-station';
    const html = renderToStaticMarkup(<FleetMapLayer theater="asia" fleets={[escort]} selectedFleetId={escort.id} onSelect={() => {}} />);
    expect(html).toContain('현장 엄호');
    expect(html).toContain(`data-fleet-route-id="${escort.id}"`);
    expect(html).toContain('fleet-map-route-completed');
    expect(html).toContain('fleet-map-route-remaining');
    expect(html).toContain('data-fleet-longitude="-178"');
  });

  it('filters markers outside the camera viewport without modifying source state', () => {
    const force = fleet();
    const before = JSON.stringify(force);
    const html = renderToStaticMarkup(<FleetMapLayer theater="asia" fleets={[force]} viewport={{ x: 0, y: 0, width: 20, height: 20 }} onSelect={() => {}} />);
    expect(html).not.toContain('data-fleet-id=');
    expect(JSON.stringify(force)).toBe(before);
  });

  it('keeps co-located fleets individually selectable without moving their geographic anchors', () => {
    const html = renderToStaticMarkup(<FleetMapLayer theater="asia" fleets={[fleet(), fleet({ id: 'second', name: '제2함대' })]} onSelect={() => {}} />);
    expect(html.match(/class="fleet-map-leader"/g)).toHaveLength(2);
    expect(html.match(/data-fleet-longitude="-178"/g)).toHaveLength(2);
    expect(html.match(/role="button"/g)).toHaveLength(2);
  });

  it.each([.5, 1, 2])('separates the Scapa Flow fleet chip from the Scotland city at scale %s while retaining its real coordinates', (scale) => {
    const navPosition = resolveNavalTerritoryPoint('scotland')!;
    const actual = projectGeographicPoint('europe', navPosition);
    const city = projectGeographicPoint('europe', getTerritoryGeography('scotland')!);
    const force = fleet();
    force.navigation!.position = navPosition;
    force.navigation!.mode = 'in-port';
    const before = structuredClone(force);
    const tree = FleetMapLayer({ theater: 'europe', fleets: [force], onSelect: () => {}, symbolScale: scale,
      obstacles: [{ ...city, width: 44, height: 44 }] });
    const all = elements(tree);
    const marker = all.find((item) => item.props['data-fleet-id'] === force.id)!;
    expect(marker.props['data-fleet-map-x']).toBe(actual.x);
    expect(marker.props['data-fleet-map-y']).toBe(actual.y);
    expect(marker.props['data-fleet-latitude']).toBe(navPosition.latitude);
    expect(marker.props['data-fleet-longitude']).toBe(navPosition.longitude);
    const dx = Math.abs(Number(marker.props['data-fleet-chip-x']) - city.x) / scale;
    const dy = Math.abs(Number(marker.props['data-fleet-chip-y']) - city.y) / scale;
    expect(dx >= 48 || dy >= 48).toBe(true);
    expect(marker.props.pointerEvents).toBe('none');
    const hitbox = all.find((item) => item.props.className === 'fleet-map-hitbox')!;
    expect(hitbox.props).toMatchObject({ width: 40, height: 40, pointerEvents: 'all' });
    const decoration = all.find((item) => item.props['aria-hidden'] === 'true' && item.props.pointerEvents === 'none');
    expect(decoration).toBeDefined();
    expect(all.some((item) => item.props.className === 'fleet-map-leader')).toBe(true);
    expect(all.some((item) => item.props.className === 'fleet-map-exact-position')).toBe(true);
    // Focus bounds and browser role-based clicks must encompass the chip only,
    // not the line stretching back to the protected city anchor.
    expect(elements(marker).some((item) => item.props.className === 'fleet-map-leader')).toBe(false);
    expect(elements(marker).some((item) => item.props.className === 'fleet-map-exact-position')).toBe(false);
    expect(marker.props.transform).toBe(`translate(${marker.props['data-fleet-chip-offset-x']} ${marker.props['data-fleet-chip-offset-y']})`);
    expect(force).toEqual(before);
  });

  it('keeps chip placement stable when selecting a fleet and exposes only its hitbox to pointer input', () => {
    const input = { theater: 'asia' as const, fleets: [fleet(), fleet({ id: 'second' })], onSelect: () => {} };
    const unselected = elements(FleetMapLayer(input));
    const selected = elements(FleetMapLayer({ ...input, selectedFleetId: 'second' }));
    for (const id of ['player-pacific', 'second']) {
      const first = unselected.find((element) => element.props['data-fleet-id'] === id)!;
      const next = selected.find((element) => element.props['data-fleet-id'] === id)!;
      expect(next.props['data-fleet-chip-x']).toBe(first.props['data-fleet-chip-x']);
      expect(next.props['data-fleet-chip-y']).toBe(first.props['data-fleet-chip-y']);
      expect(next.props.pointerEvents).toBe('none');
      expect(next.props.tabIndex).toBe(0);
    }
  });

  it('selects with Enter/Space/click but prevents map drag, double zoom and global keyboard actions', () => {
    const onSelect = vi.fn();
    const tree = FleetMapLayer({ theater: 'asia', fleets: [fleet()], onSelect });
    const marker = elements(tree).find((item) => item.props['data-fleet-id'] === 'player-pacific')!;
    for (const handler of ['onPointerDown', 'onMouseDown', 'onDoubleClick']) {
      const stopPropagation = vi.fn();
      (marker.props[handler] as (event: unknown) => void)({ stopPropagation });
      expect(stopPropagation).toHaveBeenCalledOnce();
    }
    expect(onSelect).not.toHaveBeenCalled();
    for (const key of ['Enter', ' ']) {
      const stopPropagation = vi.fn(); const preventDefault = vi.fn();
      (marker.props.onKeyDown as (event: unknown) => void)({ key, repeat: false, stopPropagation, preventDefault });
      expect(stopPropagation).toHaveBeenCalledOnce(); expect(preventDefault).toHaveBeenCalledOnce();
    }
    (marker.props.onClick as (event: unknown) => void)({ stopPropagation: vi.fn() });
    expect(onSelect).toHaveBeenCalledTimes(3);
    expect(onSelect).toHaveBeenLastCalledWith('player-pacific');
  });
});
