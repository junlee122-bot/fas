import { useId, useMemo, useRef, useState } from 'react';
import { Anchor, ArrowRight, CheckCheck, Clock3, FileCheck2, FileText, Flag, Info, LifeBuoy, LockKeyhole, MapPin, PackageCheck, Plane, Ship, ShieldAlert, ShieldCheck, Undo2, Users } from 'lucide-react';
import {
  findSeaTransportRoute, forecastSeaTransport, forecastSeaTransportEscortRelief, forecastSeaTransportRescue, getSeaTransportBusyDivisionIds, getSeaTransportEscortOptions, seaTransportStageLabels,
  getSeaTransportAirSupportOptions, getSeaTransportAssignedFleetIds, getSeaTransportAssignedAirGroupIds,
  getSeaTransportActiveProtection,
  type SeaTransportContext, type SeaTransportForecast, type SeaTransportOperation, type SeaTransportOutcome,
  type SeaTransportEscortReliefRecord, type SeaTransportPhaseWeeks, type SeaTransportPlan, type SeaTransportRecord, type SeaTransportStage, type SeaTransportState,
} from './seaTransport';
import type { Division, Faction } from './types';
import { getSeaTransportDestinations } from './seaTransportPlanning';
import { FleetVoyageCard } from './FleetVoyageCard';
import './SeaTransportBoard.css';

export interface SeaTransportBoardProps {
  state: SeaTransportState;
  context: SeaTransportContext;
  initialPlan?: SeaTransportPlan;
  /** Optional controlled draft lets the app preserve planning across map/workspace unmounts. */
  selection?: SeaTransportSelection;
  onSelectionChange?: (patch: Partial<SeaTransportSelection>) => void;
  onLaunch: (plan: SeaTransportPlan) => void;
  onReturn: (operationId: string) => void;
  onRescue: (operationId: string, escortFleetId?: string) => void;
  onEscortRelief: (operationId: string, fleetId: string) => void;
  onOpenLocation: (id: string) => void;
}
export type SeaTransportWorkspace = 'plan' | 'active' | 'history';
export interface SeaTransportSelection {
  workspace: SeaTransportWorkspace;
  plan: SeaTransportPlan;
  reviewedSignature: string | null;
  operationId: string | null;
  recordId: string | null;
  returnReviewId: string | null;
  rescueReviewedSignature?: string | null;
  rescueEscortFleetId?: string;
  escortReliefFleetId?: string;
  escortReliefReviewedSignature?: string | null;
}
const outcomeLabels: Record<SeaTransportOutcome, string> = {
  transferred: '수송 완료', landed: '상륙·보급 완료', recalled: '철회 후 귀환', 'failed-landing': '상륙 중단·철수', diverted: '경로 변경·귀환',
};
const divisionLabels = { infantry: '보병', armor: '기갑', airborne: '공수', marine: '해병' } as const;
const number = (value: number) => Number.isFinite(value) ? Math.round(value).toLocaleString('ko-KR') : '확인 필요';
const controlLabel = (faction: Faction, playerFaction: Faction) => faction === 'neutral' ? '중립 통제' : faction === playerFaction ? '아군 통제' : '상대 진영 통제';

/** A unit can be inspected without pretending that readiness alone pays for a transport. */
export function getSeaTransportDivisionReason(state: SeaTransportState, division: Division, context: SeaTransportContext): string | null {
  if (!context.commandableDivisionIds.has(division.id)) return '직접 지휘 범위 밖';
  if (getSeaTransportBusyDivisionIds(state).has(division.id)) return '해상 수송 배속 중';
  if (context.orders.some((order) => order.divisionId === division.id)) return '다른 육상 명령 수행 중';
  if (division.status !== 'ready') return division.status === 'recovering' ? '회복 중' : division.status === 'combat' ? '전투 중' : '이동 중';
  return null;
}

/** Only called on mount. New weeks and workspace changes never erase the player's draft. */
export function createInitialSeaTransportSelection(props: Pick<SeaTransportBoardProps, 'state' | 'context' | 'initialPlan'>): SeaTransportSelection {
  const first = props.context.divisions.find((division) => !getSeaTransportDivisionReason(props.state, division, props.context));
  return {
    workspace: 'plan', plan: props.initialPlan ? { ...props.initialPlan } : { divisionId: first?.id ?? '', fromId: first?.territoryId ?? '', targetId: '' },
    reviewedSignature: null, operationId: null, recordId: null, returnReviewId: null, rescueReviewedSignature: null,
  };
}

export function getSeaTransportBoardPlan(state: SeaTransportState, context: SeaTransportContext, plan: SeaTransportPlan) {
  const division = context.divisions.find((unit) => unit.id === plan.divisionId);
  const origin = context.territories.find((territory) => territory.id === plan.fromId);
  const target = context.territories.find((territory) => territory.id === plan.targetId);
  const forecast = forecastSeaTransport(state, plan, context);
  const destinations = origin ? getSeaTransportDestinations(origin.id, context.territories) : [];
  // A changed week, authority, route, unit or resource pool requires a new review, not an automatic new order.
  const signature = JSON.stringify({ plan, week: context.week, nationId: context.nationId, faction: context.playerFaction, phase: context.phase,
    processing: Boolean(context.processingWeek), forecast, division, origin, target,
    command: context.game.commandPoints, fuel: context.game.fuel, convoys: context.stockpile.convoys,
    escortFleets: context.jointForces.fleets.filter((fleet) => getSeaTransportAssignedFleetIds(plan).includes(fleet.id)),
    airGroups: context.jointForces.airGroups.filter((group) => plan.airGroupIds?.includes(group.id)),
  });
  return { division, origin, target, forecast, destinations, signature, canReview: forecast.allowed };
}

export function getSeaTransportBoardRescue(state: SeaTransportState, operationId: string, context: SeaTransportContext, escortFleetId?: string) {
  const operation = state.operations.find((item) => item.id === operationId);
  const forecast = forecastSeaTransportRescue(state, operationId, context, escortFleetId);
  const signature = JSON.stringify({ operation, forecast, week: context.week, nationId: context.nationId, faction: context.playerFaction,
    processing: Boolean(context.processingWeek), division: context.divisions.find((unit) => unit.id === operation?.divisionId),
    base: context.territories.find((territory) => territory.id === forecast.baseId),
    command: context.game.commandPoints, fuel: context.game.fuel, convoys: context.stockpile.convoys,
    escortFleet: context.jointForces.fleets.find((fleet) => fleet.id === operation?.escortFleetId) ?? null,
    selectedEscort: context.jointForces.fleets.find((fleet) => fleet.id === escortFleetId) ?? null,
    escortFleetId, canCommandEscort: context.canCommandEscort,
  });
  return { operation, forecast, signature, canReview: forecast.allowed };
}

export function getSeaTransportBoardEscortRelief(state: SeaTransportState, operationId: string, fleetId: string, context: SeaTransportContext) {
  const operation = state.operations.find((item) => item.id === operationId);
  const forecast = forecastSeaTransportEscortRelief(state, operationId, fleetId, context);
  const signature = JSON.stringify({ operation, forecast, fleetId, week: context.week, nationId: context.nationId,
    faction: context.playerFaction, phase: context.phase, processing: Boolean(context.processingWeek), canCommandEscort: context.canCommandEscort,
    command: context.game.commandPoints, fuel: context.game.fuel,
    division: context.divisions.find((unit) => unit.id === operation?.divisionId),
    currentEscort: context.jointForces.fleets.find((fleet) => fleet.id === operation?.escortFleetId) ?? null,
    selectedEscort: context.jointForces.fleets.find((fleet) => fleet.id === fleetId) ?? null,
  });
  return { operation, forecast, signature, canReview: forecast.allowed };
}

export function getSeaTransportStages(mode: 'transfer' | 'landing', durations: SeaTransportPhaseWeeks) {
  const phases: Array<keyof SeaTransportPhaseWeeks> = mode === 'transfer' ? ['embarking', 'sailing', 'disembarking'] : ['embarking', 'sailing', 'landing', 'beachhead'];
  return phases.map((stage) => ({ stage, label: seaTransportStageLabels[stage], weeks: durations[stage] }));
}

