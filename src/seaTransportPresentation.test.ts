import { describe, expect, it } from 'vitest';
import { buildSeaTransportPresentation, resolveSeaTransportSelection } from './seaTransportPresentation';
import { advanceSeaTransportWeek, createSeaTransportState, launchSeaTransport, requestSeaTransportReturn } from './seaTransport';
import type { SeaTransportContext, SeaTransportOperation, SeaTransportRecord, SeaTransportState } from './seaTransport';
import type { JointForcesState, NavalTaskForce } from './jointOperations';
import type { Territory } from './types';
import { createFleetNavigation } from './navalNavigation';

const site = (id: string, overrides: Partial<Territory> = {}): Territory => ({ id, name: id, region: '시험 전구', x: 0, y: 0,
  controller: 'allies', value: 5, supply: 35, terrain: '해안', siteType: 'port', neighbors: [], theater: 'europe', ...overrides });
function context(): SeaTransportContext {
  return { week: 5, nationId: 'britain', playerFaction: 'allies', phase: 'war', processingWeek: false,
    divisions: [{ id: 'marine', name: '상륙사단', type: 'marine', territoryId: 'britain', status: 'ready', strength: 95, organization: 95, supply: 95, experience: 60, commanderId: 'general' }],
    territories: [site('britain', { neighbors: ['normandy', 'belfast', 'channel'] }), site('normandy', { neighbors: ['britain', 'channel'], controller: 'axis' }),
      site('belfast', { neighbors: ['britain', 'channel'] }), site('channel', { siteType: 'sea', neighbors: ['britain', 'normandy', 'belfast'] })],
    commandableDivisionIds: new Set(['marine']), orders: [],
    game: { week: 5, manpower: 400, politicalPower: 100, fuel: 100, steel: 50, factories: 10, stability: 70, warSupport: 70, commandPoints: 100, treasury: 100, victoryScore: 0, airPower: 80, navalPower: 80, intelNetwork: 60, enemyPressure: 50 },
    stockpile: { infantryEquipment: 100, tanks: 10, aircraft: 10, convoys: 100, artillery: 20, trucks: 10 },
    jointForces: { nationId: 'britain', fleets: [], airGroups: [], operations: [], theaterControl: { europe: { sea: 100, air: 100, intelligence: 100, trend: 0, lastChangedWeek: 0 }, asia: { sea: 100, air: 100, intelligence: 100, trend: 0, lastChangedWeek: 0 } } } as unknown as JointForcesState };
}
function operation(overrides: Partial<SeaTransportOperation> = {}): SeaTransportOperation {
  return { id: 'sea-britain-0-marine-0', divisionId: 'marine', nationId: 'britain', playerFaction: 'allies', theater: 'europe',
    divisionName: '상륙사단', fromId: 'britain', targetId: 'normandy', fromName: '영국', targetName: '노르망디', routeIds: ['britain', 'channel', 'normandy'],
    mode: 'landing', stage: 'sailing', startedWeek: 0, elapsedWeeks: 2, stageWeeks: 1,
    phaseWeeks: { embarking: 1, sailing: 2, landing: 2, beachhead: 2, disembarking: 0 }, commandCost: 12, fuelCost: 15,
    convoysReserved: 20, convoysRemaining: 18, strengthLoss: 4, organizationLoss: 2, successChance: 80, landingCaptured: false,
    lastMessage: '해상 항해 1/2주', ...overrides };
}
function state(op = operation()): SeaTransportState { return { version: 1, operations: [op], records: [] }; }
function record(overrides: Partial<SeaTransportRecord> = {}): SeaTransportRecord {
  return { id: 'record-sea-britain-0-marine-0', operationId: 'sea-britain-0-marine-0', divisionId: 'marine', divisionName: '상륙사단',
    fromId: 'britain', targetId: 'normandy', fromName: '영국', targetName: '노르망디', startedWeek: 0, endedWeek: 4, elapsedWeeks: 4,
    outcome: 'recalled', arrivalId: 'belfast', convoysReserved: 20, convoysReturned: 18, convoysLost: 2,
    strengthLoss: 4, organizationLoss: 2, commandCost: 12, fuelCost: 15, result: '벨파스트에 귀환·재편했습니다.', ...overrides };
}
function fleet(): NavalTaskForce {
  const value = { id: 'escort', name: '호위함대', location: '포츠머스', kind: 'escort', ships: 8, readiness: 90, organization: 90,
    status: 'assigned', assignmentId: 'nav-return-escort', theater: 'europe', commander: '시험 지휘관', flagship: '시험함', experience: 60, historicalBasis: '검증용 합성 함대' } as NavalTaskForce;
  const nav = createFleetNavigation(value);
  if (!nav) throw new Error('fixture home port missing');
  return { ...value, navigation: { ...nav, mode: 'returning', route: [nav.homePort, { ...nav.homePort, id: 'far', longitude: nav.homePort.longitude + 1 }],
    destination: nav.homePort, distanceNm: 200, traveledNm: 20, lastMessage: '귀항 항로 진행 중' } };
}

