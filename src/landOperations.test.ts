import { describe, expect, it } from 'vitest';
import { allocateCloseAirSupport, resolveLandOrdersWeek } from './landOperations';
import { createOperationOrder, getOperationOrderId, requestLandOperationStop } from './operations';
import { territories as campaignTerritories } from './data';
import { advanceJointOperationsWeek, createJointForcesState, getCompletedCloseAirSupport, launchJointOperation } from './jointOperations';
import type { Commander, Division, Territory } from './types';
import type { ActiveJointOperation } from './jointOperations';

const rear: Territory = { id: 'rear', name: '후방', region: '시험', x: 0, y: 0, controller: 'allies', value: 2, supply: 90, terrain: '평야', neighbors: ['normandy', 'philippines'] };
const normandy: Territory = { ...rear, id: 'normandy', name: '노르망디', controller: 'axis', siteType: 'fortress', terrain: '요새', theater: 'europe' };
const philippines: Territory = { ...normandy, id: 'philippines', name: '필리핀', theater: 'asia' };
const commander: Commander = { id: 'general', name: '지휘관', rank: '장군', attack: 85, defense: 80, logistics: 85, command: 85, trait: '시험', initials: 'M', color: '#999', specialty: '보병', fatigue: 0, loyalty: 80 };
const first: Division = { id: 'first', name: '제1사단', type: 'infantry', strength: 90, organization: 90, experience: 75, supply: 90, territoryId: 'rear', commanderId: 'general', status: 'combat' };
const second: Division = { ...first, id: 'second', name: '제2사단' };
const firstOrder = createOperationOrder({ divisionId: first.id, fromId: 'rear', targetId: normandy.id, startedWeek: 0 }, rear, normandy, first);
const secondOrder = createOperationOrder({ divisionId: second.id, fromId: 'rear', targetId: philippines.id, startedWeek: 0 }, rear, philippines, second);
const input = { week: 1, orders: [firstOrder, secondOrder], divisions: [first, second], commanders: [commander], territories: [rear, normandy, philippines], playerFaction: 'allies' as const, stance: 'balanced' as const, doctrine: 'methodical', enemyPressure: 50, intelNetwork: 75, policyAttackBonus: 0, priorityDivisionId: null, random: () => .5 };
const support: ActiveJointOperation = { id: 'support', templateId: 'close-air-support', name: '항공지원', kind: 'close-support', theater: 'europe', startedWeek: 0, elapsedWeeks: 2, minimumWeeks: 2, maximumWeeks: 4, progress: 100, successChance: 80, fleetIds: [], airGroupIds: ['fighter'], status: 'active', objectiveId: 'normandy-landing-sector' };