/** An estimate from the approved phase durations; delays and diversions have no promised completion date. */
export function getSeaTransportRemainingWeeks(operation: SeaTransportOperation): number | null {
  if (operation.stage === 'waiting-return') return null;
  if (operation.stage === 'rescuing') return operation.rescue ? Math.max(0, operation.rescue.outboundWeeks - operation.stageWeeks) + operation.rescue.returnWeeks : null;
  if (operation.returnRequestedWeek !== undefined && operation.stage !== 'returning') return null;
  if (operation.stage === 'returning') return operation.returnWeeks === undefined ? null : Math.max(0, operation.returnWeeks - operation.stageWeeks);
  if (operation.stage === 'disembarking') return Math.max(0, operation.phaseWeeks.disembarking - operation.stageWeeks);
  const stages = getSeaTransportStages(operation.mode, operation.phaseWeeks);
  const index = stages.findIndex((item) => item.stage === operation.stage);
  if (index < 0) return null;
  return Math.max(0, stages[index].weeks - operation.stageWeeks) + stages.slice(index + 1).reduce((sum, item) => sum + item.weeks, 0);
}

export function getSeaTransportReturnReason(operation: SeaTransportOperation, context: SeaTransportContext): string | null {
  if (context.processingWeek) return '주간 결산 중에는 철회를 요청할 수 없습니다.';
  if (operation.nationId !== context.nationId || operation.playerFaction !== context.playerFaction || !context.commandableDivisionIds.has(operation.divisionId)) return '현재 소속·보직에서 직접 지휘할 수 없는 수송입니다.';
  if (operation.returnRequestedWeek !== undefined || operation.stage === 'returning' || operation.stage === 'waiting-return' || operation.stage === 'rescuing') return '이미 철회·구조·귀환 절차를 진행 중입니다.';
  return null;
}

/** Ref-backed guard stops duplicate callback delivery before React receives the next snapshot. */
export function createSeaTransportCommandGuard() {
  let lastState: SeaTransportState | null = null;
  let lastWeek = -1;
  let sent = new Set<string>();
  return (state: SeaTransportState, week: number, key: string, action: () => void) => {
    if (lastState !== state || lastWeek !== week) { lastState = state; lastWeek = week; sent = new Set(); }
    if (sent.has(key)) return false;
    sent.add(key); action(); return true;
  };
}

export function SeaTransportBoard(props: SeaTransportBoardProps) {
  const [localSelection, setLocalSelection] = useState(() => createInitialSeaTransportSelection(props));
  const selection = props.selection ?? localSelection;
  const changeSelection = (patch: Partial<SeaTransportSelection>) => {
    const next = patch.workspace !== undefined && patch.workspace !== selection.workspace ? { ...patch, rescueReviewedSignature: null, escortReliefReviewedSignature: null } : patch;
    if (props.onSelectionChange) props.onSelectionChange(next);
    else setLocalSelection((current) => ({ ...current, ...next }));
  };
  const guard = useRef<ReturnType<typeof createSeaTransportCommandGuard> | null>(null);
  if (!guard.current) guard.current = createSeaTransportCommandGuard();
  return <SeaTransportBoardView {...props} selection={selection} onSelectionChange={changeSelection}
    onOpenLocation={(id) => { changeSelection({ rescueReviewedSignature: null, escortReliefReviewedSignature: null }); props.onOpenLocation(id); }}
    onLaunch={(plan) => {
      const current = getSeaTransportBoardPlan(props.state, props.context, plan);
      if (!current.forecast.allowed || selection.reviewedSignature !== current.signature) return;
      guard.current!(props.state, props.context.week, 'launch:' + plan.divisionId, () => {
        props.onLaunch(plan);
        changeSelection({ workspace: 'active', reviewedSignature: null, operationId: null });
      });
    }}
    onReturn={(id) => {
      const operation = props.state.operations.find((item) => item.id === id);
      if (!operation || getSeaTransportReturnReason(operation, props.context)) return;
      guard.current!(props.state, props.context.week, 'return:' + id, () => {
        props.onReturn(id); changeSelection({ returnReviewId: null });
      });
    }}
    onRescue={(id, escortFleetId) => {
      if (escortFleetId !== selection.rescueEscortFleetId) return;
      const model = getSeaTransportBoardRescue(props.state, id, props.context, escortFleetId);
      if (!model.canReview || selection.rescueReviewedSignature !== model.signature) return;
      guard.current!(props.state, props.context.week, 'support:' + id, () => {
        props.onRescue(id, escortFleetId); changeSelection({ rescueReviewedSignature: null, returnReviewId: null, escortReliefReviewedSignature: null });
      });
    }}
    onEscortRelief={(id, fleetId) => {
      if (fleetId !== selection.escortReliefFleetId) return;
      const model = getSeaTransportBoardEscortRelief(props.state, id, fleetId, props.context);
      if (!model.canReview || selection.escortReliefReviewedSignature !== model.signature) return;
      guard.current!(props.state, props.context.week, 'support:' + id, () => {
        props.onEscortRelief(id, fleetId); changeSelection({ escortReliefReviewedSignature: null, rescueReviewedSignature: null });
      });
    }} />;
}

export interface SeaTransportBoardViewProps extends SeaTransportBoardProps {
  selection: SeaTransportSelection;
  onSelectionChange: (patch: Partial<SeaTransportSelection>) => void;
}
function RouteCard({ from, target, onOpenLocation }: { from: { id: string; name: string }; target: { id: string; name: string }; onOpenLocation: (id: string) => void }) {
  return <div className="st-route" aria-label="출발지와 목적지">
    <div><small>출발지</small><strong>{from.name}</strong><button type="button" onClick={() => onOpenLocation(from.id)}><MapPin size={14} />지도에서 보기</button></div>
    <ArrowRight size={22} aria-hidden="true" />
    <div><small>계획 목적지</small><strong>{target.name}</strong><button type="button" onClick={() => onOpenLocation(target.id)}><MapPin size={14} />지도에서 보기</button></div>
  </div>;
}
function StageIcon({ stage }: { stage: SeaTransportStage }) {
  if (stage === 'embarking') return <Users size={20} aria-hidden="true" />;
  if (stage === 'sailing' || stage === 'returning') return <Ship size={20} aria-hidden="true" />;
  if (stage === 'landing') return <Flag size={20} aria-hidden="true" />;
  return <PackageCheck size={20} aria-hidden="true" />;
}
function StageTimeline({ mode, phaseWeeks, stage, stageWeeks = 0 }: { mode: 'transfer' | 'landing'; phaseWeeks: SeaTransportPhaseWeeks; stage?: SeaTransportStage; stageWeeks?: number }) {
  // A friendly control change may replace an approved assault with actual disembarkation.
  const stages = getSeaTransportStages(stage === 'disembarking' ? 'transfer' : mode, phaseWeeks);
  const current = stages.findIndex((item) => item.stage === stage);
  return <ol className="st-timeline" aria-label="작전 단계" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
    {stages.map((item, index) => <li key={item.stage} className={current === index ? 'is-current' : current > index ? 'is-complete' : ''} aria-current={current === index ? 'step' : undefined}>
      <StageIcon stage={item.stage} /><strong>{index + 1}. {item.label}</strong><small>{current === index ? `${stageWeeks}/${item.weeks}주 진행` : current > index ? '단계 완료' : `최소 ${item.weeks}주`}</small>
    </li>)}
  </ol>;
}
function Costs({ forecast, context }: { forecast: Pick<SeaTransportForecast, 'commandCost' | 'fuelCost' | 'convoyCost'>; context: SeaTransportContext }) {
  return <dl className="st-metrics">
    <div className={context.game.commandPoints < forecast.commandCost ? 'is-warning' : ''}><dt>지휘력 · 승인 시 소비</dt><dd>{number(forecast.commandCost)}</dd><small>보유 {number(context.game.commandPoints)} · 반환 없음</small></div>
    <div className={context.game.fuel < forecast.fuelCost ? 'is-warning' : ''}><dt>연료 · 승인 시 소비</dt><dd>{number(forecast.fuelCost)}</dd><small>보유 {number(context.game.fuel)} · 반환 없음</small></div>
    <div className={context.stockpile.convoys < forecast.convoyCost ? 'is-warning' : ''}><dt>수송선 · 예약</dt><dd>{number(forecast.convoyCost)}척</dd><small>가용 {number(context.stockpile.convoys)}척 · 종료 시 잔존 선박 반환</small></div>
  </dl>;
}

