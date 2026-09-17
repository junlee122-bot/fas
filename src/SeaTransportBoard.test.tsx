import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  createInitialSeaTransportSelection, createSeaTransportCommandGuard, getSeaTransportBoardPlan, getSeaTransportBoardRescue, getSeaTransportBoardEscortRelief,
  getSeaTransportDivisionReason, getSeaTransportRemainingWeeks, getSeaTransportReturnReason,
  getSeaTransportStages, SeaTransportBoard, SeaTransportBoardView,
  type SeaTransportBoardProps, type SeaTransportSelection,
} from './SeaTransportBoard';
import { createSeaTransportState, dispatchSeaTransportEscortRelief, forecastSeaTransport, forecastSeaTransportEscortRelief, forecastSeaTransportRescue, getSeaTransportEscortOptions, launchSeaTransport, launchSeaTransportRescue, type SeaTransportContext, type SeaTransportPlan } from './seaTransport';
import { createJointForcesState } from './jointOperations';
import type { Territory } from './types';

const site = (id: string, overrides: Partial<Territory> = {}): Territory => ({ id, name: id, region: '시험 전구', x: 0, y: 0, controller: 'allies', value: 5, supply: 35, terrain: '해안', siteType: 'port', neighbors: [], theater: 'europe', ...overrides });
const initialPlan: SeaTransportPlan = { divisionId: 'marine', fromId: 'britain', targetId: 'normandy' };
function makeContext(): SeaTransportContext {
  return {
    week: 0, nationId: 'britain', playerFaction: 'allies', phase: 'war', processingWeek: false,
    divisions: [{ id: 'marine', name: '상륙사단', type: 'marine', territoryId: 'britain', status: 'ready', strength: 95, organization: 95, supply: 95, experience: 60, commanderId: 'general' }],
    territories: [site('britain', { name: '영국 출발항', neighbors: ['normandy', 'belfast', 'channel', 'liverpool'] }), site('normandy', { name: '노르망디 해안', neighbors: ['britain', 'channel'], controller: 'axis' }), site('belfast', { name: '벨파스트', neighbors: ['britain'] }), site('channel', { name: '영불해협', siteType: 'sea', neighbors: ['britain', 'normandy', 'neutral-harbor'] }), site('neutral-harbor', { name: '중립항', controller: 'neutral', neighbors: ['channel'] }), site('liverpool', { name: '리버풀', neighbors: ['britain'] })],
    commandableDivisionIds: new Set(['marine']), orders: [],
    game: { week: 0, manpower: 400, politicalPower: 100, fuel: 100, steel: 50, factories: 10, stability: 70, warSupport: 70, commandPoints: 100, treasury: 100, victoryScore: 0, airPower: 80, navalPower: 80, intelNetwork: 60, enemyPressure: 50 },
    stockpile: { infantryEquipment: 100, tanks: 10, aircraft: 10, convoys: 100, artillery: 20, trucks: 10 },
    jointForces: createJointForcesState('britain'),
  };
}
function props(): SeaTransportBoardProps {
  return { state: createSeaTransportState(), context: makeContext(), initialPlan, onLaunch: vi.fn(), onReturn: vi.fn(), onRescue: vi.fn(), onEscortRelief: vi.fn(), onOpenLocation: vi.fn() };
}
function render(input: SeaTransportBoardProps, patch: Partial<SeaTransportSelection> = {}) {
  const selection = { ...createInitialSeaTransportSelection(input), ...patch };
  return renderToStaticMarkup(<SeaTransportBoardView {...input} selection={selection} onSelectionChange={vi.fn()} />);
}