describe('simultaneous land operation scheduler', () => {
  it('advances both independent fronts in the same week without changing the input', () => {
    const result = resolveLandOrdersWeek(input);
    expect(result.entries.map((entry) => entry.kind)).toEqual(['battle', 'battle']);
    expect(result.orders.map((order) => order.elapsedWeeks)).toEqual([1, 1]);
    expect(input.orders.map((order) => order.elapsedWeeks)).toEqual([0, 0]);
    expect(result.orders.every((order) => (order.operationProgress ?? 0) > 0)).toBe(true);
  });
  it('does not let an invalid first order hold up the second front', () => {
    const result = resolveLandOrdersWeek({ ...input, orders: [{ ...firstOrder, targetId: 'missing' }, secondOrder] });
    expect(result.entries.map((entry) => entry.kind)).toEqual(['invalid', 'battle']);
    expect(result.orders[0]).toMatchObject({ divisionId: 'second', elapsedWeeks: 1 });
  });
  it('resolves a friendly movement and a hostile battle together', () => {
    const result = resolveLandOrdersWeek({ ...input, territories: [rear, { ...normandy, controller: 'allies' }, philippines] });
    expect(result.entries.map((entry) => entry.kind)).toEqual(['move', 'battle']);
    expect(result.orders.map((order) => order.divisionId)).toEqual(['second']);
    const movement = result.entries[0];
    expect(movement.kind === 'move' && movement.receipt).toMatchObject({ orderId: getOperationOrderId(firstOrder), outcome: 'reinforced', week: 1, elapsedWeeks: 0, progressPercent: 0 });
  });
  it('does not run one division twice and preserves a future order', () => {
    const result = resolveLandOrdersWeek({ ...input, orders: [firstOrder, { ...firstOrder, targetId: 'philippines' }, { ...secondOrder, startedWeek: 2 }] });
    expect(result.entries.map((entry) => entry.kind)).toEqual(['battle', 'invalid']);
    expect(result.orders.find((order) => order.divisionId === 'second')?.elapsedWeeks).toBe(0);
  });
  it('carries progress beyond 100 for long sieges and applies air support to the correct front once', () => {
    const progressed = { ...firstOrder, elapsedWeeks: 2, operationProgress: 105 };
    const baseline = resolveLandOrdersWeek({ ...input, orders: [progressed, secondOrder] });
    const supported = resolveLandOrdersWeek({ ...input, orders: [progressed, secondOrder], completedAirSupport: [support, support] });
    expect(supported.orders[0].operationProgress).toBe((baseline.orders[0].operationProgress ?? 0) + 12);
    expect(supported.orders[0].operationProgress).toBeGreaterThan(100);
    expect(supported.orders[1]).toEqual(baseline.orders[1]);
  });
  it('splits a support budget across eligible armies and excludes distant targets in the same theater', () => {
    const remote = { ...normandy, id: 'stalingrad', frontId: 'eastern-front' };
    const allocation = allocateCloseAirSupport([firstOrder, { ...secondOrder, targetId: 'normandy' }, { ...firstOrder, divisionId: 'third', targetId: remote.id }], [normandy, remote], [support]);
    expect([...allocation.values()]).toEqual([6, 6]);
    expect(allocation.has('third')).toBe(false);
  });

  it('cannot route support through a discarded duplicate order to a remote battle', () => {
    const remote = { ...normandy, id: 'stalingrad', frontId: 'eastern-front' };
    const result = resolveLandOrdersWeek({
      ...input, orders: [{ ...firstOrder, targetId: remote.id }, firstOrder],
      territories: [{ ...rear, neighbors: [...rear.neighbors, remote.id] }, normandy, remote], completedAirSupport: [support],
    });
    expect(result.entries.map((entry) => entry.kind)).toEqual(['battle', 'invalid']);
    const battle = result.entries[0];
    expect(battle.kind === 'battle' && battle.airSupport).toBe(0);
  });

  it('reserves support for valid battles instead of invalid, friendly, or future orders', () => {
    const friendly = { ...normandy, id: 'cherbourg', controller: 'allies' as const };
    const future = { ...first, id: 'future' };
    const result = resolveLandOrdersWeek({
      ...input,
      orders: [firstOrder, { ...firstOrder, divisionId: 'missing' }, { ...secondOrder, targetId: friendly.id }, { ...firstOrder, divisionId: future.id, startedWeek: 5 }],
      divisions: [first, second, future], territories: [{ ...rear, neighbors: [...rear.neighbors, friendly.id] }, normandy, friendly], completedAirSupport: [support],
    });
    expect(result.entries.map((entry) => entry.kind)).toEqual(['battle', 'invalid', 'move']);
    const battle = result.entries[0];
    expect(battle.kind === 'battle' && battle.airSupport).toBe(12);
  });

  it.each([
    ['normandy-landing-sector', 'europe', 'saint_lo'],
    ['normandy-landing-sector', 'europe', 'brittany'],
    ['channel-air-zone', 'europe', 'dunkirk'],
    ['solomons-air-zone', 'asia', 'bougainville'],
    ['solomons-air-zone', 'asia', 'tulagi'],
  ] as const)('uses real campaign front IDs for %s at %s/%s', (objectiveId, theater, targetId) => {
    expect(campaignTerritories.some((target) => target.id === targetId)).toBe(true);
    const allocated = allocateCloseAirSupport([{ ...firstOrder, targetId }], campaignTerritories, [{ ...support, objectiveId, theater }]);
    expect(allocated.get(first.id)).toBe(12);
  });

  it('allocates six points at half strength and zero points at zero strength', () => {
    const half = resolveLandOrdersWeek({ ...input, completedAirSupport: [{ ...support, effectStrength: .5 }] });
    const empty = resolveLandOrdersWeek({ ...input, completedAirSupport: [{ ...support, effectStrength: 0 }] });
    expect(half.entries[0].kind === 'battle' && half.entries[0].airSupport).toBe(6);
    expect(empty.entries[0].kind === 'battle' && empty.entries[0].airSupport).toBe(0);
    expect(half.orders[0].operationProgress).toBe((empty.orders[0].operationProgress ?? 0) + 6);
  });

  it('connects the actual completed joint mission strength to land support', () => {
    const joint = createJointForcesState('britain');
    joint.opponent.lastDecisionWeek = 100;
    joint.airGroups[0].aircraft /= 2;
    const jointContext = { week: 0, theater: 'europe' as const, game: { airPower: 62, navalPower: 58, intelNetwork: 70, enemyPressure: 56 } };
    const launched = launchJointOperation(joint, 'close-air-support', [], [joint.airGroups[0].id], jointContext, 'normandy-landing-sector')!.state;
    Object.assign(launched.operations[0], { progress: 120, minimumWeeks: 1, maximumWeeks: 1, successChance: 96 });
    const completed = advanceJointOperationsWeek(launched, { ...jointContext, week: 1 });
    const missions = getCompletedCloseAirSupport(launched.operations, completed.state.records, 1);
    expect(missions[0].effectStrength).toBe(.5);
    const result = resolveLandOrdersWeek({ ...input, completedAirSupport: missions });
    expect(result.entries[0].kind === 'battle' && result.entries[0].airSupport).toBe(6);
    expect(getCompletedCloseAirSupport(launched.operations, completed.state.records, 2)).toEqual([]);
  });

  it('reports only support points that fit in the remaining operation progress', () => {
    const result = resolveLandOrdersWeek({ ...input, orders: [{ ...firstOrder, operationProgress: 169 }], completedAirSupport: [support] });
    const battle = result.entries[0];
    expect(battle.kind === 'battle' && battle.airSupport).toBe(1);
  });

  it('writes the issuing order, commander and actual applied support into the report', () => {
    const result = resolveLandOrdersWeek({ ...input, completedAirSupport: [support] });
    const entry = result.entries[0];
    expect(entry.kind).toBe('battle');
    if (entry.kind !== 'battle') throw new Error('expected battle');
    expect(entry.resolution.report).toMatchObject({ orderId: getOperationOrderId(firstOrder), commanderId: first.commanderId, appliedAirSupport: 12 });
  });

  it('stops before combat with no random draws, capture, support or damage and preserves location', () => {
    const exhausted = { ...first, territoryId: 'actual-position', strength: 34, organization: 42, supply: 19 };
    const requested = requestLandOperationStop([{ ...firstOrder, commandCost: 5, operationProgress: 80, elapsedWeeks: 2 }], getOperationOrderId(firstOrder), {
      week: 2, phase: 'war', commandableDivisionIds: new Set([first.id]),
    });
    const original = structuredClone(exhausted);
    let rolls = 0;
    const result = resolveLandOrdersWeek({ ...input, week: 3, orders: requested.orders, divisions: [exhausted], completedAirSupport: [support], random: () => { rolls += 1; return .5; } });
    expect(rolls).toBe(0);
    expect(result.orders).toEqual([]);
    expect(result.entries).toHaveLength(1);
    const entry = result.entries[0];
    expect(entry.kind).toBe('stopped');
    if (entry.kind !== 'stopped') throw new Error('expected stop');
    expect(entry.division).toEqual(original);
    expect(entry.releasedStatus).toBe('recovering');
    expect(entry.order).toMatchObject({ commandCost: 5, operationProgress: 80, elapsedWeeks: 2 });
    expect(entry.receipt).toMatchObject({ orderId: getOperationOrderId(firstOrder), week: 3, divisionId: first.id, targetId: normandy.id });
    expect(normandy.controller).toBe('axis');
  });

  it('does not give a stopped order any share of support needed by the other battle', () => {
    const stopped = { ...firstOrder, stopRequestedWeek: 0 };
    const other = { ...secondOrder, targetId: 'normandy' };
    const result = resolveLandOrdersWeek({ ...input, orders: [stopped, other], completedAirSupport: [support] });
    expect(result.entries.map((entry) => entry.kind)).toEqual(['stopped', 'battle']);
    const battle = result.entries[1];
    expect(battle.kind === 'battle' && battle.airSupport).toBe(12);
    expect(result.orders).toHaveLength(1);
  });

  it('honors a persisted stop despite a changed friendly or removed target and missing commander', () => {
    for (const targets of [[rear, { ...normandy, controller: 'allies' as const }], [rear]]) {
      const result = resolveLandOrdersWeek({ ...input, orders: [{ ...firstOrder, stopRequestedWeek: 0 }], territories: targets, commanders: [] });
      expect(result.entries[0].kind).toBe('stopped');
      expect(result.orders).toEqual([]);
    }
  });

  it('cleans a missing stopped division without inventing one or blocking another front', () => {
    const result = resolveLandOrdersWeek({ ...input, orders: [{ ...firstOrder, stopRequestedWeek: 0 }, secondOrder], divisions: [second] });
    expect(result.entries.map((entry) => entry.kind)).toEqual(['invalid', 'battle']);
  });

  it('emits only one stop for duplicate orders and does not stop a new unrelated order', () => {
    const stopped = { ...firstOrder, stopRequestedWeek: 0 };
    const result = resolveLandOrdersWeek({ ...input, orders: [stopped, stopped, secondOrder] });
    expect(result.entries.map((entry) => entry.kind)).toEqual(['stopped', 'invalid', 'battle']);
    expect(result.orders[0].divisionId).toBe(second.id);
  });

  it('does not retroactively cancel a battle at or before the recorded request week', () => {
    const result = resolveLandOrdersWeek({ ...input, orders: [{ ...firstOrder, stopRequestedWeek: 1 }] });
    expect(result.entries[0].kind).toBe('battle');
    const next = resolveLandOrdersWeek({ ...input, week: 2, orders: result.orders });
    expect(next.entries[0].kind).toBe('stopped');
  });

  it.each(['neutral', 'not-adjacent', 'moved'] as const)('does not execute an invalidated %s assault or consume randomness', (change) => {
    const random = () => { throw new Error('invalid order must not roll combat'); };
    const result = resolveLandOrdersWeek({ ...input, orders: [firstOrder], random,
      territories: [change === 'not-adjacent' ? { ...rear, neighbors: [] } : rear, change === 'neutral' ? { ...normandy, controller: 'neutral' } : normandy],
      divisions: [change === 'moved' ? { ...first, territoryId: 'elsewhere' } : first],
    });
    expect(result.entries[0].kind).toBe('invalid');
    const entry = result.entries[0];
    expect(entry.kind === 'invalid' && entry.receipt).toMatchObject({ orderId: getOperationOrderId(firstOrder), outcome: 'invalidated', week: 1 });
    expect(result.orders).toEqual([]);
    expect(firstOrder.elapsedWeeks).toBe(0);
  });

  it('retains the paid cost and progress in a terminal receipt even without a battle report', () => {
    const result = resolveLandOrdersWeek({ ...input, orders: [{ ...firstOrder, commandCost: 5, targetId: 'missing', operationProgress: 42, operationRequired: 170, elapsedWeeks: 2 }] });
    const entry = result.entries[0];
    expect(entry.kind === 'invalid' && entry.receipt).toMatchObject({ orderId: getOperationOrderId(firstOrder), outcome: 'invalidated', commandCost: 5, elapsedWeeks: 2, progressPercent: 25 });
  });

  it.each(['allies', 'axis'] as const)('invalidates saved land orders aimed at a %s sea zone before reinforcement or combat', (controller) => {
    const sea: Territory = { ...normandy, id: 'channel', name: '영불해협 해역', siteType: 'sea', controller };
    const origin = { ...rear, neighbors: [sea.id] };
    const saved = { ...firstOrder, targetId: sea.id, commandCost: 5, elapsedWeeks: 3, operationProgress: 80 };
    const before = JSON.stringify({ origin, sea, division: first, saved });
    const result = resolveLandOrdersWeek({ ...input, orders: [saved], territories: [origin, sea],
      random: () => { throw new Error('sea orders cannot roll land combat'); },
    });
    expect(result.orders).toEqual([]);
    expect(result.entries).toHaveLength(1);
    const entry = result.entries[0];
    expect(entry.kind).toBe('invalid');
    expect(entry.kind === 'invalid' && entry.receipt).toMatchObject({ outcome: 'invalidated', commandCost: 5, elapsedWeeks: 3, targetId: sea.id });
    expect(JSON.stringify({ origin, sea, division: first, saved })).toBe(before);
  });

  it.each(['allies', 'axis'] as const)('blocks saved Tunisia–Sicily crossings even when Sicily is %s', (controller) => {
    const origin = campaignTerritories.find((item) => item.id === 'tunisia')!;
    const target = { ...campaignTerritories.find((item) => item.id === 'sicily')!, controller };
    const division = { ...first, territoryId: origin.id };
    const saved = createOperationOrder({ divisionId: division.id, fromId: origin.id, targetId: target.id, startedWeek: 0 }, origin, target, division);
    const result = resolveLandOrdersWeek({ ...input, orders: [saved], divisions: [division], territories: [origin, target],
      random: () => { throw new Error('sea crossings cannot roll land combat'); },
    });
    expect(result.entries.map((entry) => entry.kind)).toEqual(['invalid']);
    expect(result.orders).toEqual([]);
    expect(division.territoryId).toBe('tunisia');
    expect(target.controller).toBe(controller);
  });

  it('does not execute a legacy order originating inside a sea zone or impede the other land front', () => {
    const sea: Territory = { ...rear, id: 'channel', siteType: 'sea' };
    const atSea = { ...first, territoryId: sea.id };
    const saved = { ...firstOrder, fromId: sea.id };
    const result = resolveLandOrdersWeek({ ...input, orders: [saved, secondOrder], divisions: [atSea, second], territories: [sea, rear, normandy, philippines] });
    expect(result.entries.map((entry) => entry.kind)).toEqual(['invalid', 'battle']);
    expect(result.orders.map((order) => order.divisionId)).toEqual([second.id]);
    expect(atSea.territoryId).toBe('channel');
  });
});