function EscortPicker({ state, context, plan, onChange }: { state: SeaTransportState; context: SeaTransportContext; plan: SeaTransportPlan; onChange: (plan: SeaTransportPlan) => void }) {
  const options = getSeaTransportEscortOptions(state, context);
  const selectedIds = getSeaTransportAssignedFleetIds(plan);
  const route = findSeaTransportRoute(plan.fromId, plan.targetId, context.territories) ?? [];
  const airOptions = getSeaTransportAirSupportOptions(state, context, route);
  const selectedAir = plan.airGroupIds ?? [];
  const missingSelection = selectedIds.some((id) => !options.some((option) => option.fleet.id === id)) || selectedAir.some((id) => !airOptions.some((option) => option.group.id === id));
  const toggleFleet = (id: string) => {
    const ids = selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id];
    onChange({ ...plan, escortFleetIds: ids, escortFleetId: ids[0] });
  };
  return <section className="st-surface" aria-label="수송 호위 함대 선택">
    <header className="st-surface-heading"><div><span className="st-eyebrow">03 / LAYERED ESCORT</span><h2>누가 수송선을 지킬까요?</h2><small>함대 최대 3개 + 항공대 최대 2개. 각 전력의 합류 시간과 작전 반경이 실제 보호를 결정합니다.</small></div><ShieldCheck size={25} aria-hidden="true" /></header>
    <h3>해상 호위 <small>{selectedIds.length} / 3 배속 초안</small></h3>
    <div className="st-escort-grid" role="group" aria-label="호위 배속 선택">
      <button type="button" className="st-escort-choice" aria-pressed={!selectedIds.length} onClick={() => onChange({ ...plan, escortFleetId: undefined, escortFleetIds: [] })}><span className="st-escort-heading"><Ship size={21} aria-hidden="true" /><strong>지정 호위 없음</strong></span><small>함대 추가 지휘력·연료 없음</small><p>항공 엄호는 별도로 선택할 수 있습니다. 특정 함대를 무료로 자동 배정하지 않습니다.</p></button>
      {options.map((option) => <button type="button" key={option.fleet.id} className="st-escort-choice" aria-pressed={selectedIds.includes(option.fleet.id)} disabled={!selectedIds.includes(option.fleet.id) && (!option.allowed || selectedIds.length >= 3)} onClick={() => { if (selectedIds.includes(option.fleet.id) || option.allowed && selectedIds.length < 3) toggleFleet(option.fleet.id); }}>
        <span className="st-escort-heading"><ShieldCheck size={21} aria-hidden="true" /><strong>{option.fleet.name}</strong></span>
        <small>{number(option.fleet.ships)}척 · 준비 {number(option.fleet.readiness)} · 조직 {number(option.fleet.organization)}</small>
        <span className="st-escort-impact">합류 후 단독 보호 −{number(option.protection)}%p</span><small>{option.fleet.location} · 기본 지휘력 {option.commandCost} · 연료 {option.fuelCost} + 이동 비용</small>
        <p className={!option.allowed ? 'st-escort-blocked' : ''}>{option.allowed ? '배속 가능 · 선택 후 전체 명령에서 승인' : option.reason}</p>
      </button>)}
    </div>
    <h3>항공 엄호 <small>{selectedAir.length} / 2 배속 초안</small></h3>
    <p>항공대의 기지와 항속거리에 따라 항로 일부만 지킬 수 있습니다. 지도상 먼 바다에는 공중 엄호 공백이 남습니다.</p>
    {!route.length ? <p className="st-escort-blocked">목적지를 선택하면 항로별 엄호 범위를 계산합니다.</p> : <div className="st-escort-grid" role="group" aria-label="항공 엄호 선택">{airOptions.map((option) => {
      const selected = selectedAir.includes(option.group.id);
      return <button type="button" key={option.group.id} className="st-escort-choice" aria-pressed={selected} disabled={!selected && (!option.allowed || selectedAir.length >= 2)} onClick={() => onChange({ ...plan, airGroupIds: selected ? selectedAir.filter((id) => id !== option.group.id) : [...selectedAir, option.group.id] })}>
        <span className="st-escort-heading"><Plane size={21} aria-hidden="true" /><strong>{option.name}</strong></span>
        <small>{option.baseName} · {number(option.group.aircraft)}대 · 작전 반경 {number(option.radiusNm)}해리</small>
        <span className="st-escort-impact">항로 엄호 가능 {number(option.coverage * 100)}%</span>
        <small>추가 지휘력 {option.commandCost} · 연료 {option.fuelCost}</small>
        <p className={!option.allowed ? 'st-escort-blocked' : ''}>{option.reason}</p>
      </button>;
    })}</div>}
    {missingSelection ? <div className="st-notice st-warning" role="status"><ShieldAlert size={18} aria-hidden="true" /><p>초안에서 선택한 호위 함대를 찾을 수 없습니다. 다른 함대를 자동 배정하지 않았습니다. 호위 선택을 다시 확인하십시오.</p></div> : null}
    <small>복수 전력의 보호 효과는 단순 합산하지 않습니다. 모항 출발 → 합류 → 엄호 → 귀항 → 재급유를 거치며, 돌아오는 함대는 새 명령에 사용할 수 없습니다. 선택을 바꿔도 승인 전에는 비용이 없습니다.</small>
  </section>;
}

