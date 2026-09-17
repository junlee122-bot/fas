import type { KeyboardEvent, PointerEvent, MouseEvent } from 'react';
import type { NavalTaskForce } from './jointOperations';
import type { FleetNavigationMode, NavalWaypoint } from './navalNavigation';
import { nauticalDistance } from './navalNavigation';
import { getGeographicPlotBounds, isGeographicPointInBounds, projectGeographicPoint } from './geographicProjection';
import type { GeographicMapPoint } from './geographicProjection';
import type { TheaterId } from './types';
import { FLEET_MAP_CHIP_SIZE, layoutFleetMapChips, type FleetMapObstacle } from './fleetMapLayout';
import './FleetMapLayer.css';

export interface FleetMapLayerProps {
  theater: TheaterId;
  /** Supply player-visible fleets only. This layer never reads opponent state. */
  fleets: readonly NavalTaskForce[];
  selectedFleetId?: string;
  /** Select/open a fleet; never issues an order or advances the game. */
  onSelect: (id: string) => void;
  /** Inverse camera zoom keeps the ship symbols readable at any map scale. */
  symbolScale?: number;
  viewport?: { x: number; y: number; width: number; height: number };
  /** Visible city buttons/labels in map coordinates, sized in screen pixels. */
  obstacles?: readonly FleetMapObstacle[];
}

const modeLabels: Record<FleetNavigationMode, string> = {
  'in-port': '모항 대기', outbound: '합류점 이동', 'on-station': '현장 엄호',
  returning: '귀항 중', refueling: '급유·점검', stranded: '항해 중단',
};

function validPoint(point: NavalWaypoint | undefined): point is NavalWaypoint {
  return !!point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
    && point.latitude >= -90 && point.latitude <= 90 && Math.abs(point.longitude) <= 180;
}

function coordinates(point: NavalWaypoint) {
  const longitude = ((point.longitude + 180) % 360 + 360) % 360 - 180;
  return `${Math.abs(point.latitude).toFixed(2)}°${point.latitude < 0 ? 'S' : 'N'} ${Math.abs(longitude).toFixed(2)}°${longitude < 0 ? 'W' : 'E'}`;
}

function fixedNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)).toLocaleString('ko-KR') : '미확인';
}

function buildPath(theater: TheaterId, points: readonly NavalWaypoint[]) {
  let path = '';
  let previous: GeographicMapPoint | undefined;
  for (const point of points) {
    const projected = projectGeographicPoint(theater, point);
    // Do not draw a trans-world line across a projection's outer seam.
    const move = !previous || Math.abs(projected.x - previous.x) > 1200;
    path += `${move ? 'M' : 'L'}${projected.x.toFixed(3)},${projected.y.toFixed(3)}`;
    previous = projected;
  }
  return path;
}

function voyagePaths(theater: TheaterId, fleet: NavalTaskForce) {
  const nav = fleet.navigation;
  if (!nav || !validPoint(nav.position) || !['outbound', 'returning', 'stranded', 'on-station'].includes(nav.mode)
    || nav.route.length < 2 || !nav.route.every(validPoint)
    || !Number.isFinite(nav.traveledNm) || !Number.isFinite(nav.distanceNm)
    || nav.distanceNm <= 0 || nav.traveledNm >= nav.distanceNm) return null;
  let distance = Math.max(0, nav.traveledNm);
  let nextIndex = 1;
  for (; nextIndex < nav.route.length - 1; nextIndex += 1) {
    const leg = nauticalDistance(nav.route[nextIndex - 1], nav.route[nextIndex]);
    if (distance < leg) break;
    distance -= leg;
  }
  // position is the engine's authoritative location, never an independently
  // interpolated marker. traveledNm only selects which legs precede it.
  // Convoy followers can retain on-station mode while their recorded escort
  // leg still has distance left, so only a completed leg is hidden above.
  return {
    completed: nav.traveledNm > 0 ? buildPath(theater, [...nav.route.slice(0, nextIndex), nav.position]) : '',
    remaining: buildPath(theater, [nav.position, ...nav.route.slice(nextIndex)]),
    destination: nav.route.at(-1)!,
  };
}

