import { Anchor, ArrowUpRight, Navigation, X } from 'lucide-react';
import type { NavalTaskForce } from './jointOperations';
import type { FleetNavigationMode, NavalWaypoint } from './navalNavigation';
import type { TheaterId } from './types';
import { isGeographicPointInBounds } from './geographicProjection';
import './MapFleetInspector.css';

export interface MapFleetInspectorProps {
  fleet: NavalTaskForce;
  theater?: TheaterId;
  onClose: () => void;
  onOpenNaval: () => void;
}

const statusLabels: Record<FleetNavigationMode, string> = {
  'in-port': '모항 대기', outbound: '합류점 이동 중', 'on-station': '현장 엄호',
  returning: '귀항 중', refueling: '급유·점검', stranded: '항해 중단',
};

function nonnegative(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validCoordinate(point: NavalWaypoint | undefined): point is NavalWaypoint {
  return !!point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
    && point.latitude >= -90 && point.latitude <= 90 && point.longitude >= -180 && point.longitude <= 180;
}

function coordinateLabel(point: NavalWaypoint | undefined) {
  if (!validCoordinate(point)) return '좌표 기록 점검 필요';
  return `${Math.abs(point.latitude).toFixed(2)}°${point.latitude < 0 ? 'S' : 'N'} · ${Math.abs(point.longitude).toFixed(2)}°${point.longitude < 0 ? 'W' : 'E'}`;
}

function nm(value: number) {
  return `${Math.round(value).toLocaleString('ko-KR')}해리`;
}

/** Read-only inspector: never repairs navigation or derives a guessed position. */
export function MapFleetInspector({ fleet, theater, onClose, onOpenNaval }: MapFleetInspectorProps) {
  const nav = fleet.navigation;
  const outsideTheater = !!theater && validCoordinate(nav?.position) && !isGeographicPointInBounds(theater, nav.position);
  // Keep the actual recorded itinerary, including old saves. Never rebuild a newer shortest route for display.
  const route = nav?.route ?? [];
  const routeValid = route.length >= 2 && route.every(validCoordinate);
  const checkpoints = routeValid ? route.filter((point, index) => index === 0 || index === route.length - 1 || !point.id.startsWith('corridor-')) : [];
  const routeLeavesTheater = !!theater && routeValid && route.some((point) => !isGeographicPointInBounds(theater, point));
  const distancesValid = !!nav && nonnegative(nav.distanceNm) && nonnegative(nav.traveledNm)
    && nav.traveledNm <= nav.distanceNm;
  const remaining = distancesValid ? nav!.distanceNm - nav!.traveledNm : null;
  const rangeValid = !!nav && nonnegative(nav.rangeNm) && nonnegative(nav.remainingRangeNm)
    && nav.remainingRangeNm <= nav.rangeNm;
  const pursuing = !!nav && nav.mode === 'on-station' && remaining !== null && remaining > 0;
  const status = nav ? pursuing ? '선단 추적·합류 중' : statusLabels[nav.mode] ?? '상태 기록 점검 필요' : '항해 기록 없음';
  let eta = '도착 예정 없음';
  if (nav) {
    const moving = nav.mode === 'outbound' || nav.mode === 'returning' || pursuing;
    if (nav.mode === 'stranded') eta = '항해 중단 · 지원 필요';
    else if (nav.mode === 'refueling') eta = '다음 주 급유·점검 처리';
    else if (moving) {
      if (remaining === null || !validCoordinate(nav.position) || !validCoordinate(nav.destination)
        || !nonnegative(nav.cruiseKnots) || nav.cruiseKnots === 0 || !rangeValid) eta = '항해 기록 점검 필요';
      else if (remaining > nav.remainingRangeNm) eta = '항속 부족 · 도착 추정 불가';
      else if (remaining === 0) eta = '도착 처리 확인';
      else eta = `현재 ${pursuing ? '합류점' : '목적지'}까지 약 ${Math.max(1, Math.ceil(remaining / (nav.cruiseKnots * 24 * 7 * 0.7)))}주`;
    } else if (!Object.hasOwn(statusLabels, nav.mode)) eta = '상태 기록 점검 필요';
  }
  const progress = distancesValid && nav!.distanceNm > 0 ? Math.round(nav!.traveledNm / nav!.distanceNm * 100) : null;
  return <section className="map-fleet-inspector" aria-label={`${fleet.name} 항해 상세`}
    onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}
    onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}
    onWheel={(event) => event.stopPropagation()}
    onKeyDown={(event) => { event.stopPropagation(); if (event.key === 'Escape') { event.preventDefault(); onClose(); } }}
    onKeyUp={(event) => event.stopPropagation()}>
    <header className="map-fleet-inspector-header">
      <div><span><Navigation size={14} aria-hidden="true" />함대 위치 확인</span><h3>{fleet.name}</h3></div>
      <button id="map-fleet-inspector-close" type="button" className="map-fleet-inspector-close" aria-label="함대 상세 닫기" onClick={onClose}><X size={18} aria-hidden="true" /></button>
    </header>
    <div className={`map-fleet-inspector-status${nav?.mode === 'stranded' ? ' is-warning' : ''}`}>{status}</div>
    <div className="map-fleet-inspector-body">
    {!nav ? <p className="map-fleet-inspector-empty">이 함대에는 항해 기록이 없습니다. 모항이나 현재 위치를 추정해서 표시하지 않습니다.</p> : <>
      <div className="map-fleet-inspector-position"><span>현재 위치 · 기록된 좌표</span><strong>{nav.position?.name || '위치명 미기록'}</strong><small>{coordinateLabel(nav.position)}</small></div>
      {outsideTheater ? <p className="map-fleet-inspector-outside">현재 전구 밖에 있습니다. 지도 가장자리에 위치를 옮겨 그리지 않으며, 여기서 실제 좌표와 항로를 확인할 수 있습니다.</p> : null}
      <dl className="map-fleet-inspector-facts">
        <div><dt><Anchor size={13} aria-hidden="true" />모항</dt><dd>{nav.homePort?.name || '미기록'}</dd></div>
        <div><dt>현재 목적지</dt><dd>{nav.destination?.name || '새 목적지 없음'}</dd></div>
        <div><dt>항로 이동 거리</dt><dd>{distancesValid ? `${nm(nav.traveledNm)} / ${nm(nav.distanceNm)}` : '거리 기록 점검 필요'}</dd></div>
        <div><dt>남은 이동 거리</dt><dd>{remaining !== null ? nm(remaining) : '미확인'}</dd></div>
        <div><dt>도착·합류 예상</dt><dd>{eta}</dd></div>
        <div><dt>잔여 항속</dt><dd>{rangeValid ? `${nm(nav.remainingRangeNm)} / ${nm(nav.rangeNm)}` : '항속 기록 점검 필요'}</dd></div>
      </dl>
      {progress !== null ? <div className="map-fleet-inspector-progress"><span>현재 항로 진행 <strong>{progress}%</strong></span><div role="progressbar" aria-label="현재 항로 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><i style={{ width: `${progress}%` }} /></div></div> : null}
      {remaining !== null && remaining > 0 ? <p className="map-fleet-inspector-note">지도 범위 안의 밝은 청록선은 남은 항로, 옅은 점선은 이동한 항로입니다. 선을 따라 항해하며 항속을 소모합니다.{routeLeavesTheater ? ' 전구 밖 구간은 지도에 표시되지 않지만 아래 기록 항로에 포함됩니다.' : ''}</p> : null}
      {checkpoints.length > 0 ? <details className="map-fleet-inspector-itinerary">
        <summary>기록 항로 · 주요 경유지 {checkpoints.length}곳</summary>
        <p>기록된 순서입니다. 세부 해안 우회점을 포함한 실제 항로는 {route.length}개 좌표로 구성됩니다. 통과 여부는 위 진행 거리로 확인하세요.</p>
        <ol>{checkpoints.map((point, index) => <li key={`${point.id}-${index}`}><strong>{point.name || '이름 미기록'}</strong><span>{coordinateLabel(point)}{theater && !isGeographicPointInBounds(theater, point) ? ' · 전구 밖' : ''}</span></li>)}</ol>
      </details> : route.length >= 2 ? <p className="map-fleet-inspector-note">경유지 좌표 기록을 점검해야 합니다. 확인되지 않은 항로는 표시하지 않습니다.</p> : null}
      {pursuing ? <p className="map-fleet-inspector-note">엄호 상태여도 선단과의 합류가 끝난 것은 아닙니다. 현재 합류점까지의 추정이며, 선단이 이동하면 목적지와 도착 시점이 달라집니다.</p> : null}
      {nav.mode === 'outbound' || nav.mode === 'returning' ? <p className="map-fleet-inspector-note">예상 시점은 현재 항로·순항속 기준입니다. 새 명령, 항속 부족이나 목적지 변경에 따라 달라질 수 있습니다.</p> : null}
      {nav.lastMessage ? <p className="map-fleet-inspector-last-message">{nav.lastMessage}</p> : null}
    </>}
    </div>
    <footer><p>조회 전용 · 함대 선택으로 초안이나 명령은 바뀌지 않습니다.</p><button type="button" onClick={onOpenNaval}>해군 운영에서 확인<ArrowUpRight size={16} aria-hidden="true" /></button></footer>
  </section>;
}