function Planning({ state, context, selection, onSelectionChange, onLaunch, onOpenLocation }: SeaTransportBoardViewProps) {
  const fieldId = useId();
  const model = useMemo(() => getSeaTransportBoardPlan(state, context, selection.plan), [state, context, selection.plan]);
  const { division, origin, target, forecast, destinations } = model;
  const commandable = context.divisions.filter((unit) => context.commandableDivisionIds.has(unit.id));
  const reviewed = selection.reviewedSignature === model.signature;
  const staleReview = selection.reviewedSignature !== null && !reviewed;
  const updatePlan = (plan: SeaTransportPlan) => onSelectionChange({ plan, reviewedSignature: null });
  return <div className="st-layout">
    <aside className="st-surface" aria-label="수송 부대 선택">
      <header><span className="st-eyebrow">01 / FORMATION</span><h2>어느 부대를 보낼까요?</h2><small>직접 지휘 범위 {commandable.length}개 부대. 선택만으로 배속하지 않습니다.</small></header>
      {commandable.length ? <div className="st-choice-list" role="group" aria-label="직접 지휘 가능한 부대">{commandable.map((unit) => {
        const reason = getSeaTransportDivisionReason(state, unit, context);
        const location = context.territories.find((territory) => territory.id === unit.territoryId);
        return <button type="button" key={unit.id} disabled={Boolean(reason)} aria-pressed={unit.id === selection.plan.divisionId} onClick={() => updatePlan({ divisionId: unit.id, fromId: unit.territoryId, targetId: '' })}>
          <strong>{unit.name}</strong><small>{divisionLabels[unit.type]} · {location?.name ?? '위치 확인 필요'}</small><small>{reason ?? `명령 대기 · 병력 ${number(unit.strength)} · 조직 ${number(unit.organization)}`}</small>
        </button>;
      })}</div> : <div className="st-empty"><h3>직접 지휘할 부대가 없습니다</h3><p>현재 보직의 지휘 범위를 확인하십시오. 열람만으로 다른 국가나 상급 지휘관의 부대를 배속하지 않습니다.</p></div>}
      <p><LockKeyhole size={14} aria-hidden="true" /> 수송 배속 중인 부대는 별도 육상 공세·이동에 사용할 수 없습니다.</p>
    </aside>
    <div className="st-stack">
      <section className="st-surface" aria-labelledby={fieldId + '-title'}>
        <header className="st-surface-heading"><div><span className="st-eyebrow">02 / DESTINATION</span><h2 id={fieldId + '-title'}>바다 건너 목적지</h2></div><Anchor size={24} aria-hidden="true" /></header>
        {origin ? <p>출발 거점은 <strong>{origin.name}</strong>입니다. 실제 부대 위치에서 이어진 해상 경로만 표시합니다.</p> : <p>수송할 부대를 선택하면 실제 주둔지에서 출발하는 경로를 확인할 수 있습니다.</p>}
        <label className="st-field" htmlFor={fieldId + '-destination'}>육지 목적지<select id={fieldId + '-destination'} value={selection.plan.targetId} disabled={!origin || !destinations.length} onChange={(event) => updatePlan({ ...selection.plan, targetId: event.currentTarget.value })}>
          <option value="">목적지를 선택하세요</option>
          {selection.plan.targetId && !destinations.some((item) => item.id === selection.plan.targetId) ? <option value={selection.plan.targetId}>{target?.name ?? selection.plan.targetId} · 현재 연결 없음</option> : null}
          {destinations.map((destination) => <option key={destination.id} value={destination.id}>{destination.name} · {destination.controller === context.playerFaction ? '아군 수송' : destination.controller === 'neutral' ? '중립 · 승인 불가' : context.phase === 'war' ? '적대 상륙' : '상대 진영 · 평시 승인 불가'}</option>)}
        </select></label>
        {origin && !destinations.length ? <div className="st-empty"><h3>이 출발지에는 해상 수송 경로가 없습니다</h3><p>항구·섬과 연결된 다른 예하 부대를 선택하십시오. 내륙을 가로지르거나 바다 한가운데로 병력을 옮기는 경로를 만들지 않습니다.</p></div> : null}
        {origin && target ? <><RouteCard from={origin} target={target} onOpenLocation={onOpenLocation} /><div className="st-notice"><Info size={19} aria-hidden="true" /><p>{forecast.mode === 'transfer' ? '아군 수송: 승선 → 항해 → 하선·재편 후 실제 주둔지가 바뀝니다. 안전을 보장하는 명령은 아니며 항해 중 손실이 발생할 수 있습니다.' : '적대 상륙: 실제 병력을 승선시켜 상륙 교전과 교두보 보급까지 수행합니다. 해공군 엄호만 실행하는 명령과 다릅니다. 상륙 성공 전에는 점령하지 않습니다.'}</p></div></> : null}
      </section>
      {division && origin ? <EscortPicker state={state} context={context} plan={selection.plan} onChange={updatePlan} /> : null}
      {division && origin && target ? <section className="st-surface" aria-labelledby={fieldId + '-forecast'}>
        <header className="st-surface-heading"><div><span className="st-eyebrow">04 / ORDER REVIEW</span><h2 id={fieldId + '-forecast'}>예상 일정과 지불할 비용</h2></div><FileCheck2 size={24} aria-hidden="true" /></header>
        <StageTimeline mode={forecast.mode} phaseWeeks={forecast.phaseWeeks} />
        <p><strong>최소 {forecast.minimumWeeks}주</strong> · 각 주간 진행에서 한 단계씩 처리합니다. 전황 변화·보급 지연·귀환은 기간을 늘릴 수 있습니다.{forecast.mode === 'landing' ? ` 현재 상륙 성공 전망 ${forecast.successChance}%.` : ' 아군 목적지라도 무손실 도착을 보장하지 않습니다.'}</p>
        <Costs forecast={forecast} context={context} />
        {forecast.escorts.length || forecast.airSupport.length ? <div className="st-notice"><ShieldCheck size={19} aria-hidden="true" /><div><p>지정 호위: <strong>함대 {forecast.escorts.length}개 · 항공대 {forecast.airSupport.length}개</strong>. 보호 전망 −{number(forecast.supportProtection)}%p. 전력별 비용은 위 합계에 포함되어 있으며 실제 합류·항로 위치·피로에 따라 효과가 달라집니다.</p><ul className="st-log">{forecast.escorts.map((escort) => <li key={escort.fleetId}>{escort.name} · 합류까지 약 {escort.arrivalWeeks ?? 0}주 · 접근 거리 {number(escort.distanceNm ?? 0)}해리</li>)}{forecast.airSupport.map((air) => <li key={air.airGroupId}>{air.name} · {air.baseName} · 항로 지점 {number(air.coverage * 100)}% 엄호 가능</li>)}</ul></div></div> : null}
        <details className="st-disclosure"><summary>전망에 반영한 근거와 한계</summary><ul className="st-log">{forecast.factors.map((factor) => <li key={factor}>{factor}</li>)}</ul><p>표시된 병력·조직력은 게임 지수입니다. 수송선 수량·단계 기간은 전략 게임의 추상화이며 실제 선박 수송력이나 역사적 작전 일정을 뜻하지 않습니다.</p></details>
        {!forecast.allowed ? <div className="st-notice st-warning" role="status"><ShieldAlert size={19} aria-hidden="true" /><p>{forecast.reason}</p></div> : null}
        {staleReview ? <div className="st-notice st-warning" role="status"><Clock3 size={19} aria-hidden="true" /><p>검토 이후 주차·부대·자원 또는 전황이 바뀌었습니다. 초안은 유지했습니다. 아래 현재 전망을 다시 검토해야 승인할 수 있습니다.</p></div> : null}
        {reviewed ? <div className="st-approval"><h3>최종 승인 · {division.name}</h3><p>{origin.name} → {target.name}. {forecast.mode === 'landing' ? '적대 상륙과 교두보 확보' : '아군 거점 수송'}를 승인합니다. 지금 지휘력 {forecast.commandCost}·연료 {forecast.fuelCost}를 소비하고 수송선 {forecast.convoyCost}척을 예약합니다.</p><small>취소해도 지휘력·연료는 돌아오지 않습니다. 출항 뒤 철회는 귀환 절차이며 즉시 순간이동하지 않습니다.</small><div className="st-actions"><button type="button" className="st-primary" disabled={!forecast.allowed} onClick={() => { if (forecast.allowed && reviewed) onLaunch({ ...selection.plan }); }}><CheckCheck size={18} />비용을 지불하고 수송 승인</button><button type="button" onClick={() => onSelectionChange({ reviewedSignature: null })}>다시 편집</button></div></div>
          : <div><p>아직 승인하지 않았습니다. 부대·목적지 선택과 전망 검토에는 비용이 들지 않습니다.</p><button type="button" className="st-primary" disabled={!model.canReview} onClick={() => { if (model.canReview) onSelectionChange({ reviewedSignature: model.signature }); }}><FileCheck2 size={18} />명령 검토하기</button></div>}
      </section> : selection.plan.divisionId && !division ? <div className="st-notice st-warning" role="status"><ShieldAlert size={19} aria-hidden="true" /><p>초안의 부대를 현재 자료에서 찾을 수 없습니다. 다른 부대를 자동 배속하지 않았습니다. 지휘 가능한 부대를 다시 선택하십시오.</p></div> : null}
    </div>
  </div>;
}

function ActiveEscort({ operation, context, state }: { operation: SeaTransportOperation; context: SeaTransportContext; state: SeaTransportState }) {
  const fleetIds = getSeaTransportAssignedFleetIds(operation);
  const airIds = getSeaTransportAssignedAirGroupIds(operation);
  if (!fleetIds.length && !airIds.length) return <small><Ship size={14} aria-hidden="true" /> 지정 호위 없음 · 전구 제해권·제공권을 기준으로 항해 위험을 처리합니다.</small>;
  const fleets = getSeaTransportEscortOptions(state, context).filter((item) => fleetIds.includes(item.fleet.id)).map((item) => item.fleet);
  const aircraft = context.jointForces.airGroups.filter((item) => airIds.includes(item.id));
  const protection = getSeaTransportActiveProtection(operation, context);
  return <section className="st-escort-detail" aria-label="현재 배속 호위 함대">
    <header className="st-surface-heading"><div><span className="st-eyebrow">LAYERED PROTECTION</span><h3>함대 {fleets.length}개 · 항공대 {aircraft.length}개</h3></div><ShieldCheck size={24} aria-hidden="true" /></header>
    <dl className="st-metrics"><div><dt>현재 해상 위험 감소</dt><dd>−{number(protection)}%p</dd><small>합류·현 위치·소속 검증 후 적용</small></div><div><dt>현재 함정 / 누적 손실</dt><dd>{number(fleets.reduce((sum, fleet) => sum + fleet.ships, 0))} / {number(operation.escortShipsLost ?? 0)}척</dd><small>수송선 손실과 별도</small></div><div><dt>항공기 누적 손실</dt><dd>{number(operation.aircraftLost ?? 0)}대</dd><small>반경 밖·미배속 전력 효과 없음</small></div></dl>
    <div className="st-fleet-voyages">{fleets.map((fleet) => <FleetVoyageCard key={fleet.id} fleet={fleet} />)}</div>
    {aircraft.map((air) => <p key={air.id}><Plane size={16} /> {air.name} · {air.base} · {number(air.aircraft)}대 · 준비 {number(air.readiness)} / 가동 {number(air.serviceability)}%</p>)}
    <p>보호 효과는 단순 합산하지 않습니다. 실제 위치와 잔존 항속, 항공 초계 반경에 따라 보호 공백이 생길 수 있습니다.</p>
  </section>;
}

