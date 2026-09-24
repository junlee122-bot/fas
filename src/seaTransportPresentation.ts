import { getFleetNavigationSummary } from './navalNavigation';
import { getSiteMilitaryAccess } from './militaryAccess';
import { getSeaTransportAssignedFleetIds, getSeaTransportCurrentPositionId, seaTransportStageLabels } from './seaTransport';
import type { SeaTransportContext, SeaTransportOperation, SeaTransportOutcome, SeaTransportRecord, SeaTransportState } from './seaTransport';
import type { NationId } from './types';

export interface SeaTransportPresentationPoint { id: string; name: string }
export interface SeaTransportPresentationStep { id: string; label: string; status: 'complete' | 'current' | 'pending'; detail: string }
export interface SeaTransportPresentationEscort {
  id: string; name: string; label: string; position: string; destination: string; detail: string;
  remainingWeeks: number | null; mode: string;
}
export interface SeaTransportPresentationRow {
  id: string; kind: 'operation' | 'record'; operationId: string; divisionName: string;
  stage: string; stageLabel: string; outcome?: SeaTransportOutcome; week: number;
  from: SeaTransportPresentationPoint; target: SeaTransportPresentationPoint;
  arrival: SeaTransportPresentationPoint | null; location: SeaTransportPresentationPoint; locationLabel: string;
  steps: SeaTransportPresentationStep[]; statusText: string; lastMessage: string;
  /** Conditional minimum for the CURRENT stage, never a whole-mission arrival promise. */
  remainingWeeks: number | null; attention: boolean; attentionReason: string | null;
  escorts: SeaTransportPresentationEscort[]; supportSummary: string;
  canCommand: boolean; nextActionLabel: string;
  convoysRemaining: number; convoysReserved: number; convoysLost: number;
}
export interface SeaTransportPresentation {
  operations: SeaTransportPresentationRow[]; records: SeaTransportPresentationRow[]; unavailableReason: string | null;
}
export interface SeaTransportPresentationSelection { nationId: NationId; id: string }

const finite = (value: number) => Number.isFinite(value) && value >= 0;
const outcomeLabels: Record<SeaTransportOutcome, string> = {
  transferred: '하선·재편 완료', landed: '교두보 인계 완료', recalled: '철회·귀환 완료',
  'failed-landing': '상륙 중단·철수 완료', diverted: '목적 변경·재편 완료',
};

function point(context: SeaTransportContext, id: string, fallback?: string): SeaTransportPresentationPoint {
  return { id, name: context.territories.find((site) => site.id === id)?.name ?? fallback ?? '위치 자료 미확인' };
}

function validRescue(operation: SeaTransportOperation) {
  const rescue = operation.rescue;
  return !!rescue && !!rescue.baseId && !!rescue.baseName && Array.isArray(rescue.routeIds) && rescue.routeIds.length >= 2
    && rescue.routeIds[0] === rescue.baseId && rescue.routeIds.every((id) => typeof id === 'string' && id.length > 0)
    && [rescue.dispatchedWeek, rescue.outboundWeeks, rescue.returnWeeks, rescue.attempt].every(finite);
}