describe('transport draft and shared forecast', () => {
  it('applies a map draft on initial mount without approving or spending', () => {
    const input = props(); const before = structuredClone({ game: input.context.game, stockpile: input.context.stockpile, state: input.state });
    const html = renderToStaticMarkup(<SeaTransportBoard {...input} />);
    expect(html).toContain('노르망디 해안'); expect(html).toContain('명령 검토하기');
    expect(html).not.toContain('비용을 지불하고 수송 승인');
    expect(input.onLaunch).not.toHaveBeenCalled(); expect(input.onReturn).not.toHaveBeenCalled();
    expect({ game: input.context.game, stockpile: input.context.stockpile, state: input.state }).toEqual(before);
  });
  it('has no implicit target when entered without a map request', () => {
    const input = props(); delete input.initialPlan;
    const selection = createInitialSeaTransportSelection(input);
    expect(selection.plan).toEqual({ divisionId: 'marine', fromId: 'britain', targetId: '' });
    expect(getSeaTransportBoardPlan(input.state, input.context, selection.plan).canReview).toBe(false);
  });
  it('respects an app-owned draft and workspace after a map round trip', () => {
    const input = props(); const selection = { ...createInitialSeaTransportSelection(input), workspace: 'history' as const, plan: { ...initialPlan, targetId: 'belfast' } };
    const onSelectionChange = vi.fn();
    const html = renderToStaticMarkup(<SeaTransportBoard {...input} selection={selection} onSelectionChange={onSelectionChange} />);
    expect(html).toContain('data-sea-workspace="history"');
    expect(html).toContain('아직 확정된 수송 보고서가 없습니다');
    expect(selection.plan.targetId).toBe('belfast');
    expect(onSelectionChange).not.toHaveBeenCalled(); expect(input.onLaunch).not.toHaveBeenCalled();
  });
  it('reuses engine costs, phases, route and validation instead of a UI estimate', () => {
    const input = props(); const model = getSeaTransportBoardPlan(input.state, input.context, initialPlan);
    expect(model.forecast).toEqual(forecastSeaTransport(input.state, initialPlan, input.context));
    expect(model.forecast.minimumWeeks).toBe(7);
    expect(model.destinations.map((item) => item.id)).toEqual(['normandy', 'belfast', 'neutral-harbor']);
    expect(model.destinations.some((item) => item.siteType === 'sea')).toBe(false);
  });
  it('exposes neutral destinations honestly but cannot approve them', () => {
    const input = props(); const plan = { ...initialPlan, targetId: 'neutral-harbor' };
    const model = getSeaTransportBoardPlan(input.state, input.context, plan);
    expect(model.canReview).toBe(false); expect(model.forecast.reason).toContain('중립');
    const html = render(input, { plan }); expect(html).toContain('중립 · 승인 불가');
    expect(html).toMatch(/disabled=""[^>]*>.*?명령 검토하기/s);
  });
  it('retains a missing or moved draft rather than silently selecting a replacement', () => {
    const input = props(); input.initialPlan = { ...initialPlan, divisionId: 'missing' };
    expect(createInitialSeaTransportSelection(input).plan.divisionId).toBe('missing');
    expect(render(input)).toContain('초안의 부대를 현재 자료에서 찾을 수 없습니다');
    input.initialPlan = initialPlan;
    input.context.divisions = [{ ...input.context.divisions[0], territoryId: 'belfast' }];
    expect(getSeaTransportBoardPlan(input.state, input.context, initialPlan).canReview).toBe(false);
  });
  it('preserves the same draft across later weeks but invalidates its prior review', () => {
    const input = props(); const reviewedSignature = getSeaTransportBoardPlan(input.state, input.context, initialPlan).signature;
    const context = { ...input.context, week: 1 };
    const model = getSeaTransportBoardPlan(input.state, context, initialPlan);
    expect(model.signature).not.toBe(reviewedSignature); expect(initialPlan.targetId).toBe('normandy');
    const html = render({ ...input, context }, { reviewedSignature });
    expect(html).toContain('초안은 유지했습니다'); expect(html).not.toContain('비용을 지불하고 수송 승인');
  });
  it('requires re-review when resource pool or authority changes in the same week', () => {
    const input = props(); const previous = getSeaTransportBoardPlan(input.state, input.context, initialPlan);
    const reduced = { ...input.context, stockpile: { ...input.context.stockpile, convoys: 0 } };
    const model = getSeaTransportBoardPlan(input.state, reduced, initialPlan);
    expect(model.signature).not.toBe(previous.signature); expect(model.canReview).toBe(false);
    const authority = getSeaTransportBoardPlan(input.state, { ...input.context, commandableDivisionIds: new Set() }, initialPlan);
    expect(authority.signature).not.toBe(previous.signature); expect(authority.canReview).toBe(false);
  });
  it('renders explicit final approval only after current forecast review', () => {
    const input = props(); const model = getSeaTransportBoardPlan(input.state, input.context, initialPlan);
    const html = render(input, { reviewedSignature: model.signature });
    expect(html).toContain('최종 승인'); expect(html).toContain('비용을 지불하고 수송 승인');
    expect(html).toContain('수송선 24척을 예약'); expect(html).toContain('지휘력 10');
    expect(input.onLaunch).not.toHaveBeenCalled();
  });
  it('distinguishes friendly transport from assault without implying guaranteed safety', () => {
    const input = props(); const plan = { ...initialPlan, targetId: 'belfast' };
    input.context.phase = 'nation'; const model = getSeaTransportBoardPlan(input.state, input.context, plan);
    expect(model.canReview).toBe(true); expect(model.forecast.minimumWeeks).toBe(4);
    const html = render(input, { plan }); expect(html).toContain('아군 수송:'); expect(html).toContain('무손실 도착을 보장하지 않습니다');
    expect(html).not.toContain('상륙 성공 전망 100%');
    expect(getSeaTransportStages('transfer', model.forecast.phaseWeeks).map((phase) => phase.stage)).toEqual(['embarking', 'sailing', 'disembarking']);
  });
  it('explains no maritime connection at an inland departure', () => {
    const input = props(); input.context.divisions = [{ ...input.context.divisions[0], territoryId: 'liverpool' }];
    const html = render(input, { plan: { ...initialPlan, fromId: 'liverpool', targetId: '' } });
    expect(html).toContain('이 출발지에는 해상 수송 경로가 없습니다');
    expect(html).not.toContain('비용을 지불하고 수송 승인');
  });
  it('offers no commandable unit outside role authority', () => {
    const input = props(); input.context.commandableDivisionIds = new Set(); delete input.initialPlan;
    expect(createInitialSeaTransportSelection(input).plan.divisionId).toBe('');
    expect(render(input)).toContain('직접 지휘할 부대가 없습니다');
    expect(getSeaTransportDivisionReason(input.state, input.context.divisions[0], input.context)).toBe('직접 지휘 범위 밖');
  });
  it('marks existing sea assignment or land order unavailable for duplicate unit assignment', () => {
    const input = props(); const launched = launchSeaTransport(input.state, initialPlan, input.context);
    expect(getSeaTransportDivisionReason(launched.state, input.context.divisions[0], input.context)).toContain('수송 배속');
    const context = { ...input.context, orders: [{ ...initialPlan, startedWeek: 0 }] };
    expect(getSeaTransportDivisionReason(input.state, context.divisions[0], context)).toContain('육상 명령');
  });
});