function SupportFleetPicker({ state, context, selectedId, onChange, rescue, currentName, pendingName }: {
  state: SeaTransportState; context: SeaTransportContext; selectedId?: string; onChange: (id?: string) => void; rescue?: boolean; currentName?: string; pendingName?: string;
}) {
  const id = useId();
  const options = getSeaTransportEscortOptions(state, context);
  const selected = options.find((option) => option.fleet.id === selectedId);
  return <div className="st-support-picker">
    <label className="st-field" htmlFor={id}>{rescue ? '구조 수송의 호위 편성' : '출동할 호위 함대'}<select id={id} value={selectedId ?? ''} onChange={(event) => onChange(event.currentTarget.value || undefined)}>
      <option value="">{rescue ? currentName ? `기존 호위 유지 · ${currentName}` : pendingName ? `기존 호위 파견 유지 · ${pendingName}` : '지정 호위 없이 구조선만 출동' : '새 함대를 선택하세요 · 선택만으로 비용 없음'}</option>
      {selectedId && !selected ? <option value={selectedId}>{selectedId} · 현재 함대 자료 없음</option> : null}
      {options.map((option) => <option key={option.fleet.id} value={option.fleet.id} disabled={!option.allowed}>{option.fleet.name} · {option.allowed ? `${number(option.fleet.ships)}척 · 준비 ${number(option.fleet.readiness)}` : option.reason}</option>)}
    </select></label>
    {selected ? <div className="st-support-candidate"><strong>{selected.fleet.name}</strong><small>{selected.fleet.commander} 지휘 · 현재 {number(selected.fleet.ships)}척 · 준비 {number(selected.fleet.readiness)} / 조직 {number(selected.fleet.organization)}</small><p>합류 후 현재 능력 기준 해상 위험 감소 −{number(selected.protection)}%p. 접근 중의 피로·피해로 실제 합류 시 효과는 달라질 수 있습니다.</p>{!selected.allowed ? <small className="st-escort-blocked">{selected.reason}</small> : null}</div> : selectedId ? <div className="st-notice st-warning" role="status"><ShieldAlert size={18} aria-hidden="true" /><p>초안의 함대를 찾을 수 없습니다. 다른 함대를 자동 선택하지 않았습니다.</p></div> : null}
    {context.canCommandEscort === false ? <small className="st-escort-blocked">현재 보직은 새 함대 배속 권한이 없습니다. 이미 배속된 호위의 열람과 지휘 가능한 부대의 기존 구조 절차는 별도로 유지됩니다.</small> : null}
  </div>;
}

function PendingEscortRelief({ operation, context }: { operation: SeaTransportOperation; context: SeaTransportContext }) {
  const pending = operation.pendingEscortRelief;
  if (!pending) return null;
  const fleet = context.jointForces.fleets.find((item) => item.id === pending.fleetId);
  const remaining = Math.max(0, pending.arrivalWeeks - pending.elapsedWeeks);
  return <section className="st-relief-desk" aria-label="출동 중인 호위 함대">
    <header className="st-surface-heading"><div><span className="st-eyebrow">ESCORT RENDEZVOUS / 접근 중</span><h3>{pending.fleetName} 합류를 기다리고 있습니다</h3></div><ShieldCheck size={25} aria-hidden="true" /></header>
    <div className="st-relief-handoff"><div><small>{pending.source === 'rescue' ? '고립 부대 곁의 기존 호위' : '지금 수송선을 지키는 함대'}</small><strong>{operation.escortFleetName ?? operation.escortFleetId ?? '현재 지정 호위 없음'}</strong><p>{operation.escortFleetId ? '새 함대가 실제 합류할 때까지 기존 배속이 유지됩니다.' : pending.source === 'rescue' ? '고립 부대 곁에는 기존 호위가 없습니다. 이동 중인 구조선의 엄호와는 별개입니다.' : '새 함대가 합류하기 전에는 지정 호위 보호가 없습니다.'}</p></div><ArrowRight size={24} aria-hidden="true" /><div><small>{pending.source === 'rescue' ? '구조선 동행 · 본대 인계 전' : '출동 중 · 아직 보호 미적용'}</small><strong>{pending.fleetName}</strong><p>{remaining > 0 ? `기본 접근 일정 약 ${remaining}주 남음` : '기본 접근 일정 경과 · 실제 합류 조건 확인 중'}</p></div></div>
    <dl className="st-metrics"><div><dt>접근 진행</dt><dd>{pending.elapsedWeeks} / {pending.arrivalWeeks}주</dd><small>제{pending.dispatchedWeek + 1}주 파견</small></div><div><dt>이미 소비한 지휘력 / 연료</dt><dd>{pending.commandCost} / {pending.fuelCost}</dd><small>아래 누적 비용에 포함 · 추가 청구 아님</small></div><div><dt>접근 함대 준비 / 조직</dt><dd>{fleet ? `${number(fleet.readiness)} / ${number(fleet.organization)}` : '자료 없음'}</dd><small>{fleet ? `${number(fleet.ships)}척 · 다른 작전 배속 불가` : '현재 편제 자료 확인 필요'}</small></div></dl>
    <small>{pending.source === 'rescue' ? '구조선이 고립 부대에 도착해 실제 합류할 때 새 호위로 인계합니다.' : '접근 주차의 위험 판정이 끝난 뒤 합류하며, 새 호위의 보호는 다음 주부터 반영합니다.'} 교대할 두 함대의 효과를 동시에 더하지 않습니다. 함대 위치·해상 회랑·잔여 항속을 주간 단위로 계산하며 개별 함정의 항법을 재현하는 정밀 해도는 아닙니다.</small>
  </section>;
}

function EscortReliefDesk({ operation, state, context, selection, onSelectionChange, onEscortRelief }: { operation: SeaTransportOperation } & Pick<SeaTransportBoardViewProps, 'state' | 'context' | 'selection' | 'onSelectionChange' | 'onEscortRelief'>) {
  if (operation.pendingEscortRelief || operation.stage === 'waiting-return' && operation.convoysRemaining <= 0 || operation.stage === 'rescuing' || operation.stage === 'disembarking') return null;
  const selectedId = selection.escortReliefFleetId ?? '';
  const model = getSeaTransportBoardEscortRelief(state, operation.id, selectedId, context);
  const forecast = model.forecast;
  const reviewed = selection.escortReliefReviewedSignature === model.signature;
  const stale = Boolean(selection.escortReliefReviewedSignature) && !reviewed;
  return <section className="st-relief-desk" aria-label="호위 증원과 교대 계획">
    <header className="st-surface-heading"><div><span className="st-eyebrow">ESCORT RELIEF / 별도 파견 명령</span><h3>{operation.escortFleetId ? '지친 호위를 새 함대로 교대하세요' : '항해 중에도 호위를 파견할 수 있습니다'}</h3></div><ShieldCheck size={25} aria-hidden="true" /></header>
    <p>{operation.escortFleetId ? '기존 호위는 새 함대가 실제 합류하기 전까지 계속 임무를 수행합니다. 승인 즉시 교체하거나 두 함대의 효과를 합산하지 않습니다.' : '호위 없이 출항한 수송에도 새 함대를 보낼 수 있습니다. 출동은 보호 개시가 아니며, 실제 합류가 필요합니다.'}</p>
    <SupportFleetPicker state={state} context={context} selectedId={selection.escortReliefFleetId} onChange={(escortReliefFleetId) => onSelectionChange({ escortReliefFleetId, escortReliefReviewedSignature: null })} />
    {selectedId ? <><dl className="st-metrics"><div><dt>합류까지 기본 접근</dt><dd>{forecast.arrivalWeeks}주</dd><small>접근 중 피로·손실·작전 종료 가능</small></div><div><dt>추가 소비 지휘력 / 연료</dt><dd>{forecast.commandCost} / {forecast.fuelCost}</dd><small>승인 시 소비 · 수송선 추가 투입 없음</small></div><div><dt>현재 가용 지휘력 / 연료</dt><dd>{number(context.game.commandPoints)} / {number(context.game.fuel)}</dd><small>선택·검토는 무료</small></div></dl><details className="st-disclosure"><summary>합류 일정과 비용의 근거</summary><ul className="st-log">{forecast.factors.map((factor) => <li key={factor}>{factor}</li>)}</ul><small>실제 지리 이동 대신 주간 접근 단계를 사용하는 전략적 추상화입니다. 합류 전에 수송이 종료되면 교대는 중단되며 이미 사용한 비용은 남습니다.</small></details></> : null}
    {!model.canReview && selectedId ? <div className="st-notice st-warning" role="status"><ShieldAlert size={19} aria-hidden="true" /><p>{forecast.reason}</p></div> : null}
    {stale ? <div className="st-notice st-warning" role="status"><Clock3 size={19} aria-hidden="true" /><p>호위 검토 이후 주차·함대 상태·자원 또는 지휘권이 바뀌었습니다. 선택한 함대는 유지했으며 현재 조건을 다시 검토해야 합니다.</p></div> : null}
    {reviewed ? <div className="st-approval"><h3>호위 파견 최종 승인</h3><p>{forecast.escort?.name} 출동에 지휘력 {forecast.commandCost}·연료 {forecast.fuelCost}를 추가 소비합니다. 기본 {forecast.arrivalWeeks}주 접근 후 실제 합류한 다음 주부터 보호하며, 기존 호위는 합류 전까지 유지됩니다.</p><div className="st-actions"><button type="button" className="st-primary" disabled={!model.canReview} onClick={() => { if (model.canReview && reviewed) onEscortRelief(operation.id, selectedId); }}><ShieldCheck size={18} aria-hidden="true" />비용을 지불하고 호위 파견</button><button type="button" onClick={() => onSelectionChange({ escortReliefReviewedSignature: null })}>다시 검토</button></div></div> : <div className="st-actions"><button type="button" className="st-primary" disabled={!model.canReview} onClick={() => { if (model.canReview) onSelectionChange({ escortReliefReviewedSignature: model.signature }); }}><FileCheck2 size={18} aria-hidden="true" />호위 파견 검토하기</button></div>}
  </section>;
}