function attentionReason(operation: SeaTransportOperation, context: SeaTransportContext): string | null {
  const division = context.divisions.find((item) => item.id === operation.divisionId);
  if (!division) return '부대 자료를 확인할 수 없어 자동 이동·환급이 보류됩니다.';
  if (operation.stage === 'rescuing' && !validRescue(operation)) return '구조 접근 자료를 확인할 수 없습니다. 저장 자료 점검이 필요합니다.';
  if (operation.stage === 'waiting-return') return operation.convoysRemaining <= 0
    ? '잔존 수송선이 없어 구조선 파견 검토가 필요합니다. 부대 이동·자원 환급은 아직 없습니다.'
    : '안전한 귀환항·육군 접근권을 다음 주에 다시 확인합니다. 귀환 완료가 아닙니다.';
  if (operation.returnRequestedWeek !== undefined && !['returning', 'rescuing'].includes(operation.stage)) return '철회 요청 접수 상태입니다. 다음 주 결산에서 귀환 경로를 확인하며 즉시 이동하지 않습니다.';
  if (operation.convoysRemaining <= 0 && operation.stage !== 'embarking') return '수송선을 모두 잃었습니다. 다음 결산에서 구조·귀환 상태를 확인해야 합니다.';
  // Rescue approach is independent of the abandoned offensive destination; the engine
  // checks a safe return port only after pickup. Do not invent a hold from that old target.
  if (operation.stage === 'rescuing') return operation.rescue!.dispatchedWeek > context.week ? '구조 파견 주차가 현재보다 미래입니다. 저장 자료를 점검하세요.' : null;
  const origin = context.territories.find((site) => site.id === operation.fromId);
  const target = context.territories.find((site) => site.id === (operation.stage === 'returning' ? operation.returnTargetId : operation.targetId));
  const access = context.militaryAccess ? { ...context.militaryAccess, week: context.week } : undefined;
  if (operation.stage === 'embarking') {
    if (division.territoryId !== operation.fromId) return '부대가 승인된 출발지를 이탈했습니다. 실제 위치를 다음 결산에서 재검토합니다.';
    if (!origin || origin.controller !== operation.playerFaction) return '출발지 통제를 확인할 수 없어 승선이 보류됩니다.';
    if (access && !getSiteMilitaryAccess(origin, 'land-departure', access).allowed) return '출발지의 육군 출발 권한이 없어 승선이 보류됩니다.';
  }
  if (!target || target.controller === 'neutral') return '목적지 통제가 바뀌었거나 자료가 없습니다. 다음 결산에서 안전한 이동을 재검토합니다.';
  if ((operation.stage === 'returning' || operation.mode === 'transfer' || operation.stage === 'beachhead') && target.controller !== operation.playerFaction)
    return '목적지의 우호 통제를 잃었습니다. 다음 결산에서 귀환·철수 경로를 재검토합니다.';
  if (access && target.controller === operation.playerFaction && !getSiteMilitaryAccess(target, 'transit', access).allowed)
    return '목적지의 육군 접근권이 없습니다. 해군 기지 사용권만으로 부대가 하선하지 않습니다.';
  if (access && operation.stage !== 'returning' && operation.mode === 'landing' && !operation.landingCaptured && !getSiteMilitaryAccess(origin, 'offensive', access).allowed)
    return '상륙 공격 출발 권한이 종료되었습니다. 다음 결산에서 추가 상륙 대신 안전한 철수를 검토합니다.';
  if (context.phase !== 'war' && target.controller !== operation.playerFaction) return '전쟁 종료 후 적대 상륙을 계속하지 않습니다. 다음 결산에서 귀환 경로를 확인합니다.';
  return null;
}

function stageRemaining(operation: SeaTransportOperation, attention: string | null): number | null {
  if (attention || operation.stage === 'waiting-return') return null;
  const duration = operation.stage === 'returning' ? Math.max(2, operation.returnWeeks ?? 2)
    : operation.stage === 'rescuing' ? Math.max(2, operation.rescue?.outboundWeeks ?? 2)
      : operation.stage === 'disembarking' ? 1
        : Math.max(operation.stage === 'embarking' ? 1 : 2, operation.phaseWeeks[operation.stage]);
  // Even a fully consumed legacy counter still needs one real weekly settlement.
  return finite(duration) && finite(operation.stageWeeks) ? Math.max(1, Math.ceil(duration - operation.stageWeeks)) : null;
}

function steps(operation: SeaTransportOperation, remaining: number | null, friendlyArrival: boolean): SeaTransportPresentationStep[] {
  const emergency = ['returning', 'waiting-return', 'rescuing'].includes(operation.stage);
  const ids = emergency ? [operation.stage, 'safe-arrival']
    : friendlyArrival && operation.stage === 'landing' ? ['embarking', 'sailing', 'landing', 'disembarking', 'handover']
    : friendlyArrival ? ['embarking', 'sailing', 'disembarking', 'handover']
    : operation.stage === 'disembarking' || operation.mode === 'transfer' ? ['embarking', 'sailing', 'disembarking', 'handover']
      : ['embarking', 'sailing', 'landing', 'beachhead', 'handover'];
  const current = ids.indexOf(operation.stage);
  return ids.map((id, index) => ({ id, label: id === 'safe-arrival' ? '안전한 육지 도착·재편' : id === 'handover' ? '육상 지휘권 인계' : seaTransportStageLabels[id as keyof typeof seaTransportStageLabels],
    status: index < current ? 'complete' : index === current ? 'current' : 'pending',
    detail: index < current ? '현재 작전 단계 이전의 절차'
      : index === current ? remaining === null ? '상황 재검토 필요 · 완료 시점 미정' : `현재 단계 최소 ${remaining}회 주간 결산 · 상황에 따라 연장`
        : id === 'handover' || id === 'safe-arrival' ? '부대 인계가 끝나도 호위함대 귀항·급유는 별도입니다.' : '아직 완료하지 않은 다음 단계',
  }));
}

