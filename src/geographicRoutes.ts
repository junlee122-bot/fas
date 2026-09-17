import { projectGeographicPoint } from './geographicProjection';
import type { MapRouteKind } from './mapRoutes';
import { buildNavalRoute, resolveNavalTerritoryPoint, type NavalWaypoint } from './navalNavigation';
import { getTerritoryGeography } from './territoryGeography';
import { getLandCorridorWaypoints } from './landCorridors';
import { getStraitCrossing } from './straitCrossings';
import type { Territory, TheaterId } from './types';

interface Coordinate { latitude: number; longitude: number }

export interface GeographicConnectionPath {
  /** Land relationship, or maritime corridor between the naval coastal anchors. */
  path: string;
  /** These are strategic relationships, never surveyed roads or navigation charts. */
  approximate: boolean;
  description: string;
  /** Render separately as dotted access, never with the maritime route's stroke. */
  accessPath?: string;
}

const coordinate = (latitude: number, longitude: number): Coordinate => ({ latitude, longitude });
const validCoordinate = (point: Coordinate) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
  && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
const sameCoordinate = (a: Coordinate, b: Coordinate) => Math.abs(a.latitude - b.latitude) < 1e-7
  && Math.abs(a.longitude - b.longitude) < 1e-7;
const format = (value: number) => Number(value.toFixed(3)).toString();

/**
 * Straight polyline segments deliberately avoid smoothing away narrow passages.
 * A projection-wrap discontinuity starts a new subpath; it must never create a
 * world-spanning chord. SVG's map clip remains responsible for off-map portions.
 */
function projectPolyline(theater: TheaterId, points: readonly Coordinate[]): string {
  if (points.length < 2 || points.some((point) => !validCoordinate(point))) return '';
  const scale = Math.abs(projectGeographicPoint(theater, coordinate(0, 1)).x
    - projectGeographicPoint(theater, coordinate(0, 0)).x);
  const halfWorldWidth = scale * 180;
  let previous: { x: number; y: number } | undefined;
  let hasSegment = false;
  const commands: string[] = [];
  points.forEach((point) => {
    const projected = projectGeographicPoint(theater, point);
    if (!Number.isFinite(projected.x) || !Number.isFinite(projected.y)) return;
    if (previous && Math.abs(projected.x - previous.x) < 1e-7 && Math.abs(projected.y - previous.y) < 1e-7) return;
    const connected = previous && Math.abs(projected.x - previous.x) <= halfWorldWidth;
    commands.push(`${connected ? 'L' : 'M'}${format(projected.x)},${format(projected.y)}`);
    hasSegment ||= Boolean(connected);
    previous = projected;
  });
  return hasSegment ? commands.join(' ') : '';
}

// Display access for inland macro-regions; these do not create an engine
// harbor or change ownership. Official port sources describe the modern
// geographical approach, not a claimed reconstruction of 1942 infrastructure:
// https://rapport-annuel.haropaport.com/fr/pilotage
// https://www.puertosdeandalucia.es/puertos/puertos/cadiz/puerto-de-algeciras
const regionalCoastalAccess: Readonly<Record<string, NavalWaypoint>> = {
  france: { id: 'france', territoryId: 'france', name: '르아브르 외해 접근 · 파리 방면', latitude: 49.4767, longitude: -.045, basin: 'channel' },
  spain: { id: 'spain', territoryId: 'spain', name: '알헤시라스 접근 · 이베리아 방면', latitude: 36.1301, longitude: -5.4383, basin: 'gibraltar' },
  // Retain Hamburg's port ID so its authored estuary approach remains reusable.
  germany: { ...resolveNavalTerritoryPoint('hamburg')!, territoryId: 'germany', name: '함부르크 하구 접근 · 독일 방면' },
  // The existing Singapore hub reaches the Gulf from the peninsula's east;
  // a direct approach to the South China Sea hub would cross Indochina.
  bangkok: { id: 'bangkok', territoryId: 'bangkok', name: '차오프라야 하구 외해 접근 · 방콕 방면', latitude: 13.4, longitude: 100.6, basin: 'singaporesea' },
};

