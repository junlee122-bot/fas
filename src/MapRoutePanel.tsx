import { Anchor, ArrowRight, Route, Swords } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { classifyMapRoute } from './mapRoutes';
import { validateOffensiveTarget } from './mapCommand';
import { getStraitCrossing } from './straitCrossings';
import type { MilitaryAccessOperationalContext } from './militaryAccess';
import type { Division, Faction, Territory } from './types';

export function getMapRouteChoices(origin: Territory, territories: Territory[], playerFaction: Faction, militaryAccess?: MilitaryAccessOperationalContext) {
  const byId = new Map(territories.map((territory) => [territory.id, territory]));
  return [...new Set(origin.neighbors)].flatMap((id) => {
    const target = byId.get(id);
    if (!target || target.id === origin.id) return [];
    const route = classifyMapRoute(origin, target);
    const validation = validateOffensiveTarget({ origin, target, playerFaction, militaryAccess });
    return [{ target, route, validation }];
  });
}

interface Props {
  militaryAccess?: MilitaryAccessOperationalContext;
  redeployment?: ReactNode;
  origin: Territory;
  territories: Territory[];
  playerFaction: Faction;
  planning: boolean;
  divisionName?: string;
  alternatives: Array<{ division: Division; origin: Territory; targetCount: number }>;
  onSelect: (id: string) => void;
  onInspect: (id: string) => void;
  onOpenJoint: (id: string) => void;
  onOpenTransport?: (id?: string) => void;
  onChangeDivision: (id: string) => void;
}

/** A route inspection never spends resources. Approval remains a separate step. */
export function MapRoutePanel({ origin, territories, playerFaction, planning, divisionName, alternatives, onSelect, onInspect, onOpenJoint, onOpenTransport, onChangeDivision, redeployment, militaryAccess }: Props) {
  const [expanded, setExpanded] = useState(planning);
  const choices = getMapRouteChoices(origin, territories, playerFaction, militaryAccess);
  const land = choices.filter((choice) => choice.route.kind === 'land');
  const sea = choices.filter((choice) => choice.route.kind !== 'land');
  const available = land.filter((choice) => choice.validation.allowed);
  return <details className={`map-route-panel${planning ? ' planning' : ''}`} open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)} onKeyDown={(event) => {
    if (event.key === 'Escape' && expanded) {
      event.preventDefault(); event.stopPropagation(); setExpanded(false);
      event.currentTarget.querySelector('summary')?.focus();
    }
  }}>
    <summary><Route size={17} /><strong>{planning ? `${divisionName ?? '선택 부대'} · 출발선` : '연결 경로'}: {origin.name}</strong><span>육상 {land.length} · 해상 {sea.length}{planning ? ` · 공세 목표 ${available.length}` : ''}</span></summary>
    <div className="map-route-popover">
      <header><h2>{planning ? '어디로 진격할 수 있나요?' : '이 거점에서 이어지는 경로'}</h2><p>{planning ? '목표를 선택하면 승인 전 검토가 열립니다. 탐색·전구 이동만으로 비용이 들거나 명령이 취소되지 않습니다.' : '연결선은 접근 경로입니다. 해상 연결을 육상 전선이나 진행 중인 전투로 세지 않습니다.'}</p></header>
      {redeployment}
      <div className="map-route-columns">
        <section><h3><Swords size={16} /> 육상 연결</h3>
          {land.length === 0 ? <p className="map-route-empty">연결된 육상 거점이 없습니다.</p> : <ul>{land.map(({ target, validation }) => <li key={target.id}>
            <div><strong>{target.name}</strong><small>{validation.allowed ? '육상 경로 연결 · 적 통제' : target.controller === playerFaction ? '아군 거점 · 전황 확인' : validation.reason}</small></div>
            <button type="button" onClick={() => planning && validation.allowed ? onSelect(target.id) : onInspect(target.id)}>{planning && validation.allowed ? '목표 검토' : '위치 보기'}<ArrowRight size={14} /></button>
          </li>)}</ul>}
          {planning && available.length === 0 ? <div className="map-route-empty"><strong>현재 출발선에는 육상 공세 목표가 없습니다.</strong><p>무작정 지도를 클릭할 필요가 없습니다. 다른 전선의 부대를 선택하거나 해공군 작전을 살펴보세요.</p></div> : null}
          {planning && available.length === 0 && alternatives.length > 0 ? <div className="map-route-alternatives"><h4>공세 가능한 다른 예하 부대</h4>{alternatives.map(({ division, origin: base, targetCount }) => <button type="button" key={division.id} onClick={() => onChangeDivision(division.id)}><strong>{division.name}</strong><small>{base.name} · 목표 {targetCount}개</small></button>)}</div> : null}
        </section>
        <section><h3><Anchor size={16} /> 해상 연결</h3>
          {sea.length === 0 ? <p className="map-route-empty">연결된 해상 경로가 없습니다.</p> : <ul>{sea.map(({ target, route }) => {
            const inlandStrait = Boolean(getStraitCrossing(origin.id, target.id));
            return <li key={target.id}>
              <div><strong>{target.name}</strong><small>{route.label} · 육군 직접 진입 불가</small>{inlandStrait ? <small>내륙 도시 간 직접 승선은 불가합니다. 수송실에서 사용 가능한 연안 항구를 선택하세요.</small> : null}</div>
              <div className="map-route-sea-actions">{onOpenTransport ? <button type="button" onClick={() => onOpenTransport(inlandStrait ? undefined : target.id)}>{inlandStrait ? '수송실 열기' : '병력 수송'}<ArrowRight size={14} /></button> : null}<button type="button" onClick={() => onOpenJoint(target.id)}>해공군 엄호<ArrowRight size={14} /></button></div>
            </li>;
          })}</ul>}
          <p className="map-route-caveat">병력 이동은 수송실에서 별도 승인합니다. 해공군 엄호로 전구 우세를 확보하고, 승선·항해·상륙·보급을 거쳐야 실제 위치와 통제권이 바뀝니다.</p>
        </section>
      </div>
    </div>
  </details>;
}