describe('transport progress and report desk', () => {
  it('shows actual reservation, stage, delay caveat and locked division in progress', () => {
    const input = props(); input.state = launchSeaTransport(input.state, initialPlan, input.context).state;
    const html = render(input, { workspace: 'active' });
    expect(html).toContain('승선 준비'); expect(html).toContain('약 7주 남음');
    expect(html).toContain('24 / 24척'); expect(html).toContain('새 육상 명령에 배속할 수 없습니다');
    expect(html).toContain('철회·귀환 검토'); expect(html).not.toContain('철회·귀환 요청 확정');
  });
  it('derives remaining weeks from engine phase durations and admits unknown returns', () => {
    const input = props(); const operation = launchSeaTransport(input.state, initialPlan, input.context).state.operations[0];
    expect(getSeaTransportRemainingWeeks(operation)).toBe(7);
    expect(getSeaTransportRemainingWeeks({ ...operation, stage: 'sailing', stageWeeks: 1 })).toBe(5);
    expect(getSeaTransportRemainingWeeks({ ...operation, stage: 'beachhead', stageWeeks: 4 })).toBe(0);
    expect(getSeaTransportRemainingWeeks({ ...operation, returnRequestedWeek: 1 })).toBeNull();
    expect(getSeaTransportRemainingWeeks({ ...operation, stage: 'waiting-return' })).toBeNull();
    expect(getSeaTransportRemainingWeeks({ ...operation, stage: 'returning', returnWeeks: 4, stageWeeks: 1 })).toBe(3);
  });
  it('does not expose return approval for foreign or out-of-authority operations', () => {
    const input = props(); input.state = launchSeaTransport(input.state, initialPlan, input.context).state;
    const operation = input.state.operations[0];
    expect(getSeaTransportReturnReason(operation, input.context)).toBeNull();
    input.context = { ...input.context, nationId: 'usa' };
    const html = render(input, { workspace: 'active', returnReviewId: operation.id });
    expect(html).toContain('직접 지휘할 수 없는 수송'); expect(html).not.toContain('철회·귀환 요청 확정');
  });
  it('explains return loss and delay in a second deliberate confirmation', () => {
    const input = props(); input.state = launchSeaTransport(input.state, initialPlan, input.context).state;
    const html = render(input, { workspace: 'active', returnReviewId: input.state.operations[0].id });
    expect(html).toContain('철회·귀환 요청 확정'); expect(html).toContain('실제 귀환 시간이 소요');
    expect(html).toContain('손실 선박도 복구하지 않습니다'); expect(input.onReturn).not.toHaveBeenCalled();
  });
  it('explains waiting return instead of inventing a progress percentage', () => {
    const input = props(); input.state = launchSeaTransport(input.state, initialPlan, input.context).state;
    input.state.operations[0] = { ...input.state.operations[0], stage: 'waiting-return', convoysRemaining: 0, lastMessage: '구조·대체 수송 대기' };
    const html = render(input, { workspace: 'active' });
    expect(html).toContain('종료 시점 재확인 중'); expect(html).toContain('안전한 귀환항이나 수송 능력이 확보될 때까지 대기');
    expect(html).not.toContain('철회·귀환 검토');
  });
  it('shows the actual disembarkation stage when an assault destination turns friendly', () => {
    const input = props(); input.state = launchSeaTransport(input.state, initialPlan, input.context).state;
    input.state.operations[0] = { ...input.state.operations[0], stage: 'disembarking', phaseWeeks: { ...input.state.operations[0].phaseWeeks, disembarking: 1 } };
    const html = render(input, { workspace: 'active' });
    expect(html).toContain('하선·재편'); expect(html).toContain('0/1주 진행');
    expect(html).toContain('aria-current="step"');
  });
  it('separates recorded destination and costs from the current map state', () => {
    const input = props(); input.state.records = [{ id: 'report-1', operationId: 'operation-1', divisionId: 'marine', divisionName: '상륙사단', fromId: 'britain', targetId: 'normandy', fromName: '영국 출발항', targetName: '노르망디 해안', startedWeek: 0, endedWeek: 8, elapsedWeeks: 8, outcome: 'failed-landing', arrivalId: 'belfast', convoysReserved: 24, convoysReturned: 21, convoysLost: 3, strengthLoss: 8, organizationLoss: 12, commandCost: 10, fuelCost: 18, result: '상륙 실패 후 벨파스트에 귀환했습니다. 통제권을 바꾸지 않았습니다.' }];
    const html = render(input, { workspace: 'history' });
    expect(html).toContain('확정 도착지 · 벨파스트'); expect(html).toContain('원래 목적지가 아닌 귀환·대체 거점');
    expect(html).toContain('21 / 3척'); expect(html).toContain('종료 이후의 변화가 반영된 값');
    expect(html).toContain('통제권을 바꾸지 않았습니다');
  });
  it('shows helpful empty active and history workspaces with no synthetic missions', () => {
    const input = props(); expect(render(input, { workspace: 'active' })).toContain('진행 중인 수송이 없습니다');
    expect(render(input, { workspace: 'history' })).toContain('아직 확정된 수송 보고서가 없습니다');
  });
  it('guards duplicate callbacks for the same snapshot without blocking another order', () => {
    const guard = createSeaTransportCommandGuard(); const state = createSeaTransportState(); const action = vi.fn();
    expect(guard(state, 0, 'launch:marine', action)).toBe(true);
    expect(guard(state, 0, 'launch:marine', action)).toBe(false);
    expect(guard(state, 0, 'launch:other', action)).toBe(true);
    expect(guard({ ...state }, 0, 'launch:marine', action)).toBe(true);
    expect(action).toHaveBeenCalledTimes(3);
  });
});