describe('sea transport read-only presentation', () => {
  it('projects the actual engine stage and strategic area without mutating either input', () => {
    const input = state(); const ctx = context(); const before = structuredClone({ input, ctx });
    const row = buildSeaTransportPresentation(input, ctx).operations[0];
    expect(row.stage).toBe('sailing'); expect(row.location.id).toBe('channel');
    expect(row.locationLabel).toContain('정확한 선박 좌표 아님'); expect(row.remainingWeeks).toBe(1);
    expect(row.steps.map((step) => step.status)).toEqual(['complete', 'current', 'pending', 'pending', 'pending']);
    expect(row.convoysRemaining).toBe(18); expect(row.convoysLost).toBe(2);
    expect({ input, ctx }).toEqual(before);
  });
  it('filters foreign nation, faction and future launches', () => {
    const input = state(); input.operations.push(operation({ id: 'foreign', nationId: 'japan' }), operation({ id: 'faction', playerFaction: 'axis' }), operation({ id: 'future', startedWeek: 6 }));
    expect(buildSeaTransportPresentation(input, context()).operations.map((row) => row.id)).toEqual(['sea-britain-0-marine-0']);
  });
  it('does not render future settlement state as current', () => {
    const model = buildSeaTransportPresentation({ ...state(), lastProcessedWeek: 6 }, context());
    expect(model.operations).toEqual([]); expect(model.unavailableReason).toContain('현재 주차');
  });
  it('keeps explicit stale or old-nation selection empty', () => {
    const model = buildSeaTransportPresentation(state(), context());
    expect(resolveSeaTransportSelection(model, null, 'britain')?.id).toBe('sea-britain-0-marine-0');
    expect(resolveSeaTransportSelection(model, { nationId: 'japan', id: model.operations[0].id }, 'britain')).toBeNull();
    expect(resolveSeaTransportSelection(model, { nationId: 'britain', id: 'missing' }, 'britain')).toBeNull();
  });
  it('does not interpret an old fully consumed counter as instant arrival', () => {
    expect(buildSeaTransportPresentation(state(operation({ stageWeeks: 500 })), context()).operations[0].remainingWeeks).toBe(1);
  });
  it('uses one actual disembarkation settlement even for inflated old phase durations', () => {
    const input = operation({ targetId: 'belfast', mode: 'transfer', stage: 'disembarking', stageWeeks: 0 }); input.phaseWeeks.disembarking = 20;
    const row = buildSeaTransportPresentation(state(input), context()).operations[0];
    expect(row.remainingWeeks).toBe(1); expect(row.steps.some((step) => step.id === 'landing')).toBe(false);
  });
  it('keeps a captured beachhead pending supply and command handover', () => {
    const ctx = context(); ctx.territories = ctx.territories.map((site) => site.id === 'normandy' ? { ...site, controller: 'allies' } : site);
    const row = buildSeaTransportPresentation(state(operation({ stage: 'beachhead', landingCaptured: true })), ctx).operations[0];
    expect(row.statusText).toContain('보급 유지'); expect(row.steps.at(-1)?.status).toBe('pending');
  });
  it('uses the next settlement for a newly friendly landing target, then waits for disembarkation', () => {
    const ctx = context(); ctx.territories = ctx.territories.map((site) => site.id === 'normandy' ? { ...site, controller: 'allies' } : site);
    const row = buildSeaTransportPresentation(state(operation({ stage: 'landing', stageWeeks: 0 })), ctx).operations[0];
    expect(row.stage).toBe('landing'); expect(row.remainingWeeks).toBe(1); expect(row.statusText).toContain('하선·재편으로 전환');
    expect(row.steps.find((step) => step.id === 'disembarking')?.status).toBe('pending');
    expect(row.steps.some((step) => step.id === 'beachhead')).toBe(false);
    expect(row.steps.at(-1)?.status).toBe('pending');
  });
  it('marks waiting-return as unresolved without a fictitious ETA or completed assault', () => {
    const row = buildSeaTransportPresentation(state(operation({ stage: 'waiting-return', convoysRemaining: 0 })), context()).operations[0];
    expect(row.attention).toBe(true); expect(row.remainingWeeks).toBeNull(); expect(row.nextActionLabel).toContain('구조');
    expect(row.steps.map((step) => step.status)).toEqual(['current', 'pending']);
  });
  it('uses the actual return destination and reversed return route', () => {
    const row = buildSeaTransportPresentation(state(operation({ stage: 'returning', returnTargetId: 'belfast', returnRouteIds: ['normandy', 'channel', 'belfast'], returnWeeks: 2 })), context()).operations[0];
    expect(row.arrival?.id).toBe('belfast'); expect(row.target.id).toBe('normandy'); expect(row.location.id).toBe('channel');
  });
  it('shows a recall request before it becomes a real return voyage', () => {
    const input = requestSeaTransportReturn(state(), operation().id, 5);
    const row = buildSeaTransportPresentation(input, context()).operations[0];
    expect(row.stage).toBe('sailing'); expect(row.remainingWeeks).toBeNull(); expect(row.attentionReason).toContain('철회 요청 접수');
  });
  it('does not confuse moving rescue ships with picked-up troops', () => {
    const ctx = context(); ctx.territories = ctx.territories.filter((site) => site.id !== 'normandy');
    const row = buildSeaTransportPresentation(state(operation({ stage: 'rescuing', stageWeeks: 1,
      rescue: { dispatchedWeek: 3, baseId: 'belfast', baseName: '벨파스트', routeIds: ['belfast', 'channel'], outboundWeeks: 2, returnWeeks: 2, attempt: 1 } })), ctx).operations[0];
    expect(row.locationLabel).toContain('부대 승선 전'); expect(row.statusText).toContain('아직 완료되지'); expect(row.remainingWeeks).toBe(1);
  });
  it('withholds estimates and commands when required division/rescue data is missing', () => {
    const ctx = context(); ctx.divisions = [];
    const missingDivision = buildSeaTransportPresentation(state(), ctx).operations[0];
    expect(missingDivision.canCommand).toBe(false); expect(missingDivision.remainingWeeks).toBeNull();
    const missingRescue = buildSeaTransportPresentation(state(operation({ stage: 'rescuing' })), context()).operations[0];
    expect(missingRescue.attentionReason).toContain('구조 접근 자료'); expect(missingRescue.remainingWeeks).toBeNull();
  });
  it('explains changed origin and target control before the next weekly engine step', () => {
    const ctx = context(); ctx.territories = ctx.territories.map((site) => site.id === 'britain' ? { ...site, controller: 'axis' } : site);
    expect(buildSeaTransportPresentation(state(operation({ stage: 'embarking' })), ctx).operations[0].attentionReason).toContain('출발지 통제');
    expect(buildSeaTransportPresentation(state(operation({ mode: 'transfer' })), context()).operations[0].attentionReason).toContain('우호 통제');
  });
  it('keeps a displaced embarkation unit at its actual land location before settlement', () => {
    const ctx = context(); ctx.divisions = ctx.divisions.map((unit) => ({ ...unit, territoryId: 'belfast' }));
    const row = buildSeaTransportPresentation(state(operation({ stage: 'embarking' })), ctx).operations[0];
    expect(row.location.id).toBe('belfast'); expect(row.from.id).toBe('britain');
    expect(row.locationLabel).toContain('실제 육상 위치'); expect(row.attentionReason).toContain('출발지를 이탈');
  });
  it('keeps role access and processing-week command locks', () => {
    const ctx = context(); ctx.commandableDivisionIds = new Set();
    expect(buildSeaTransportPresentation(state(), ctx).operations[0].canCommand).toBe(false);
    ctx.commandableDivisionIds = new Set(['marine']); ctx.processingWeek = true;
    expect(buildSeaTransportPresentation(state(), ctx).operations[0].canCommand).toBe(false);
  });
  it('scopes records by encoded issuing nation, not a coincidental division id', () => {
    const input: SeaTransportState = { version: 1, operations: [], records: [record(), record({ id: 'foreign', operationId: 'sea-japan-0-marine-0' }), record({ id: 'legacy', operationId: 'legacy-sea' }), record({ id: 'legacy-foreign', operationId: 'legacy-other', divisionId: 'other' })] };
    expect(buildSeaTransportPresentation(input, context()).records.map((row) => row.id).sort()).toEqual(['legacy', 'record-sea-britain-0-marine-0']);
  });
  it('filters future and chronology-invalid records', () => {
    const input: SeaTransportState = { version: 1, operations: [], records: [record({ endedWeek: 6 }), record({ startedWeek: 4, endedWeek: 3 })] };
    expect(buildSeaTransportPresentation(input, context()).records).toEqual([]);
  });
  it('retains historical arrival, correct displayed week and no fictional intermediate success', () => {
    const row = buildSeaTransportPresentation({ version: 1, operations: [], records: [record({ outcome: 'failed-landing' })] }, context()).records[0];
    expect(row.arrival?.id).toBe('belfast'); expect(row.locationLabel).toContain('제5주'); expect(row.locationLabel).toContain('현재 주둔 위치와 다를');
    expect(row.steps).toHaveLength(1); expect(row.stageLabel).toContain('상륙 중단'); expect(row.canCommand).toBe(false);
  });
  it('preserves historical recorded city names after present-day renaming', () => {
    const ctx = context(); ctx.territories = [...ctx.territories, site('leningrad', { name: '상트페테르부르크' }), site('stalingrad', { name: '볼고그라드' })];
    const saved = record({ fromId: 'leningrad', fromName: '레닌그라드', targetId: 'stalingrad', targetName: '스탈린그라드', arrivalId: 'leningrad' });
    const row = buildSeaTransportPresentation({ version: 1, operations: [], records: [saved] }, ctx).records[0];
    expect(row.from.name).toBe('레닌그라드'); expect(row.target.name).toBe('스탈린그라드'); expect(row.arrival?.name).toBe('레닌그라드');
    expect(row.statusText).not.toContain('상트페테르부르크');
  });
  it('labels an alternate arrival with no saved name as a current-name lookup', () => {
    const ctx = context(); ctx.territories = ctx.territories.map((site) => site.id === 'belfast' ? { ...site, name: '벨파스트 신항' } : site);
    const saved = record();
    const row = buildSeaTransportPresentation({ version: 1, operations: [], records: [saved] }, ctx).records[0];
    expect(row.arrival?.name).toBe('벨파스트 신항 (현재 지명)'); expect(row.lastMessage).toBe(saved.result);
  });
  it('separates completed troop transfer from an escort still returning to port', () => {
    const ctx = context(); ctx.jointForces.fleets = [fleet()];
    const row = buildSeaTransportPresentation({ version: 1, operations: [], records: [record({ escortFleetId: 'escort' })] }, ctx).records[0];
    expect(row.stage).toBe('completed'); expect(row.escorts[0].mode).toBe('returning'); expect(row.escorts[0].label).toContain('귀항');
    expect(row.supportSummary).toContain('귀항 완료'); expect(row.escorts[0].detail).toContain('현재 상태');
  });
  it('does not infer fleet completion or import foreign fleets from missing navigation', () => {
    const ctx = context(); const ship = fleet(); delete ship.navigation; ctx.jointForces.fleets = [ship];
    const input = state(operation({ escortFleetId: 'escort' }));
    expect(buildSeaTransportPresentation(input, ctx).operations[0].escorts[0].mode).toBe('unknown');
    ctx.jointForces.nationId = 'japan';
    expect(buildSeaTransportPresentation(input, ctx).operations[0].escorts[0].label).toContain('자료 미확인');
  });
  it('labels a historical escort now assigned elsewhere instead of treating it as this voyage', () => {
    const ctx = context(); ctx.jointForces.fleets = [{ ...fleet(), assignmentId: 'joint-new' }];
    const row = buildSeaTransportPresentation({ version: 1, operations: [], records: [record({ escortFleetId: 'escort' })] }, ctx).records[0];
    expect(row.escorts[0].label).toContain('다른 임무');
  });
  it('changes the scene only after the real engine advances, never from elapsed calendar gaps', () => {
    const ctx = context(); ctx.week = 0;
    const launched = launchSeaTransport(createSeaTransportState(), { divisionId: 'marine', fromId: 'britain', targetId: 'belfast' }, ctx);
    expect(launched.accepted).toBe(true);
    const skipped = { ...ctx, week: 100 };
    expect(buildSeaTransportPresentation(launched.state, skipped).operations[0].stage).toBe('embarking');
    const advanced = advanceSeaTransportWeek(launched.state, skipped);
    expect(buildSeaTransportPresentation(advanced.state, skipped).operations[0].stage).toBe('sailing');
    expect(advanced.state.operations[0].elapsedWeeks).toBe(1);
  });
});
