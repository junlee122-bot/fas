import { describe, expect, it } from 'vitest';
import { advanceOperationWeek, battleTypeProfiles, createOperationOrder, getOperationOrderId, getOperationReports, inferBattleType, normalizeOperationOrder, normalizeOperationOrders, normalizeOperationStopReceipts, requestLandOperationStop } from './operations';
import type { BattleReport, Division, Order, Territory } from './types';

const origin: Territory = { id: 'rear', name: '출발지', region: '시험', x: 0, y: 0, controller: 'allies', value: 4, supply: 80, terrain: '평야', neighbors: ['target'], siteType: 'region' };
const division: Division = { id: 'division', name: '시험사단', type: 'infantry', strength: 90, organization: 85, experience: 70, supply: 80, territoryId: 'rear', commanderId: 'commander', status: 'ready' };

function target(overrides: Partial<Territory>): Territory {
  return { id: 'target', name: '목표', region: '시험', x: 1, y: 1, controller: 'axis', value: 8, supply: 80, terrain: '평야', neighbors: ['rear'], siteType: 'region', ...overrides };
}

function report(margin = 12): BattleReport {
  const phase = (id: BattleReport['phases'][number]['id'], delta: number): BattleReport['phases'][number] => ({ id, title: id, attackerScore: 70, defenderScore: 70 - delta, delta, tone: delta >= 7 ? 'advantage' : delta <= -7 ? 'setback' : 'contested', narrative: '시험' });
  return {
    id: 'battle-1', week: 1, divisionId: division.id, divisionName: division.name, commanderName: '지휘관', targetId: 'target', targetName: '목표', terrain: '평야', stance: 'balanced', victory: margin >= 0, margin,
    phases: [phase('reconnaissance', margin), phase('approach', margin), phase('engagement', margin), phase('exploitation', margin)],
    attackerStrengthLoss: 10, defenderStrengthLoss: 14, organizationLoss: 18, supplySpent: 12, summary: '주간 교전 결과',
  };
}

describe('multi-week operations', () => {
  it.each([
    [{ siteType: 'fortress', terrain: '요새 도시' }, 'siege'],
    [{ siteType: 'island', terrain: '도서 산악' }, 'amphibious'],
    [{ siteType: 'front', terrain: '산악 정글' }, 'mountain'],
    [{ siteType: 'city', terrain: '공업 도시' }, 'urban'],
  ] as const)('classifies the target into a matching battle type', (overrides, expected) => {
    expect(inferBattleType(origin, target(overrides), division)).toBe(expected);
  });

  it('keeps a fortress assault active after its first successful week', () => {
    const objective = target({ siteType: 'fortress', terrain: '요새 도시' });
    const order = createOperationOrder({ divisionId: division.id, fromId: origin.id, targetId: objective.id, startedWeek: 0, stance: 'balanced' }, origin, objective, division);
    const firstWeek = advanceOperationWeek(order, report(20));

    expect(firstWeek.profile.id).toBe('siege');
    expect(firstWeek.outcome).toBe('ongoing');
    expect(firstWeek.report.operationWeek).toBe(1);
    expect(firstWeek.order.operationProgress).toBeGreaterThan(0);
    expect(firstWeek.report.attackerStrengthLoss).toBeLessThan(report(20).attackerStrengthLoss);
  });

  it('cannot complete a long battle before its minimum duration', () => {
    const objective = target({ siteType: 'fortress', terrain: '요새 도시' });
    let order = createOperationOrder({ divisionId: division.id, fromId: origin.id, targetId: objective.id, startedWeek: 0 }, origin, objective, division);
    const minimumWeeks = battleTypeProfiles.siege.minimumWeeks;

    for (let week = 1; week < minimumWeeks; week += 1) {
      const result = advanceOperationWeek(order, report(40));
      expect(result.outcome).toBe('ongoing');
      order = result.order;
    }
  });

  it('finishes an operation once duration and progress conditions are both met', () => {
    const objective = target({ siteType: 'city', terrain: '공업 도시' });
    let order = createOperationOrder({ divisionId: division.id, fromId: origin.id, targetId: objective.id, startedWeek: 0 }, origin, objective, division);
    let outcome: ReturnType<typeof advanceOperationWeek>['outcome'] = 'ongoing';

    for (let week = 0; week < 7 && outcome === 'ongoing'; week += 1) {
      const result = advanceOperationWeek(order, report(38));
      order = result.order;
      outcome = result.outcome;
    }

    expect(outcome).toBe('victory');
    expect(order.elapsedWeeks).toBeGreaterThanOrEqual(battleTypeProfiles.urban.minimumWeeks);
  });
});