function escortProps(): SeaTransportBoardProps {
  const input = props();
  const fleet = { id: 'named-escort', name: '대서양 호송전대', kind: 'escort' as const, commander: '호위 지휘관', flagship: '호위 기함', location: '리버풀', ships: 12, authorizedShips: 12, readiness: 90, organization: 90, experience: 50, status: 'ready' as const, assignmentId: null, historicalBasis: '자동 검증용 편제' };
  input.context.jointForces.fleets = [fleet, { ...fleet, id: 'refitting', name: '정비 중 함대', status: 'refit' }, { ...fleet, id: 'submarine', name: '잠수함 전대', kind: 'submarine' }];
  return input;
}
function strandedProps(): SeaTransportBoardProps {
  const input = escortProps();
  const launched = launchSeaTransport(input.state, initialPlan, input.context);
  input.state = { ...launched.state, operations: launched.state.operations.map((operation) => ({ ...operation, stage: 'waiting-return', elapsedWeeks: 4, stageWeeks: 1, convoysRemaining: 0, lastMessage: '수송선을 모두 잃어 구조 대기 중입니다.' })) };
  input.context = { ...input.context, week: 4, divisions: launched.divisionUpdates, game: { ...input.context.game, week: 4, commandPoints: 90, fuel: 82 }, stockpile: { ...input.context.stockpile, convoys: 76 } };
  return input;
}

describe('named escort planning and live accounting', () => {
  it('shows shared available and blocked fleet options without reserving on render', () => {
    const input = escortProps(); const options = getSeaTransportEscortOptions(input.state, input.context);
    expect(options.find((option) => option.fleet.id === 'named-escort')?.allowed).toBe(true);
    expect(options.find((option) => option.fleet.id === 'refitting')?.allowed).toBe(false);
    const html = render(input);
    expect(html).toContain('지정 호위 없음'); expect(html).toContain('대서양 호송전대');
    expect(html).toContain('이미 배속·항해·귀항·급유·정비 중'); expect(html).toContain('잠수함·비밀 수송대');
    expect(html).toContain('모항 출발 → 합류 → 엄호 → 귀항 → 재급유');
    expect(input.onLaunch).not.toHaveBeenCalled();
    expect(input.context.jointForces.fleets[0].assignmentId).toBeNull();
  });
  it('includes actual escort costs once and keeps no-escort transport available', () => {
    const input = escortProps(); const selectedPlan = { ...initialPlan, escortFleetId: 'named-escort' };
    const plain = getSeaTransportBoardPlan(input.state, input.context, initialPlan);
    const escorted = getSeaTransportBoardPlan(input.state, input.context, selectedPlan);
    const option = getSeaTransportEscortOptions(input.state, input.context)[0];
    expect(escorted.canReview).toBe(true); expect(plain.canReview).toBe(true);
    expect(escorted.forecast.commandCost).toBe(plain.forecast.commandCost + option.commandCost);
    expect(escorted.forecast.fuelCost).toBe(plain.forecast.fuelCost + escorted.forecast.escorts[0].fuelCost);
    const html = render(input, { plan: selectedPlan });
    expect(html).toContain('위 합계에 포함되어'); expect(html).toContain(`보호 전망 −${escorted.forecast.supportProtection}%p`);
    expect(html).not.toContain('비용을 지불하고 수송 승인');
  });
  it('rejects a stale escort review even if a rounded protection value is unchanged', () => {
    const input = escortProps(); const plan = { ...initialPlan, escortFleetId: 'named-escort' };
    const signature = getSeaTransportBoardPlan(input.state, input.context, plan).signature;
    input.context.jointForces.fleets[0] = { ...input.context.jointForces.fleets[0], readiness: 89.9 };
    expect(getSeaTransportBoardPlan(input.state, input.context, plan).signature).not.toBe(signature);
    const html = render(input, { plan, reviewedSignature: signature });
    expect(html).toContain('초안은 유지했습니다'); expect(html).not.toContain('비용을 지불하고 수송 승인');
  });
  it('does not silently replace a deleted fleet or circumvent naval authority', () => {
    const input = escortProps(); const plan = { ...initialPlan, escortFleetId: 'deleted-fleet' };
    expect(getSeaTransportBoardPlan(input.state, input.context, plan).canReview).toBe(false);
    expect(render(input, { plan })).toContain('다른 함대를 자동 배정하지 않았습니다');
    input.context.canCommandEscort = false;
    expect(getSeaTransportBoardPlan(input.state, input.context, { ...initialPlan, escortFleetId: 'named-escort' }).canReview).toBe(false);
    expect(getSeaTransportBoardPlan(input.state, input.context, initialPlan).canReview).toBe(true);
    expect(render(input)).toContain('함대 배속을 직접 결재할 권한이 없습니다');
  });
  it('reports named active escort from the actual assignment and zero effect when mismatched', () => {
    const input = escortProps(); const launched = launchSeaTransport(input.state, { ...initialPlan, escortFleetId: 'named-escort' }, input.context);
    input.state = launched.state;
    input.context.jointForces.fleets = input.context.jointForces.fleets.map((fleet) => launched.fleetUpdates?.find((update) => update.id === fleet.id) ?? fleet);
    const html = render(input, { workspace: 'active' });
    expect(html).toContain('현재 배속 호위 함대'); expect(html).toContain('합류·현 위치·소속 검증 후 적용');
    expect(html).toContain('대서양 호송전대'); expect(html).toContain('잔여 항속'); expect(html).toContain('−0%p');
    input.context.jointForces.fleets[0] = { ...input.context.jointForces.fleets[0], assignmentId: 'different-operation' };
    const mismatch = render(input, { workspace: 'active' });
    expect(mismatch).toContain('합류·현 위치·소속 검증 후 적용'); expect(mismatch).toContain('−0%p');
  });
});