function escorts(source: SeaTransportOperation | SeaTransportRecord, context: SeaTransportContext, record = false): SeaTransportPresentationEscort[] {
  const ids = [...new Set([...getSeaTransportAssignedFleetIds(source), ...('pendingEscortRelief' in source && source.pendingEscortRelief ? [source.pendingEscortRelief.fleetId] : []),
    ...(source.escortReliefHistory ?? []).flatMap((relief) => relief.previousFleetId ? [relief.previousFleetId] : [])])];
  return ids.map((id) => {
    const fleet = context.jointForces.nationId === context.nationId ? (context.jointForces.fleets ?? []).find((item) => item.id === id) : undefined;
    const pending = 'pendingEscortRelief' in source && source.pendingEscortRelief?.fleetId === id;
    const fallback = source.escortFleetId === id ? source.escortFleetName : pending && 'pendingEscortRelief' in source ? source.pendingEscortRelief?.fleetName : undefined;
    if (!fleet) return { id, name: fallback ?? id, label: '현재 함대 자료 미확인', position: '위치 자료 미확인', destination: '', detail: '다른 국가의 함대를 가져오거나 복귀를 가정하지 않습니다.', remainingWeeks: null, mode: 'unknown' };
    if (!fleet.navigation) return { id, name: fleet.name, label: '항해 좌표 미확인', position: fleet.location, destination: '', detail: '과거 배속만으로 현재 이동·귀항 완료를 추정하지 않습니다.', remainingWeeks: null, mode: 'unknown' };
    const summary = getFleetNavigationSummary(fleet);
    const ownAssignment = fleet.assignmentId === ('operationId' in source ? source.operationId : source.id);
    const anotherAssignment = !!fleet.assignmentId && !ownAssignment && !fleet.assignmentId.startsWith('nav-return-');
    return { id, name: fleet.name, label: `${pending ? '합류 예정 · ' : ''}${anotherAssignment ? '다른 임무 · ' : ''}${summary.label}`,
      position: summary.position, destination: summary.destination, detail: `${record ? '당시 호위함대의 현재 상태이며 과거 도착 기록과 별개입니다. ' : ''}${summary.detail}`,
      remainingWeeks: summary.arrivalWeeks > 0 ? summary.arrivalWeeks : null, mode: fleet.navigation.mode };
  });
}