/**
 * Geographic rendering adapter only. It neither infers missing coordinates nor
 * changes the strategic adjacency / route-domain classification supplied by the
 * caller. A null result is an unsupported connection, not a zero-length route.
 */
export function getGeographicConnectionPath(
  theater: TheaterId,
  from: Territory,
  to: Territory,
  kind: MapRouteKind,
): GeographicConnectionPath | null {
  if ((theater !== 'europe' && theater !== 'asia') || from.id === to.id
    || !['land', 'sea', 'sea-crossing'].includes(kind)) return null;
  const sourceGeography = getTerritoryGeography(from.id);
  const targetGeography = getTerritoryGeography(to.id);
  if (!sourceGeography || !targetGeography
    || !validCoordinate(sourceGeography) || !validCoordinate(targetGeography)) return null;

  if (kind === 'land') {
    const hints = getLandCorridorWaypoints(from.id, to.id);
    const path = projectPolyline(theater, [sourceGeography, ...hints, targetGeography]);
    return path ? { path, approximate: true,
      description: `${sourceGeography.anchorName} ↔ ${targetGeography.anchorName}: 전략적 육상 연결이며 실제 도로 경로가 아닙니다.`
        + (hints.length ? ' 대륙 경유점을 따라 표시한 근사 회랑이며 육상 이동 시간 계산과의 일치를 보장하지 않습니다.' : '') } : null;
  }

  const strait = getStraitCrossing(from.id, to.id);
  if (strait) {
    const path = projectPolyline(theater, strait.water);
    const accessPath = [projectPolyline(theater, [sourceGeography, ...strait.fromAccess]),
      projectPolyline(theater, [...strait.toAccess, targetGeography])].filter(Boolean).join(' ');
    return path ? { path, accessPath, approximate: true,
      description: '보스포루스 해협: 짧은 해상 횡단과 양안의 내륙 접근을 구분한 근사 전략 연결입니다. 점선은 실제 도로·수송 경로가 아니며 내륙 도시에 엔진 항구를 생성하지 않습니다. 1942년에는 고정 도로 교량이 없었으며, 연도만 지나도 자동으로 통행 가능한 교량이 생기지는 않습니다.' } : null;
  }

  const sourcePort = resolveNavalTerritoryPoint(from.id) ?? regionalCoastalAccess[from.id];
  const targetPort = resolveNavalTerritoryPoint(to.id) ?? regionalCoastalAccess[to.id];
  if (!sourcePort || !targetPort || !validCoordinate(sourcePort) || !validCoordinate(targetPort)) return null;
  const path = projectPolyline(theater, buildNavalRoute(sourcePort, targetPort));
  if (!path) return null;
  const accessPaths: string[] = [];
  if (!sameCoordinate(sourceGeography, sourcePort)) accessPaths.push(projectPolyline(theater, [sourceGeography, sourcePort]));
  if (!sameCoordinate(targetPort, targetGeography)) accessPaths.push(projectPolyline(theater, [targetPort, targetGeography]));
  const accessPath = accessPaths.filter(Boolean).join(' ');
  return {
    path,
    approximate: true,
    description: `${sourcePort.name} ↔ ${targetPort.name}: 함대 이동·거리 계산과 같은 경유점을 사용하는 근사 해상 전략 회랑입니다. 정밀 항해도나 완전한 육지 충돌 회피를 보장하지 않습니다.`
      + (regionalCoastalAccess[from.id] || regionalCoastalAccess[to.id] ? ' 내륙권역의 표시용 해안 접근이며 실제 엔진 항구를 새로 만든 것은 아닙니다.' : '')
      + (accessPath ? ' 별도 점선은 지도 거점과 해안·해역 앵커의 연결 설명이며 실제 해상 이동 구간이 아닙니다.' : ''),
    ...(accessPath ? { accessPath } : {}),
  };
}
