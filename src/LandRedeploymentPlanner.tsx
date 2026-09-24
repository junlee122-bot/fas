import { useState } from 'react';
import { ArrowRight, Truck } from 'lucide-react';
import { forecastLandRedeployment, type LandRedeploymentPlan } from './landRedeployment';
import { validateLandRoute } from './mapRoutes';
import { getSiteMilitaryAccess } from './militaryAccess';
import type { SeaTransportContext, SeaTransportState } from './seaTransport';

interface Props { originId: string; context: SeaTransportContext; state: SeaTransportState; onApprove: (plan: LandRedeploymentPlan) => void }
export function LandRedeploymentPlanner({ originId, context, state, onApprove }: Props) {
  const units = context.divisions.filter((division) => division.territoryId === originId && context.commandableDivisionIds.has(division.id));
  const origin = context.territories.find((territory) => territory.id === originId);
  const access = context.militaryAccess ? { ...context.militaryAccess, week: context.week } : undefined;
  const canDepart = origin && (access ? getSiteMilitaryAccess(origin, 'land-departure', access).allowed : origin.controller === context.playerFaction);
  const targets = origin ? context.territories.filter((target) => (access ? getSiteMilitaryAccess(target, 'transit', access).allowed : target.controller === context.playerFaction) && validateLandRoute(origin, target).allowed) : [];
  const [unitId, setUnitId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [review, setReview] = useState<string | null>(null);
  const unit = units.find((division) => division.id === unitId) ?? units[0];
  const target = targets.find((territory) => territory.id === targetId) ?? targets[0];
  const plan = { divisionId: unit?.id ?? '', fromId: originId, targetId: target?.id ?? '' };
  const forecast = forecastLandRedeployment(state, plan, context);
  const signature = `${plan.divisionId}:${originId}:${plan.targetId}:${context.week}:${forecast.accepted}:${forecast.reason}`;
  if (!unit || !target || !origin || !canDepart) return null;
  return <section className="map-land-redeployment" aria-label="아군 육상 재배치">
    <header><h3><Truck size={16} /> 출항지로 이동 · 아군 육상 재배치</h3><p>접근이 허가된 인접 육지로 다음 주 이동합니다. 통행권은 소유권·보급권·공격권을 주지 않습니다.</p></header>
    <div className="map-redeployment-inputs"><label>이동 부대<select value={unit.id} onChange={(event) => { setUnitId(event.target.value); setReview(null); }}>{units.map((division) => <option value={division.id} key={division.id}>{division.name}</option>)}</select></label><ArrowRight size={16} /><label>인접 이동 목적지<select value={target.id} onChange={(event) => { setTargetId(event.target.value); setReview(null); }}>{targets.map((territory) => <option value={territory.id} key={territory.id}>{territory.name}</option>)}</select></label></div>
    <p>{forecast.reason}</p>
    {review === signature ? <div className="map-redeployment-approval"><strong>{unit.name}: {origin.name} → {target.name}</strong><p>지휘력 {forecast.commandCost}·연료 {forecast.fuelCost}를 사용합니다. 집행 시 접근권을 재확인하며 허가가 끝나면 공격으로 전환하지 않고 중단합니다.</p><button type="button" disabled={!forecast.accepted} onClick={() => { if (forecast.accepted) { onApprove(plan); setReview(null); } }}>비용을 지불하고 재배치 승인</button><button type="button" onClick={() => setReview(null)}>검토 닫기</button></div>
      : <button type="button" disabled={!forecast.accepted} onClick={() => setReview(signature)}>육상 재배치 검토 · 지휘 {forecast.commandCost} / 연료 {forecast.fuelCost}</button>}
  </section>;
}