function EscortReliefHistory({ records }: { records?: SeaTransportEscortReliefRecord[] }) {
  if (!records?.length) return null;
  return <details className="st-disclosure st-relief-history" open><summary>호위 파견·인계 기록 · {records.length}건</summary><ol className="st-handoff-log">{records.map((record, index) => <li key={`${record.fleetId}-${record.dispatchedWeek}-${index}`}><header><strong>{record.fleetName}</strong><span className={`st-outcome${record.status === 'joined' ? '' : ' is-setback'}`}>{record.status === 'joined' ? '합류·인계 완료' : record.status === 'lost' ? '접근 함대 손실' : '합류 전 파견 중단'}</span></header><small>{record.previousFleetName ? `${record.previousFleetName}에서 교대` : '지정 호위가 없던 수송에 증원'} · {record.source === 'rescue' ? '구조 수송 동행' : '별도 호위 파견'}</small><p>제{record.dispatchedWeek + 1}주 파견 → 제{record.resolvedWeek + 1}주 {record.status === 'joined' ? '합류' : '종결'}. 지휘력 {record.commandCost}·연료 {record.fuelCost} 소비.</p><p>{record.reason}</p></li>)}</ol><small>이 비용은 작전 누적 총액에 이미 포함되어 있습니다. 함대의 현재 상태가 아니라 당시 파견·합류·중단을 기록한 이력입니다.</small></details>;
}

function RescueDesk({ operation, state, context, selection, onSelectionChange, onRescue, onOpenLocation }: { operation: SeaTransportOperation } & Pick<SeaTransportBoardViewProps, 'state' | 'context' | 'selection' | 'onSelectionChange' | 'onRescue' | 'onOpenLocation'>) {
  const inRescue = operation.stage === 'rescuing' || operation.stage === 'returning' && Boolean(operation.rescue);
  if (inRescue && operation.rescue) {
    const rescue = operation.rescue;
    return <section className="st-rescue-desk" aria-label="구조 수송 진행">
      <header className="st-surface-heading"><div><span className="st-eyebrow">RESCUE UNDER WAY / {rescue.attempt}차</span><h3>구조선이 움직이고 있습니다</h3></div><LifeBuoy size={25} aria-hidden="true" /></header>
      <p>승인된 구조 기지: <strong>{rescue.baseName}</strong> · 제{rescue.dispatchedWeek + 1}주 출동. 구조선 도착과 부대의 귀환은 서로 다른 단계입니다.</p>
      <ol className="st-timeline st-rescue-timeline" aria-label="구조 접근과 귀환 일정">
        <li className={operation.stage === 'rescuing' ? 'is-current' : 'is-complete'} aria-current={operation.stage === 'rescuing' ? 'step' : undefined}><LifeBuoy size={21} aria-hidden="true" /><strong>1. 구조선 접근</strong><small>{operation.stage === 'rescuing' ? `${operation.stageWeeks}/${rescue.outboundWeeks}주 진행` : '구조선 접근 완료'}</small></li>
        <li className={operation.stage === 'returning' ? 'is-current' : ''} aria-current={operation.stage === 'returning' ? 'step' : undefined}><Undo2 size={21} aria-hidden="true" /><strong>2. 부대 귀환 항해</strong><small>{operation.stage === 'returning' ? `${operation.stageWeeks}/${operation.returnWeeks ?? rescue.returnWeeks}주 진행` : `추가 최소 ${rescue.returnWeeks}주 예상`}</small></li>
      </ol>
      <small>구조 중에도 선박 손실과 경로 변경이 가능합니다. 실제 종료 전에는 남은 수송선을 환급하거나 부대를 임의의 거점으로 이동하지 않습니다.</small>
    </section>;
  }
  if (operation.stage !== 'waiting-return' || operation.convoysRemaining > 0) return null;
  const model = getSeaTransportBoardRescue(state, operation.id, context, selection.rescueEscortFleetId);
  const forecast = model.forecast;
  const reviewed = selection.rescueReviewedSignature === model.signature;
  const stale = Boolean(selection.rescueReviewedSignature) && !reviewed;
  return <section className="st-rescue-desk" aria-label="고립 부대 구조 계획">
    <header className="st-surface-heading"><div><span className="st-eyebrow">RESCUE ORDER / 누적 출동 {operation.rescueDispatches ?? 0}회</span><h3>수송선을 잃은 부대를 구출하세요</h3></div><LifeBuoy size={25} aria-hidden="true" /></header>
    <p>추가 수송선을 비용을 지불하고 투입합니다. 안전한 연결 기지·가용 선박·현재 지휘권을 검증하며, 기존 손실을 없애는 복구 버튼이 아닙니다.</p>
    <SupportFleetPicker state={state} context={context} rescue currentName={operation.escortFleetName ?? operation.escortFleetId} pendingName={operation.pendingEscortRelief?.fleetName} selectedId={selection.rescueEscortFleetId} onChange={(rescueEscortFleetId) => onSelectionChange({ rescueEscortFleetId, rescueReviewedSignature: null })} />
    <small>{selection.rescueEscortFleetId ? '새 함대가 구조 기지에 도착하면 구조선과 함께 출항해 이동 중부터 구조선을 엄호합니다. 고립 부대에 실제 합류하기 전에는 그 부대를 원격 보호하지 않습니다. 기존 호위는 현장에 남습니다.' : operation.pendingEscortRelief ? `이미 승인한 ${operation.pendingEscortRelief.fleetName} 접근과 기존 호위 배속을 그대로 유지합니다. 새 함대를 이중 파견하거나 기존 출동비를 다시 청구하지 않습니다.` : operation.escortFleetId ? '추가 함대를 파견하지 않고 현재 호위 배속을 유지합니다. 아래 비용에는 새 호위 파견비가 없습니다.' : '지정 호위 없이 구조 수송만 출동합니다. 해상 위험과 추가 선박 손실이 가능합니다.'}</small>
    {forecast.baseId ? <div className="st-route"><div><small>구조선 출발 기지</small><strong>{forecast.baseName}</strong><button type="button" onClick={() => onOpenLocation(forecast.baseId)}><MapPin size={14} aria-hidden="true" />기지 확인</button></div><ArrowRight size={22} aria-hidden="true" /><div><small>구조 대상</small><strong>{operation.divisionName}</strong><small>원래 계획: {operation.fromName} → {operation.targetName}</small></div></div> : <div className="st-notice st-warning"><ShieldAlert size={19} aria-hidden="true" /><p>현재 연결 가능한 구조 기지를 확보하지 못했습니다. 지도에서 아군 항구와 귀환 경로를 확인하십시오.</p></div>}
    {forecast.baseId ? <><ol className="st-timeline st-rescue-timeline" aria-label="구조 예정 일정"><li><LifeBuoy size={21} aria-hidden="true" /><strong>1. 구조선 접근</strong><small>최소 {forecast.outboundWeeks}주</small></li><li><Undo2 size={21} aria-hidden="true" /><strong>2. 부대 귀환 항해</strong><small>추가 최소 {forecast.returnWeeks}주</small></li></ol><p><strong>총 최소 {forecast.minimumWeeks}주</strong> · 새로운 위험·피해·귀환항 통제 변화는 기간을 늘릴 수 있습니다.</p><Costs forecast={forecast} context={context} /></> : null}
    <details className="st-disclosure"><summary>구조 비용과 위험의 근거</summary><ul className="st-log">{forecast.factors.map((factor) => <li key={factor}>{factor}</li>)}</ul><small>여기에 표시한 비용은 이번 구조 출동의 추가 비용입니다. 원래 수송과 이전 구조 출동의 손실·소비는 그대로 남습니다.</small></details>
    {!model.canReview ? <div className="st-notice st-warning" role="status"><ShieldAlert size={19} aria-hidden="true" /><p>{forecast.reason}</p></div> : null}
    {stale ? <div className="st-notice st-warning" role="status"><Clock3 size={19} aria-hidden="true" /><p>구조 검토 이후 주차·기지·부대·자원 또는 지휘권이 바뀌었습니다. 현재 조건을 다시 검토해야 합니다.</p></div> : null}
    {forecast.escort ? <div className="st-notice"><ShieldCheck size={19} aria-hidden="true" /><p>구조 동행 함대: <strong>{forecast.escort.name}</strong>. 위 총비용에 새 호위 파견비가 이미 포함되어 있으며, 별도로 다시 지불하지 않습니다. 현재 기준 보호 −{number(forecast.escort.protection)}%p는 구조선과 실제 동행하는 항로 구간에 적용합니다.</p></div> : null}
    {reviewed ? <div className="st-approval"><h3>구조 출동 최종 승인</h3><p>{forecast.baseName}에서 {operation.divisionName} 구조를 위해 수송선 {forecast.convoyCost}척을 추가 예약하고 지휘력 {forecast.commandCost}·연료 {forecast.fuelCost}를 소비합니다. 승인 즉시 부대가 귀환하지는 않습니다.{forecast.escort ? ` ${forecast.escort.name}도 함께 파견하며 실제 합류 이후 호위를 인계합니다.` : ''}</p><div className="st-actions"><button type="button" className="st-primary" disabled={!model.canReview} onClick={() => { if (model.canReview && reviewed) onRescue(operation.id, selection.rescueEscortFleetId); }}><LifeBuoy size={18} aria-hidden="true" />비용을 지불하고 구조선 출동</button><button type="button" onClick={() => onSelectionChange({ rescueReviewedSignature: null })}>다시 검토</button></div></div>
      : <div className="st-actions"><button type="button" className="st-primary" disabled={!model.canReview} onClick={() => { if (model.canReview) onSelectionChange({ rescueReviewedSignature: model.signature }); }}><FileCheck2 size={18} aria-hidden="true" />구조 계획 검토하기</button></div>}
  </section>;
}