/** Actual naval coordinates, rendered independently from land territory dots. */
export function FleetMapLayer({ theater, fleets, selectedFleetId, onSelect, symbolScale = 1, viewport, obstacles }: FleetMapLayerProps) {
  const scale = Number.isFinite(symbolScale) && symbolScale > 0 ? symbolScale : 1;
  const visible = fleets.flatMap((fleet) => {
    const position = fleet.navigation?.position;
    if (fleet.ships <= 0 || !validPoint(position) || !isGeographicPointInBounds(theater, position)) return [];
    const point = projectGeographicPoint(theater, position);
    const margin = 24 * scale;
    if (viewport && (point.x < viewport.x - margin || point.x > viewport.x + viewport.width + margin
      || point.y < viewport.y - margin || point.y > viewport.y + viewport.height + margin)) return [];
    return [{ fleet, point, position }];
  });
  const selected = visible.find(({ fleet }) => fleet.id === selectedFleetId);
  const route = selected ? voyagePaths(theater, selected.fleet) : null;
  const extent = getGeographicPlotBounds(theater);
  const chipPlacements = new Map(layoutFleetMapChips(
    visible.map(({ fleet, point }) => ({ id: fleet.id, ...point })), obstacles, scale, viewport ?? extent,
  ).map((placement) => [placement.id, placement]));
  const unplacedCount = visible.length - chipPlacements.size;
  const clipId = `fleet-geographic-route-${theater}`;
  const stop = (event: PointerEvent<SVGGElement> | MouseEvent<SVGGElement>) => event.stopPropagation();
  return <g className="fleet-map-layer" aria-label="아군 함대 실제 위치">
    {unplacedCount > 0 ? <desc>{unplacedCount}개 함대 표식은 도시 버튼 보호를 위해 숨겼습니다. 함대 위치 목록에서 선택할 수 있습니다.</desc> : null}
    {route && selected ? <g className="fleet-map-voyage" data-fleet-route-id={selected.fleet.id} pointerEvents="none" aria-hidden="true">
      <defs><clipPath id={clipId}><rect {...extent} /></clipPath></defs>
      <g clipPath={`url(#${clipId})`}>
        {route.completed ? <path className="fleet-map-route-completed" d={route.completed} /> : null}
        <path className="fleet-map-route-remaining" d={route.remaining} />
        {isGeographicPointInBounds(theater, route.destination) ? (() => {
          const point = projectGeographicPoint(theater, route.destination);
          return <g transform={`translate(${point.x} ${point.y}) scale(${scale})`}>
            <circle className="fleet-map-destination" r="6" />
            <path className="fleet-map-destination-cross" d="M-10,0H10M0,-10V10" />
          </g>;
        })() : null}
      </g>
    </g> : null}
    {visible.map(({ fleet, point, position }, index) => {
      const placement = chipPlacements.get(fleet.id);
      if (!placement) return null;
      const nav = fleet.navigation!;
      const isSelected = fleet.id === selectedFleetId;
      const remaining = Math.max(0, nav.distanceNm - nav.traveledNm);
      const { offsetX, offsetY } = placement;
      const displaced = Math.abs(offsetX) > .01 || Math.abs(offsetY) > .01;
      const title = `${fleet.name} · ${modeLabels[nav.mode]} · ${position.name} · ${coordinates(position)} · 도착까지 ${fixedNumber(remaining)}해리 · 잔여 항속 ${fixedNumber(nav.remainingRangeNm)}해리${displaced ? ' · 연결선의 점이 실제 위치' : ''}`;
      const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) onSelect(fleet.id);
      };
      return <g key={fleet.id} className="fleet-map-location" transform={`translate(${point.x} ${point.y}) scale(${scale})`} pointerEvents="none">
        {displaced ? <g aria-hidden="true" pointerEvents="none"><path className="fleet-map-leader" d={`M0,0L${offsetX},${offsetY}`} /><circle className="fleet-map-exact-position" r="3" /></g> : null}
        <g id={`map-fleet-${fleet.id}`} className={`fleet-map-marker${isSelected ? ' is-selected' : ''}${nav.mode === 'stranded' ? ' is-stranded' : ''}`}
        data-fleet-id={fleet.id} data-fleet-latitude={position.latitude} data-fleet-longitude={position.longitude}
        data-fleet-map-x={point.x} data-fleet-map-y={point.y} data-fleet-order={index}
        data-fleet-chip-x={point.x + offsetX * scale} data-fleet-chip-y={point.y + offsetY * scale}
        data-fleet-chip-offset-x={offsetX} data-fleet-chip-offset-y={offsetY}
        transform={`translate(${offsetX} ${offsetY})`}
        pointerEvents="none"
        role="button" tabIndex={0} aria-label={title} aria-pressed={isSelected}
        onPointerDown={stop} onMouseDown={stop} onDoubleClick={stop}
        onClick={(event) => { event.stopPropagation(); onSelect(fleet.id); }} onKeyDown={onKeyDown}
        onKeyUp={(event) => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); } }}>
        <title>{title}</title>
          <rect className="fleet-map-hitbox" x={-FLEET_MAP_CHIP_SIZE / 2} y={-FLEET_MAP_CHIP_SIZE / 2} width={FLEET_MAP_CHIP_SIZE} height={FLEET_MAP_CHIP_SIZE} rx="6" pointerEvents="all" />
          <rect className="fleet-map-symbol-back" x="-13" y="-12" width="26" height="25" rx="5" />
          <path className="fleet-map-hull" d={fleet.kind === 'submarine' ? 'M-9,3Q-6,-1 0,-1H6Q10,1 10,3Q8,6 3,6H-5Z M0,-1V-6H4' : 'M-9,3H9L5,9H-5Z M-5,3V-3H5V3 M0,-3V-8 M-1,-7H6'} />
          {nav.mode === 'outbound' || nav.mode === 'returning' ? <path className="fleet-map-moving" d="M-9,12H-4M0,12H4" /> : null}
          {nav.mode === 'stranded' ? <text className="fleet-map-alert" x="11" y="-9">!</text> : null}
        </g>
      </g>;
    })}
  </g>;
}