describe('persistent land order identities and stop requests', () => {
  const objective = target({ siteType: 'fortress' });
  const legacy: Order = { divisionId: division.id, fromId: origin.id, targetId: objective.id, startedWeek: 0, operationProgress: 115, elapsedWeeks: 3, cumulativeMargin: -7 };
  const context = { week: 3, phase: 'war' as const, commandableDivisionIds: new Set([division.id]) };

  it('fills missing fields without erasing a legacy siege in progress', () => {
    const normalized = normalizeOperationOrder(legacy, origin, objective, division);
    expect(normalized).toMatchObject({ id: getOperationOrderId(legacy), commandId: getOperationOrderId(legacy), battleType: 'siege', operationProgress: 115, elapsedWeeks: 3, cumulativeMargin: -7, operationRequired: 170 });
    expect(normalizeOperationOrder(JSON.parse(JSON.stringify(normalized)), origin, objective, division)).toEqual(normalized);
    expect(legacy.id).toBeUndefined();
  });

  it('has stable explicit command identities and distinguishes new repeat assaults', () => {
    const base = { divisionId: division.id, fromId: origin.id, targetId: objective.id, startedWeek: 3, commandCost: 5 };
    const first = createOperationOrder(base, origin, objective, division);
    const repeated = createOperationOrder(base, origin, objective, division);
    expect(first.id).not.toBe(repeated.id);
    expect(first.commandId).toBeTruthy();
    const explicit = createOperationOrder({ ...base, commandId: 'same-command' }, origin, objective, division);
    expect(createOperationOrder({ ...base, commandId: 'same-command' }, origin, objective, division)).toEqual(explicit);
    expect(advanceOperationWeek(explicit, report()).report).toMatchObject({ orderId: explicit.id, orderCommandCost: 5 });
    const qualified = createOperationOrder({ ...base, commandId: '나라:1/공세' }, origin, objective, division);
    expect(getOperationOrderId({ ...qualified, id: undefined })).toBe(qualified.id);
  });

  it('normalizes malformed values and duplicate identities deterministically', () => {
    const corrupt = { ...legacy, operationRequired: 0, maxWeeks: Number.NaN, stopRequestedWeek: -1 };
    const once = normalizeOperationOrders([corrupt, corrupt, { ...legacy, targetId: 'missing' }], [origin, objective], [division]);
    expect(new Set(once.map((order) => order.id)).size).toBe(3);
    expect(once[0]).toMatchObject({ operationRequired: 170, maxWeeks: 9, operationProgress: 115 });
    expect(once[0].stopRequestedWeek).toBeUndefined();
    expect(normalizeOperationOrders(JSON.parse(JSON.stringify(once)), [origin, objective], [division])).toEqual(once);
  });

  it('requests a stop once without changing cost, progress, or its first requested week', () => {
    const order = { ...normalizeOperationOrder(legacy, origin, objective, division), commandCost: 5 };
    const result = requestLandOperationStop([order], order.id!, context);
    expect(result.applied).toBe(true);
    expect(result.order).toMatchObject({ stopRequestedWeek: 3, commandCost: 5, operationProgress: 115 });
    expect(order.stopRequestedWeek).toBeUndefined();
    const repeated = requestLandOperationStop(result.orders, order.id!, { ...context, week: 4 });
    expect(repeated.applied).toBe(false);
    expect(repeated.orders).toEqual(result.orders);
    expect(repeated.reason).toContain('이미 중단');
  });

  it.each([
    [{ phase: 'nation' as const }, '국정'],
    [{ commandableDivisionIds: new Set<string>() }, '지휘 범위'],
    [{ processingWeek: true }, '결산 중'],
    [{ week: -1 }, '주차'],
  ])('rejects unavailable authority/time context %s', (overrides, message) => {
    const result = requestLandOperationStop([legacy], getOperationOrderId(legacy), { ...context, ...overrides });
    expect(result.applied).toBe(false);
    expect(result.reason).toContain(message);
    expect(result.orders).toEqual([legacy]);
  });

  it('rejects missing, duplicate, and not-yet-issued orders', () => {
    expect(requestLandOperationStop([], 'gone', context).applied).toBe(false);
    expect(requestLandOperationStop([legacy, legacy], getOperationOrderId(legacy), context).reason).toContain('중복');
    const future = { ...legacy, startedWeek: 9 };
    expect(requestLandOperationStop([future], getOperationOrderId(future), context).reason).toContain('승인 주차');
  });

  it('matches reports by order and target rather than reusing a previous assault', () => {
    const matched = { ...report(), orderId: 'active', week: 3 };
    const reports = [matched, { ...report(), id: 'old', orderId: 'old-assault', week: 2 },
      { ...report(), id: 'unlinked', week: 3 }, { ...matched, id: 'wrong-target', targetId: 'other' }, { ...matched, id: 'future', week: 4 }];
    expect(getOperationReports(reports, 'active', 3, legacy)).toEqual([matched]);
  });

  it('validates, deduplicates and bounds saved stop receipts without inventing fields', () => {
    const base = { orderId: 'order', week: 4, divisionId: 'division', targetId: 'target', reason: '요청 중단', elapsedWeeks: 3, progressPercent: 48 };
    const valid = normalizeOperationStopReceipts([null, {}, base, base, { ...base, week: Number.NaN }, { ...base, orderId: '' }, { ...base, week: -1 },
      { ...base, orderId: 'other', elapsedWeeks: -2, progressPercent: Number.POSITIVE_INFINITY }]);
    expect(valid).toEqual([base, { orderId: 'other', week: 4, divisionId: 'division', targetId: 'target', reason: '요청 중단' }]);
    expect(normalizeOperationStopReceipts(JSON.parse(JSON.stringify(valid)))).toEqual(valid);
    expect(normalizeOperationStopReceipts(Array.from({ length: 150 }, (_, index) => ({ ...base, orderId: `order-${index}`, week: index })))).toHaveLength(120);
    expect(normalizeOperationStopReceipts('invalid')).toEqual([]);
  });
});