function ActiveOperation({ operation, state, context, selection, onSelectionChange, onReturn, onRescue, onEscortRelief, onOpenLocation }: { operation: SeaTransportOperation } & Pick<SeaTransportBoardViewProps, 'state' | 'context' | 'selection' | 'onSelectionChange' | 'onReturn' | 'onRescue' | 'onEscortRelief' | 'onOpenLocation'>) {
  const remaining = getSeaTransportRemainingWeeks(operation);
  const division = context.divisions.find((unit) => unit.id === operation.divisionId);
  const target = context.territories.find((territory) => territory.id === operation.targetId);
  const returning = operation.stage === 'returning' || operation.stage === 'waiting-return' || operation.stage === 'rescuing';
  const returnReason = getSeaTransportReturnReason(operation, context);
  const returnTarget = context.territories.find((territory) => territory.id === operation.returnTargetId);
  return <section className="st-surface" aria-label="선택 수송 진행 상황">
    <header className="st-surface-heading"><div><span className="st-eyebrow">ACTIVE TRANSPORT / 제{operation.startedWeek + 1}주 승인</span><h2>{operation.divisionName}</h2><small>{operation.mode === 'transfer' ? '아군 거점 수송' : '상륙·교두보 작전'} · {operation.elapsedWeeks}주 경과</small></div><Ship size={26} aria-hidden="true" /></header>
    <RouteCard from={{ id: operation.fromId, name: operation.fromName }} target={{ id: operation.targetId, name: operation.targetName }} onOpenLocation={onOpenLocation} />
    <h3>{seaTransportStageLabels[operation.stage]} · {remaining === null ? '종료 시점 재확인 중' : remaining === 0 ? '기본 일정 경과 · 완료 조건 대기' : `기본 일정상 약 ${remaining}주 남음`}</h3>
    {returning ? <div className="st-notice st-warning"><Undo2 size={20} aria-hidden="true" /><p>{operation.stage === 'waiting-return' ? '안전한 귀환항이나 수송 능력이 확보될 때까지 대기합니다. 부대가 임의의 항구로 순간이동하거나 수송선을 환급하지 않습니다.' : operation.stage === 'rescuing' ? '구조선을 추가 투입해 부대에 접근하고 있습니다. 도착 뒤에도 귀환 항해가 남아 있습니다.' : `${returnTarget?.name ?? '기록된 귀환항'} 방향으로 귀환 항해 중입니다. ${operation.stageWeeks}/${operation.returnWeeks ?? '?'}주 진행.`}</p></div> : <StageTimeline mode={operation.mode} phaseWeeks={operation.phaseWeeks} stage={operation.stage} stageWeeks={operation.stageWeeks} />}
    <div className="st-notice" role="status"><Info size={19} aria-hidden="true" /><p>{operation.lastMessage}</p></div>
    <dl className="st-metrics">
      <div><dt>잔존 수송선 / 누적 투입</dt><dd>{operation.convoysRemaining} / {operation.convoysReserved}척</dd><small>누적 손실 {operation.convoysReserved - operation.convoysRemaining}척 · 구조선 포함</small></div>
      <div><dt>병력 지수 누적 손실</dt><dd>−{number(operation.strengthLoss)}</dd><small>{division ? `현재 병력 지수 ${number(division.strength)}` : '부대 현재 자료 확인 필요'}</small></div>
      <div><dt>조직력 누적 손실</dt><dd>−{number(operation.organizationLoss)}</dd><small>{division ? `현재 보급 ${number(division.supply)} · 조직 ${number(division.organization)}` : '부대 현재 자료 확인 필요'}</small></div>
    </dl>
    <ActiveEscort operation={operation} state={state} context={context} />
    <PendingEscortRelief operation={operation} context={context} />
    <EscortReliefDesk operation={operation} state={state} context={context} selection={selection} onSelectionChange={onSelectionChange} onEscortRelief={onEscortRelief} />
    <RescueDesk operation={operation} state={state} context={context} selection={selection} onSelectionChange={onSelectionChange} onRescue={onRescue} onOpenLocation={onOpenLocation} />
    <EscortReliefHistory records={operation.escortReliefHistory} />
    <p><LockKeyhole size={15} aria-hidden="true" /> 수송 명령이 유지되는 동안 이 부대는 새 육상 명령에 배속할 수 없습니다. {operation.landingCaptured ? '상륙 통제권은 확보했지만 보급·지휘권 인계 완료가 필요합니다.' : '승인·출항만으로 목적지 소유권은 바뀌지 않습니다.'}{target ? ` 목적지 현재 상태: ${controlLabel(target.controller, context.playerFaction)} · 보급 ${number(target.supply)}.` : ''}</p>
    <details className="st-disclosure"><summary>누적 승인 비용과 경로 기록</summary><p>지휘력 {operation.commandCost}·연료 {operation.fuelCost} 누적 소비. 수송·지정 호위·구조 출동 비용을 합한 값입니다. 수송선 {operation.convoysReserved}척 누적 투입, 종료 시 잔존 선박만 반환됩니다.</p><p>{operation.routeIds.map((id) => context.territories.find((territory) => territory.id === id)?.name ?? id).join(' → ')}</p></details>
    {returnReason ? <small>{returnReason}</small> : selection.returnReviewId === operation.id ? <div className="st-approval"><h3>수송을 철회할까요?</h3><p>출항 전에는 다음 주 결산에서 철회를 처리합니다. 출항 뒤에는 안전한 귀환항을 찾아 실제 귀환 시간이 소요됩니다. 상륙으로 이미 확보한 영토를 자동으로 원상복구하지 않습니다.</p><small>지휘력 {operation.commandCost}·연료 {operation.fuelCost}는 반환하지 않습니다. 손실 선박도 복구하지 않습니다.</small><div className="st-actions"><button className="st-return" type="button" onClick={() => { if (!getSeaTransportReturnReason(operation, context)) onReturn(operation.id); }}><Undo2 size={17} />철회·귀환 요청 확정</button><button type="button" onClick={() => onSelectionChange({ returnReviewId: null })}>수송 계속</button></div></div>
      : <button type="button" className="st-return" onClick={() => onSelectionChange({ returnReviewId: operation.id })}><Undo2 size={17} />철회·귀환 검토</button>}
  </section>;
}