/** Read-only projection: no clocks, movement, normalization, commands or save writes. */
export function buildSeaTransportPresentation(state: SeaTransportState, context: SeaTransportContext): SeaTransportPresentation {
  if (!finite(context.week) || (state.lastProcessedWeek !== undefined && (!finite(state.lastProcessedWeek) || state.lastProcessedWeek > context.week)))
    return { operations: [], records: [], unavailableReason: '현재 주차와 해상 수송 결산 자료가 맞지 않습니다. 미래 진행을 현재 상태로 표시하지 않습니다.' };
  const operations = state.operations.filter((operation) => operation.nationId === context.nationId && operation.playerFaction === context.playerFaction
    && finite(operation.startedWeek) && operation.startedWeek <= context.week && operation.stage in seaTransportStageLabels).map((operation): SeaTransportPresentationRow => {
    const reason = attentionReason(operation, context);
    const friendlyArrival = !operation.landingCaptured && ['embarking', 'sailing', 'landing'].includes(operation.stage)
      && context.territories.some((site) => site.id === operation.targetId && site.controller === operation.playerFaction);
    // The engine converts an already-friendly landing target before checking the
    // combat-duration threshold. This takes one settlement, not the old combat ETA.
    const remaining = !reason && friendlyArrival && operation.stage === 'landing' ? 1 : stageRemaining(operation, reason);
    const division = context.divisions.find((item) => item.id === operation.divisionId);
    const canCommand = !!division && context.commandableDivisionIds.has(operation.divisionId) && !context.processingWeek;
    const arrivalId = operation.stage === 'returning' ? operation.returnTargetId : undefined;
    // Embarkation and bridgehead defenders still occupy real land. A retreat before
    // settlement must not display them back at an outdated planned port.
    const landPosition = division && ['embarking', 'beachhead'].includes(operation.stage) ? division.territoryId : undefined;
    return { id: operation.id, kind: 'operation', operationId: operation.id, divisionName: operation.divisionName,
      stage: operation.stage, stageLabel: seaTransportStageLabels[operation.stage], week: operation.startedWeek,
      from: point(context, operation.fromId, operation.fromName), target: point(context, operation.targetId, operation.targetName),
      arrival: arrivalId ? point(context, arrivalId) : null,
      location: point(context, landPosition ?? getSeaTransportCurrentPositionId(operation)),
      locationLabel: landPosition ? '부대의 실제 육상 위치' : operation.stage === 'rescuing' ? '구조선 접근 구역 · 부대 승선 전' : operation.stage === 'waiting-return' ? '대기 작전 구역 · 정확한 표류 좌표 아님' : '엔진상 작전 구역 · 정확한 선박 좌표 아님',
      steps: steps(operation, remaining, friendlyArrival), statusText: reason ?? (friendlyArrival && operation.stage === 'landing' ? '목적지가 우호 통제로 바뀌었습니다. 다음 주 결산에서 상륙 교전 대신 하선·재편으로 전환하며, 육상 지휘권 인계는 그다음 절차입니다.' : operation.stage === 'beachhead' ? '점령 후 보급 유지와 육상 지휘권 인계가 남아 있습니다.' : operation.stage === 'rescuing' ? '구조선이 접근 중입니다. 부대 승선·귀환·환급은 아직 완료되지 않았습니다.' : '주간 결산에서만 다음 단계로 진행합니다.'),
      lastMessage: operation.lastMessage, remainingWeeks: remaining, attention: !!reason, attentionReason: reason,
      escorts: escorts(operation, context), supportSummary: `호위함대 이동·합류·귀항은 부대 수송 단계와 별도입니다.${operation.airGroupIds?.length ? ` 항공 지원 ${operation.airGroupIds.length}개 부대는 현장 반경·기지 권한에 따라 적용됩니다.` : ''}`,
      canCommand, nextActionLabel: canCommand ? operation.stage === 'waiting-return' ? '구조·귀환 검토' : '수송 지휘 화면 열기' : '수송 상황 열람',
      convoysRemaining: operation.convoysRemaining, convoysReserved: operation.convoysReserved, convoysLost: Math.max(0, operation.convoysReserved - operation.convoysRemaining),
    };
  }).sort((a, b) => Number(b.attention) - Number(a.attention) || b.week - a.week || a.id.localeCompare(b.id));
  const ownDivisionIds = new Set(context.divisions.map((division) => division.id));
  const records = state.records.filter((record) => {
    // New operation IDs encode issuing nation (launchSeaTransport). Never let a shared unit ID override explicit foreign provenance.
    const issuingNation = /^sea-([a-z]+)-\d+-/.exec(record.operationId)?.[1];
    return (issuingNation ? issuingNation === context.nationId : ownDivisionIds.has(record.divisionId))
      && finite(record.startedWeek) && finite(record.endedWeek) && record.startedWeek <= record.endedWeek && record.endedWeek <= context.week
      && record.outcome in outcomeLabels;
  }).map((record): SeaTransportPresentationRow => {
    // Completed receipts keep the names saved at that date. A present-day city
    // rename must not rewrite a historical port of departure or arrival.
    const historicalPoint = (id: string, savedName?: string): SeaTransportPresentationPoint => ({ id,
      name: savedName || `${point(context, id).name} (현재 지명)` });
    const from = historicalPoint(record.fromId, record.fromName);
    const target = historicalPoint(record.targetId, record.targetName);
    const arrival = record.arrivalId === record.targetId ? target : record.arrivalId === record.fromId ? from : historicalPoint(record.arrivalId);
    return { id: record.id, kind: 'record', operationId: record.operationId, divisionName: record.divisionName,
      stage: 'completed', stageLabel: outcomeLabels[record.outcome], outcome: record.outcome, week: record.endedWeek,
      from, target, arrival, location: arrival,
      locationLabel: `제${record.endedWeek + 1}주 부대 도착 기록 · 현재 주둔 위치와 다를 수 있음`,
      steps: [{ id: 'result', label: outcomeLabels[record.outcome], status: 'complete', detail: '부대 수송 결과만 확정되었습니다. 호위함대의 현재 귀항·급유 상태는 별도로 확인하세요.' }],
      statusText: `제${record.endedWeek + 1}주 ${arrival.name}에서 수송 종료`, lastMessage: record.result, remainingWeeks: null,
      attention: false, attentionReason: null, escorts: escorts(record, context, true), supportSummary: '부대 수송 종료는 호위함대 귀항 완료나 즉시 재배치를 의미하지 않습니다.',
      canCommand: false, nextActionLabel: '수송 결과 열람', convoysRemaining: record.convoysReturned, convoysReserved: record.convoysReserved, convoysLost: record.convoysLost,
    };
  }).sort((a, b) => b.week - a.week || a.id.localeCompare(b.id));
  return { operations, records, unavailableReason: null };
}

/** Explicit stale selections never silently select a different commandable voyage. */
export function resolveSeaTransportSelection(model: SeaTransportPresentation, selection: SeaTransportPresentationSelection | null, nationId: NationId): SeaTransportPresentationRow | null {
  if (selection && selection.nationId !== nationId) return null;
  const rows = [...model.operations, ...model.records];
  return selection ? rows.find((row) => row.id === selection.id) ?? null : rows[0] ?? null;
}
