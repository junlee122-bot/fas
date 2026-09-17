import { useId, useRef, useState, type Ref } from 'react';
import { Anchor, LocateFixed, Navigation, X } from 'lucide-react';
import type { NavalTaskForce } from './jointOperations';
import type { FleetNavigationMode, NavalWaypoint } from './navalNavigation';
import { isGeographicPointInBounds } from './geographicProjection';
import type { TheaterId } from './types';
import './FleetLocationList.css';

export interface FleetLocationListProps {
  /** Player-visible fleets only; this component never reads opponent state. */
  fleets: readonly NavalTaskForce[];
  theater: TheaterId;
  selectedFleetId?: string;
  /** Inspect a fleet, including those outside the current theater. No orders. */
  onSelect: (fleetId: string) => void;
}

interface FleetLocationListViewProps extends FleetLocationListProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  panelId?: string;
  triggerRef?: Ref<HTMLButtonElement>;
}

const modeLabels: Record<FleetNavigationMode, string> = {
  'in-port': '모항 대기', outbound: '합류점 이동 중', 'on-station': '현장 엄호',
  returning: '귀항 중', refueling: '급유·점검', stranded: '항해 중단',
};

function validPoint(point: NavalWaypoint | undefined): point is NavalWaypoint {
  return !!point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
    && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
}

function fleetEntries(fleets: readonly NavalTaskForce[], theater: TheaterId) {
  return fleets.flatMap((fleet, index) => {
    const nav = fleet.navigation;
    if (!Number.isFinite(fleet.ships) || fleet.ships <= 0 || !nav || !validPoint(nav.position)) return [];
    const tracking = nav.mode === 'on-station' && Number.isFinite(nav.distanceNm) && Number.isFinite(nav.traveledNm)
      && nav.traveledNm >= 0 && nav.distanceNm > nav.traveledNm;
    const moving = nav.mode === 'outbound' || nav.mode === 'returning' || tracking;
    const priority = moving ? 0 : nav.mode === 'stranded' ? 1 : nav.mode === 'on-station' ? 2 : nav.mode === 'refueling' ? 3 : 4;
    return [{
      fleet,
      position: nav.position,
      mode: nav.mode,
      status: tracking ? '선단 추적·합류 중' : modeLabels[nav.mode] ?? '상태 미확인',
      inside: isGeographicPointInBounds(theater, nav.position),
      moving,
      priority,
      index,
    }];
  }).sort((a, b) => a.priority - b.priority || a.index - b.index);
}

function coordinateLabel(point: NavalWaypoint) {
  return `${Math.abs(point.latitude).toFixed(2)}°${point.latitude < 0 ? 'S' : 'N'} · ${Math.abs(point.longitude).toFixed(2)}°${point.longitude < 0 ? 'W' : 'E'}`;
}

/** The disclosure is local UI state; opening it cannot advance or alter a turn. */
export function FleetLocationList(props: FleetLocationListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const onOpenChange = (next: boolean) => {
    setIsOpen(next);
    if (!next) triggerRef.current?.focus({ preventScroll: true });
  };
  return <FleetLocationListView {...props} isOpen={isOpen} onOpenChange={onOpenChange} panelId={`fleet-location-list-${id}`} triggerRef={triggerRef} />;
}

/** Pure view makes map-event isolation and read-only selection testable. */
export function FleetLocationListView({ fleets, theater, selectedFleetId, onSelect, isOpen, onOpenChange, panelId = 'fleet-location-list-panel', triggerRef }: FleetLocationListViewProps) {
  const entries = fleetEntries(fleets, theater);
  const outside = entries.filter((entry) => !entry.inside).length;
  const headingId = `${panelId}-heading`;
  return <div className={`fleet-location-list${isOpen ? ' is-open' : ''}`}
    onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}
    onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}
    onWheel={(event) => event.stopPropagation()} onKeyUp={(event) => event.stopPropagation()}
    onKeyDown={(event) => {
      event.stopPropagation();
      if (event.key === 'Escape' && isOpen) { event.preventDefault(); onOpenChange(false); }
    }}>
    <button ref={triggerRef} id="map-fleet-location-toggle" type="button" className="fleet-location-trigger" aria-expanded={isOpen} aria-controls={panelId}
      onClick={() => onOpenChange(!isOpen)}>
      <LocateFixed size={17} aria-hidden="true" /><span>함대 위치</span><strong>{entries.length}</strong>
    </button>
    {isOpen ? <section className="fleet-location-popover" id={panelId} role="region" aria-labelledby={headingId}>
      <header className="fleet-location-header">
        <div><h3 id={headingId}>아군 함대 위치</h3><p>좌표 확인 {entries.length}개 · 현재 전구 밖 {outside}개</p></div>
        <button type="button" className="fleet-location-close" aria-label="함대 위치 목록 닫기" onClick={() => onOpenChange(false)}><X size={18} aria-hidden="true" /></button>
      </header>
      <div className="fleet-location-scroll">
        {entries.length ? <ul className="fleet-location-entries" aria-label="좌표가 확인된 아군 함대">
          {entries.map(({ fleet, position, status, mode, inside, moving }) => <li key={fleet.id}>
            <button type="button" className={`fleet-location-entry${selectedFleetId === fleet.id ? ' is-selected' : ''}${mode === 'stranded' ? ' is-stranded' : ''}`}
              data-fleet-location-id={fleet.id} data-theater-presence={inside ? 'inside' : 'outside'}
              aria-pressed={selectedFleetId === fleet.id}
              onClick={() => { onSelect(fleet.id); onOpenChange(false); }}>
              <span className="fleet-location-entry-top"><strong>{fleet.name}</strong>{moving ? <Navigation size={16} aria-label="이동 중" /> : <Anchor size={16} aria-hidden="true" />}</span>
              <span className="fleet-location-entry-state"><span>{status}</span><span className={inside ? 'fleet-location-inside' : 'fleet-location-outside'}>{inside ? '현재 전구 안' : '현재 전구 밖'}</span></span>
              <span className="fleet-location-place">{position.name || '위치명 미기록'}</span>
              <span className="fleet-location-coordinates">{coordinateLabel(position)}</span>
            </button>
          </li>)}
        </ul> : <p className="fleet-location-empty">좌표가 확인된 생존 함대가 없습니다. 모항이나 위치를 추정해서 표시하지 않습니다.</p>}
      </div>
      <footer>이동 중인 함대부터 표시합니다. 전구 밖 함대도 조회할 수 있으며, 선택은 이동 명령이 아닙니다.</footer>
    </section> : null}
  </div>;
}