describe('deliberate rescue dispatch and progression desk', () => {
  it('presents shared rescue base, additive costs and separate approach/return durations', () => {
    const input = strandedProps(); const operation = input.state.operations[0];
    const model = getSeaTransportBoardRescue(input.state, operation.id, input.context);
    expect(model.forecast).toEqual(forecastSeaTransportRescue(input.state, operation.id, input.context));
    expect(model.canReview).toBe(true);
    const html = render(input, { workspace: 'active' });
    expect(html).toContain('구조 계획 검토하기'); expect(html).not.toContain('비용을 지불하고 구조선 출동');
    expect(html).toContain(model.forecast.baseName); expect(html).toContain('구조선 접근'); expect(html).toContain('부대 귀환 항해');
    expect(html).toContain('이번 구조 출동의 추가 비용');
    expect(input.onRescue).not.toHaveBeenCalled(); expect(input.context.stockpile.convoys).toBe(76);
  });
  it('requires a separate rescue review before exposing explicit paid approval', () => {
    const input = strandedProps(); const model = getSeaTransportBoardRescue(input.state, input.state.operations[0].id, input.context);
    const html = render(input, { workspace: 'active', rescueReviewedSignature: model.signature });
    expect(html).toContain('구조 출동 최종 승인'); expect(html).toContain('비용을 지불하고 구조선 출동');
    expect(html).toContain('승인 즉시 부대가 귀환하지는 않습니다'); expect(input.onRescue).not.toHaveBeenCalled();
  });
  it('invalidates rescue review on later weeks, fleet state or resources without auto dispatch', () => {
    const input = strandedProps(); const operation = input.state.operations[0];
    const signature = getSeaTransportBoardRescue(input.state, operation.id, input.context).signature;
    input.context = { ...input.context, week: input.context.week + 1 };
    const html = render(input, { workspace: 'active', rescueReviewedSignature: signature });
    expect(html).toContain('구조 검토 이후'); expect(html).not.toContain('비용을 지불하고 구조선 출동');
    input.context.stockpile = { ...input.context.stockpile, convoys: 0 };
    expect(getSeaTransportBoardRescue(input.state, operation.id, input.context).canReview).toBe(false);
    expect(render(input, { workspace: 'active' })).toContain('새로 예약할 구조 수송선');
    expect(input.onRescue).not.toHaveBeenCalled();
  });
  it('blocks rescue without command authority or a safe coastal base', () => {
    const input = strandedProps(); const id = input.state.operations[0].id;
    input.context.commandableDivisionIds = new Set();
    expect(getSeaTransportBoardRescue(input.state, id, input.context).canReview).toBe(false);
    expect(render(input, { workspace: 'active' })).toContain('구조를 직접 결재할 권한이 없습니다');
    input.context.commandableDivisionIds = new Set(['marine']);
    input.context.territories = input.context.territories.map((territory) => ({ ...territory, controller: 'axis' }));
    expect(getSeaTransportBoardRescue(input.state, id, input.context).canReview).toBe(false);
    expect(render(input, { workspace: 'active' })).toContain('현재 연결 가능한 구조 기지를 확보하지 못했습니다');
  });
  it('shows actual multistage rescue progress rather than resetting the original landing timeline', () => {
    const input = strandedProps(); const id = input.state.operations[0].id;
    const rescue = launchSeaTransportRescue(input.state, id, input.context);
    expect(rescue.accepted).toBe(true); input.state = rescue.state;
    const operation = input.state.operations[0];
    const html = render(input, { workspace: 'active' });
    expect(html).toContain('구조선이 움직이고 있습니다'); expect(html).toContain('구조선 접근');
    expect(html).not.toContain('구조 계획 검토하기');
    expect(getSeaTransportRemainingWeeks(operation)).toBe(operation.rescue!.outboundWeeks + operation.rescue!.returnWeeks);
    expect(html).toContain(`${operation.convoysRemaining} / ${operation.convoysReserved}척`);
    expect(html).toContain('수송·지정 호위·구조 출동 비용을 합한 값');
  });
  it('renders historical escort and repeated rescue totals without mislabeling them as initial costs', () => {
    const input = props(); input.state.records = [{ id: 'rescue-report', operationId: 'sea-1', divisionId: 'marine', divisionName: '상륙사단', fromId: 'britain', targetId: 'normandy', fromName: '영국 출발항', targetName: '노르망디 해안', startedWeek: 0, endedWeek: 14, elapsedWeeks: 14, outcome: 'recalled', arrivalId: 'britain', convoysReserved: 56, convoysReturned: 12, convoysLost: 44, strengthLoss: 20, organizationLoss: 35, commandCost: 20, fuelCost: 41, result: '구조 후 귀환', escortFleetName: '대서양 호송전대', escortShipsLost: 2, rescueDispatches: 2 }];
    const html = render(input, { workspace: 'history' });
    expect(html).toContain('대서양 호송전대'); expect(html).toContain('호위 함정 누적 손실 2척');
    expect(html).toContain('구조선 포함 누적 투입 56척'); expect(html).toContain('수송·호위·구조 총액');
    expect(html).not.toContain('최초 예약 56척');
  });
  it('guards repeated rescue dispatch callback on the same game snapshot', () => {
    const input = strandedProps(); const guard = createSeaTransportCommandGuard(); const callback = vi.fn();
    expect(guard(input.state, input.context.week, 'rescue:' + input.state.operations[0].id, callback)).toBe(true);
    expect(guard(input.state, input.context.week, 'rescue:' + input.state.operations[0].id, callback)).toBe(false);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

function underwayProps(withEscort = false): SeaTransportBoardProps {
  const input = escortProps();
  input.context.jointForces.fleets.push({ ...input.context.jointForces.fleets[0], id: 'relief-escort', name: '북대서양 교대전대', ships: 16, authorizedShips: 16 });
  const launched = launchSeaTransport(input.state, { ...initialPlan, escortFleetId: withEscort ? 'named-escort' : undefined }, input.context);
  input.state = launched.state;
  input.context.divisions = launched.divisionUpdates;
  input.context.jointForces.fleets = input.context.jointForces.fleets.map((fleet) => launched.fleetUpdates?.find((update) => update.id === fleet.id) ?? fleet);
  return input;
}

describe('escort rendezvous and relief command desk', () => {
  it('offers reinforcement without silently selecting or assigning a fleet', () => {
    const input = underwayProps(); const before = structuredClone(input.context.jointForces);
    const html = render(input, { workspace: 'active' });
    expect(html).toContain('항해 중에도 호위를 파견할 수 있습니다');
    expect(html).toContain('새 함대를 선택하세요'); expect(html).toContain('호위 파견 검토하기');
    expect(html).not.toContain('비용을 지불하고 호위 파견');
    expect(input.onEscortRelief).not.toHaveBeenCalled(); expect(input.context.jointForces).toEqual(before);
  });
  it('uses the engine relief forecast and requires a second deliberate paid approval', () => {
    const input = underwayProps(true); const id = input.state.operations[0].id;
    const model = getSeaTransportBoardEscortRelief(input.state, id, 'relief-escort', input.context);
    expect(model.forecast).toEqual(forecastSeaTransportEscortRelief(input.state, id, 'relief-escort', input.context));
    expect(model.canReview).toBe(true);
    const html = render(input, { workspace: 'active', escortReliefFleetId: 'relief-escort', escortReliefReviewedSignature: model.signature });
    expect(html).toContain('호위 파견 최종 승인'); expect(html).toContain('비용을 지불하고 호위 파견');
    expect(html).toContain('기존 호위는 합류 전까지 유지'); expect(html).toContain('수송선 추가 투입 없음');
    expect(input.onEscortRelief).not.toHaveBeenCalled();
  });
  it('invalidates approval for a different selected fleet, later week or precise condition change', () => {
    const input = underwayProps(); const id = input.state.operations[0].id;
    const signature = getSeaTransportBoardEscortRelief(input.state, id, 'named-escort', input.context).signature;
    const changedFleet = getSeaTransportBoardEscortRelief(input.state, id, 'relief-escort', input.context);
    expect(changedFleet.signature).not.toBe(signature);
    input.context.jointForces.fleets[0] = { ...input.context.jointForces.fleets[0], readiness: 89.99 };
    expect(getSeaTransportBoardEscortRelief(input.state, id, 'named-escort', input.context).signature).not.toBe(signature);
    const html = render(input, { workspace: 'active', escortReliefFleetId: 'named-escort', escortReliefReviewedSignature: signature });
    expect(html).toContain('선택한 함대는 유지'); expect(html).not.toContain('비용을 지불하고 호위 파견');
    input.context.week += 1;
    expect(getSeaTransportBoardEscortRelief(input.state, id, 'named-escort', input.context).signature).not.toBe(signature);
  });
  it('blocks new escort commands for lower authority, insufficient resources or settlement', () => {
    const input = underwayProps(); const id = input.state.operations[0].id;
    input.context.canCommandEscort = false;
    expect(getSeaTransportBoardEscortRelief(input.state, id, 'named-escort', input.context).canReview).toBe(false);
    expect(render(input, { workspace: 'active', escortReliefFleetId: 'named-escort' })).toContain('현재 보직은 새 함대 배속 권한이 없습니다');
    input.context.canCommandEscort = true; input.context.game.fuel = 0;
    expect(getSeaTransportBoardEscortRelief(input.state, id, 'named-escort', input.context).canReview).toBe(false);
    input.context.game.fuel = 100; input.context.processingWeek = true;
    expect(getSeaTransportBoardEscortRelief(input.state, id, 'named-escort', input.context).canReview).toBe(false);
    expect(input.onEscortRelief).not.toHaveBeenCalled();
  });
  it('shows current and approaching fleets as different commitments without double protection', () => {
    const input = underwayProps(true); const id = input.state.operations[0].id;
    const dispatched = dispatchSeaTransportEscortRelief(input.state, id, 'relief-escort', input.context);
    expect(dispatched.accepted).toBe(true); input.state = dispatched.state;
    input.context.jointForces.fleets = input.context.jointForces.fleets.map((fleet) => dispatched.fleetUpdates?.find((item) => item.id === fleet.id) ?? fleet);
    const html = render(input, { workspace: 'active' });
    expect(html).toContain('지금 수송선을 지키는 함대'); expect(html).toContain('대서양 호송전대');
    expect(html).toContain('북대서양 교대전대 합류를 기다리고 있습니다');
    expect(html).toContain('출동 중 · 아직 보호 미적용'); expect(html).toContain('교대할 두 함대의 효과를 동시에 더하지 않습니다');
    expect(html).not.toContain('호위 파견 검토하기'); expect(input.state.operations[0].escortFleetId).toBe('named-escort');
  });
  it('admits no named protection before a first escort joins and no promised overdue date', () => {
    const input = underwayProps(); const operation = input.state.operations[0];
    input.state = dispatchSeaTransportEscortRelief(input.state, operation.id, 'relief-escort', input.context).state;
    input.state.operations[0].pendingEscortRelief!.elapsedWeeks = 4;
    const html = render(input, { workspace: 'active' });
    expect(html).toContain('새 함대가 합류하기 전에는 지정 호위 보호가 없습니다');
    expect(html).toContain('기본 접근 일정 경과 · 실제 합류 조건 확인 중');
    expect(html).not.toContain('약 -3주');
  });
  it('preserves support drafts in controlled workspaces without stale auto dispatch', () => {
    const input = underwayProps(); const selection = { ...createInitialSeaTransportSelection(input), workspace: 'history' as const, escortReliefFleetId: 'relief-escort', rescueEscortFleetId: 'named-escort' };
    const onSelectionChange = vi.fn();
    renderToStaticMarkup(<SeaTransportBoard {...input} selection={selection} onSelectionChange={onSelectionChange} />);
    expect(selection.escortReliefFleetId).toBe('relief-escort'); expect(selection.rescueEscortFleetId).toBe('named-escort');
    expect(onSelectionChange).not.toHaveBeenCalled(); expect(input.onEscortRelief).not.toHaveBeenCalled();
  });
  it('renders joined, cancelled and lost dispatch history with dates and additive costs', () => {
    const input = underwayProps(); const operation = input.state.operations[0];
    const base = { fleetId: 'relief-escort', fleetName: '북대서양 교대전대', previousFleetId: 'named-escort', previousFleetName: '대서양 호송전대', dispatchedWeek: 1, arrivalWeeks: 2, elapsedWeeks: 2, commandCost: 2, fuelCost: 8, source: 'reinforcement' as const, resolvedWeek: 3 };
    operation.escortReliefHistory = [
      { ...base, status: 'joined', reason: '실제 합류 후 기존 호위 인계' },
      { ...base, status: 'cancelled', dispatchedWeek: 4, resolvedWeek: 5, reason: '수송이 먼저 종료되어 합류 중단' },
      { ...base, status: 'lost', dispatchedWeek: 6, resolvedWeek: 7, reason: '접근 중 함대 전력 소진' },
    ];
    const html = render(input, { workspace: 'active' });
    expect(html).toContain('합류·인계 완료'); expect(html).toContain('합류 전 파견 중단'); expect(html).toContain('접근 함대 손실');
    expect(html).toContain('제2주 파견 → 제4주 합류'); expect(html).toContain('지휘력 2·연료 8 소비');
    expect(html).toContain('작전 누적 총액에 이미 포함');
  });
});

describe('rescue convoy escort selection', () => {
  it('keeps the default rescue-only forecast and includes a selected new escort in the same total', () => {
    const input = strandedProps(); const id = input.state.operations[0].id;
    const plain = getSeaTransportBoardRescue(input.state, id, input.context);
    const escorted = getSeaTransportBoardRescue(input.state, id, input.context, 'named-escort');
    expect(escorted.canReview).toBe(true); expect(escorted.forecast.escort?.name).toBe('대서양 호송전대');
    expect(escorted.forecast.commandCost).toBe(plain.forecast.commandCost + escorted.forecast.escort!.commandCost);
    expect(escorted.forecast.fuelCost).toBe(plain.forecast.fuelCost + escorted.forecast.escort!.fuelCost);
    expect(escorted.signature).not.toBe(plain.signature);
    const html = render(input, { workspace: 'active', rescueEscortFleetId: 'named-escort', rescueReviewedSignature: escorted.signature });
    expect(html).toContain('새 호위 파견비가 이미 포함'); expect(html).toContain('구조선과 실제 동행하는 항로 구간에 적용');
    expect(html).toContain('비용을 지불하고 구조선 출동'); expect(input.onRescue).not.toHaveBeenCalled();
  });
  it('requires new review after changing the rescue escort or the selected fleet state', () => {
    const input = strandedProps(); const id = input.state.operations[0].id;
    const withoutEscort = getSeaTransportBoardRescue(input.state, id, input.context).signature;
    expect(render(input, { workspace: 'active', rescueEscortFleetId: 'named-escort', rescueReviewedSignature: withoutEscort })).not.toContain('비용을 지불하고 구조선 출동');
    const withEscort = getSeaTransportBoardRescue(input.state, id, input.context, 'named-escort').signature;
    input.context.jointForces.fleets[0] = { ...input.context.jointForces.fleets[0], readiness: 89.99 };
    const html = render(input, { workspace: 'active', rescueEscortFleetId: 'named-escort', rescueReviewedSignature: withEscort });
    expect(html).toContain('구조 검토 이후'); expect(html).not.toContain('비용을 지불하고 구조선 출동');
  });
  it('does not let a lower role add a fleet but preserves an authorized rescue without a new fleet', () => {
    const input = strandedProps(); const id = input.state.operations[0].id; input.context.canCommandEscort = false;
    expect(getSeaTransportBoardRescue(input.state, id, input.context).canReview).toBe(true);
    expect(getSeaTransportBoardRescue(input.state, id, input.context, 'named-escort').canReview).toBe(false);
    const html = render(input, { workspace: 'active', rescueEscortFleetId: 'named-escort' });
    expect(html).toContain('함대 배속을 직접 결재할 권한이 없습니다'); expect(html).not.toContain('비용을 지불하고 구조선 출동');
  });
  it('shows the rescue escort approaching rather than pretending it already protects the unit', () => {
    const input = strandedProps(); const id = input.state.operations[0].id;
    const rescue = launchSeaTransportRescue(input.state, id, input.context, 'named-escort');
    expect(rescue.accepted).toBe(true); input.state = rescue.state;
    const html = render(input, { workspace: 'active' });
    expect(html).toContain('구조선 동행 · 본대 인계 전'); expect(html).toContain('구조선이 고립 부대에 도착해 실제 합류할 때');
    expect(html).not.toContain('구조 계획 검토하기'); expect(input.state.operations[0].escortFleetId).toBeUndefined();
  });
  it('shares one support command guard across relief and rescue approvals on a stale snapshot', () => {
    const input = strandedProps(); const guard = createSeaTransportCommandGuard(); const rescue = vi.fn(); const relief = vi.fn();
    const key = 'support:' + input.state.operations[0].id;
    expect(guard(input.state, input.context.week, key, rescue)).toBe(true);
    expect(guard(input.state, input.context.week, key, relief)).toBe(false);
    expect(rescue).toHaveBeenCalledOnce(); expect(relief).not.toHaveBeenCalled();
  });
  it('defaults to keeping an existing escort without charging for a second fleet', () => {
    const input = underwayProps(true); const operation = input.state.operations[0];
    input.state.operations[0] = { ...operation, stage: 'waiting-return', convoysRemaining: 0 };
    const model = getSeaTransportBoardRescue(input.state, operation.id, input.context);
    expect(model.canReview).toBe(true); expect(model.forecast.escort).toBeNull();
    const html = render(input, { workspace: 'active' });
    expect(html).toContain('기존 호위 유지 · 대서양 호송전대');
    expect(html).toContain('아래 비용에는 새 호위 파견비가 없습니다');
    expect(html).not.toContain('새 호위 파견비가 이미 포함');
  });
  it('explains that an already approaching escort is preserved by rescue-only approval', () => {
    const input = underwayProps(); const id = input.state.operations[0].id;
    input.state = dispatchSeaTransportEscortRelief(input.state, id, 'named-escort', input.context).state;
    input.state.operations[0] = { ...input.state.operations[0], stage: 'waiting-return', convoysRemaining: 0 };
    const html = render(input, { workspace: 'active' });
    expect(html).toContain('기존 호위 파견 유지 · 대서양 호송전대');
    expect(html).toContain('기존 출동비를 다시 청구하지 않습니다');
    expect(getSeaTransportBoardRescue(input.state, id, input.context).canReview).toBe(true);
    expect(getSeaTransportBoardRescue(input.state, id, input.context, 'relief-escort').canReview).toBe(false);
  });
  it('keeps escort handoff history available in the completed report after active orders disappear', () => {
    const input = props();
    input.state.records = [{ id: 'handoff-report', operationId: 'sea-1', divisionId: 'marine', divisionName: '상륙사단', fromId: 'britain', targetId: 'normandy', fromName: '영국 출발항', targetName: '노르망디 해안', startedWeek: 0, endedWeek: 12, elapsedWeeks: 12, outcome: 'recalled', arrivalId: 'britain', convoysReserved: 40, convoysReturned: 14, convoysLost: 26, strengthLoss: 10, organizationLoss: 12, commandCost: 16, fuelCost: 30, result: '구조 후 귀환', escortFleetName: '구조 호위전대', escortReliefHistory: [{ fleetId: 'rescue-escort', fleetName: '구조 호위전대', source: 'rescue', dispatchedWeek: 4, arrivalWeeks: 2, elapsedWeeks: 2, resolvedWeek: 6, status: 'joined', reason: '고립 부대와 합류해 구조 호위를 인계했습니다.', commandCost: 2, fuelCost: 6 }] }];
    const html = render(input, { workspace: 'history' });
    expect(html).toContain('호위 파견·인계 기록 · 1건'); expect(html).toContain('구조 수송 동행');
    expect(html).toContain('제5주 파견 → 제7주 합류'); expect(html).toContain('지휘력 2·연료 6 소비');
    expect(html).toContain('확정 도착지 · 영국 출발항');
  });
});