function RecordDetail({ record, context, onOpenLocation }: { record: SeaTransportRecord; context: SeaTransportContext; onOpenLocation: (id: string) => void }) {
  const arrival = context.territories.find((territory) => territory.id === record.arrivalId);
  const fleetIds = [...new Set([...(record.escortFleetIds ?? []), ...(record.escortFleetId ? [record.escortFleetId] : [])])];
  return <section className="st-surface" aria-label="선택 수송 확정 보고서">
    <header className="st-surface-heading"><div><span className="st-eyebrow">AFTER ACTION REPORT / 제{record.endedWeek + 1}주 확정</span><h2>{record.divisionName}</h2><small>제{record.startedWeek + 1}주 승인 · 실제 {record.elapsedWeeks}주 소요</small></div><FileText size={25} aria-hidden="true" /></header>
    <span className={`st-outcome${record.outcome === 'transferred' || record.outcome === 'landed' ? '' : ' is-setback'}`}>{outcomeLabels[record.outcome]}</span>
    <RouteCard from={{ id: record.fromId, name: record.fromName }} target={{ id: record.targetId, name: record.targetName }} onOpenLocation={onOpenLocation} />
    <div className="st-notice"><FileCheck2 size={20} aria-hidden="true" /><p>{record.result}</p></div>
    <dl className="st-metrics">
      <div><dt>누적 소비 지휘력 / 연료</dt><dd>{record.commandCost} / {record.fuelCost}</dd><small>수송·호위·구조 총액 · 반환 없음</small></div>
      <div><dt>수송선 반환 / 손실</dt><dd>{record.convoysReturned} / {record.convoysLost}척</dd><small>구조선 포함 누적 투입 {record.convoysReserved}척</small></div>
      <div><dt>병력 / 조직력 손실</dt><dd>{number(record.strengthLoss)} / {number(record.organizationLoss)}</dd><small>인원 수가 아닌 게임 지수 감소</small></div>
    </dl>
    <section className="st-escort-detail" aria-label="호위·구조 확정 결산"><h3>호위와 구조의 대가</h3><dl className="st-support-totals"><div><dt>지정 호위 함대</dt><dd>{record.escortFleetName ?? record.escortFleetId ?? '지정 호위 없음'}</dd><small>호위 함정 누적 손실 {number(record.escortShipsLost ?? 0)}척 · 수송선 손실과 별도</small></div><div><dt>구조 출동</dt><dd>{record.rescueDispatches ?? 0}회</dd><small>구조 실패·재출동 비용도 위 누적 총액에 남습니다.</small></div></dl></section>
    <EscortReliefHistory records={record.escortReliefHistory} />
    {fleetIds.length > 1 || record.airGroupIds?.length ? <section className="st-escort-detail"><h3>최종 호위 편성 기록</h3><ul className="st-log">{fleetIds.map((id) => <li key={id}>{context.jointForces.fleets.find((fleet) => fleet.id === id)?.name ?? id}</li>)}{record.airGroupIds?.map((id, index) => <li key={id}>{record.airGroupNames?.[index] ?? id} · 항공 엄호</li>)}</ul><p>항공기 누적 손실 {number(record.aircraftLost ?? 0)}대. 수송 완료와 함대 복귀 완료는 별개이며 귀항·급유 현황은 해군 전력 관리에서 확인합니다.</p></section> : null}
    <div><h3>확정 도착지 · {arrival?.name ?? record.arrivalId}</h3><p>{record.arrivalId !== record.targetId ? '원래 목적지가 아닌 귀환·대체 거점에 도착했습니다.' : '작전 보고서에 기록된 실제 도착지입니다.'}</p>{arrival ? <><small>현재 지도 상태: {controlLabel(arrival.controller, context.playerFaction)} · 거점 보급 {number(arrival.supply)}. 종료 이후의 변화가 반영된 값이며 당시 보고서 수치와는 다릅니다.</small><div className="st-actions"><button type="button" onClick={() => onOpenLocation(arrival.id)}><MapPin size={16} />실제 도착지 보기</button></div></> : null}</div>
  </section>;
}

export function SeaTransportBoardView(props: SeaTransportBoardViewProps) {
  const { state, context, selection, onSelectionChange } = props;
  const operation = state.operations.find((item) => item.id === selection.operationId) ?? state.operations[0];
  const records = [...state.records].sort((a, b) => b.endedWeek - a.endedWeek);
  const record = records.find((item) => item.id === selection.recordId) ?? records[0];
  return <div className="sea-transport-board command-edition" data-sea-workspace={selection.workspace}>
    <header className="st-header"><div><span className="st-eyebrow">SEA LIFT COMMAND / 제{context.week + 1}주</span><h1>해상 수송·상륙 본부</h1><p>병력을 바다 건너 보내고, 마지막 보급까지 지휘합니다.</p></div><div className="st-header-mark"><Anchor size={32} aria-hidden="true" /></div></header>
    <nav className="st-workspaces" aria-label="해상 수송 업무">
      <button type="button" aria-pressed={selection.workspace === 'plan'} onClick={() => onSelectionChange({ workspace: 'plan' })}><FileCheck2 size={20} aria-hidden="true" /><span><strong>수송 계획</strong><small>부대·목적지 → 검토 → 승인</small></span></button>
      <button type="button" aria-pressed={selection.workspace === 'active'} onClick={() => onSelectionChange({ workspace: 'active' })}><Ship size={20} aria-hidden="true" /><span><strong>진행 중</strong><small>{state.operations.length}개 수송 · 항해·상륙·보급</small></span></button>
      <button type="button" aria-pressed={selection.workspace === 'history'} onClick={() => onSelectionChange({ workspace: 'history' })}><FileText size={20} aria-hidden="true" /><span><strong>확정 보고서</strong><small>{state.records.length}개 결과 · 비용·손실·도착지</small></span></button>
    </nav>
    {context.processingWeek ? <div className="st-notice st-warning" role="status"><Clock3 size={19} aria-hidden="true" /><p>주간 결산 중입니다. 계획은 열람할 수 있지만 새 승인·철회 요청은 잠시 중지됩니다.</p></div> : null}
    {selection.workspace === 'plan' ? <Planning {...props} /> : selection.workspace === 'active' ? operation ? <div className="st-layout">
      <aside className="st-surface"><header><span className="st-eyebrow">UNDER WAY</span><h2>진행 중인 수송</h2></header><div className="st-choice-list" role="group" aria-label="진행 수송 선택">{state.operations.map((item) => <button key={item.id} type="button" aria-pressed={operation.id === item.id} onClick={() => onSelectionChange({ operationId: item.id, returnReviewId: null, rescueReviewedSignature: null, escortReliefReviewedSignature: null, rescueEscortFleetId: undefined, escortReliefFleetId: undefined })}><strong>{item.divisionName}</strong><small>{item.fromName} → {item.targetName}</small><small>{seaTransportStageLabels[item.stage]} · {item.elapsedWeeks}주 경과</small>{item.pendingEscortRelief ? <small>호위 합류 대기 · {item.pendingEscortRelief.fleetName}</small> : null}</button>)}</div></aside>
      <ActiveOperation operation={operation} {...props} />
    </div> : <section className="st-empty"><h2>진행 중인 수송이 없습니다</h2><p>계획 검토 뒤 승인하면 여기에 승선·항해·상륙 진행이 나타납니다. 완료된 명령은 확정 보고서에 남습니다.</p><div className="st-actions"><button type="button" onClick={() => onSelectionChange({ workspace: 'plan' })}>수송 계획으로</button>{state.records.length ? <button type="button" onClick={() => onSelectionChange({ workspace: 'history' })}>확정 보고서 보기</button> : null}</div></section>
      : record ? <div className="st-layout"><aside className="st-surface"><header><span className="st-eyebrow">ARCHIVE</span><h2>종료된 수송 기록</h2></header><div className="st-choice-list" role="group" aria-label="수송 보고서 선택">{records.map((item) => <button key={item.id} type="button" aria-pressed={item.id === record.id} onClick={() => onSelectionChange({ recordId: item.id })}><strong>{item.divisionName}</strong><small>{item.targetName} · {outcomeLabels[item.outcome]}</small><small>제{item.endedWeek + 1}주 · {item.elapsedWeeks}주 소요</small></button>)}</div></aside><RecordDetail record={record} context={context} onOpenLocation={props.onOpenLocation} /></div>
        : <section className="st-empty"><h2>아직 확정된 수송 보고서가 없습니다</h2><p>수송·상륙·귀환이 종료되면 실제 도착지, 소비 비용과 손실을 같은 화면에서 확인할 수 있습니다. 전망을 확정 결과처럼 기록하지 않습니다.</p></section>}
  </div>;
}
