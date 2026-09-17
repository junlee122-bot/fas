import { describe, expect, it } from 'vitest';
import {
  advanceJointOperationsWeek,
  createJointForcesState,
  forecastJointOperation,
  getCompletedCloseAirSupport,
  getCounterOperationTemplateIds,
  launchJointOperation,
  normalizeJointForcesState,
  recoverPeacetimeJointForces,
  respondToJointCommandMessage,
  sendJointForceToRefit,
  standDownJointOperationsForPeace,
} from './jointOperations';

const context = {
  week: 0,
  theater: 'europe' as const,
  game: { airPower: 62, navalPower: 58, intelNetwork: 70, enemyPressure: 56 },
};

describe('joint operations', () => {
  it('stands down existing war missions once without healing, refunding or releasing a sea escort', () => {
    const initial = createJointForcesState('britain');
    const launched = launchJointOperation(initial, 'atlantic-lifeline', [initial.fleets[1].id], [initial.airGroups[1].id], context)!;
    const state = launched.state;
    Object.assign(state.fleets[0], { status: 'assigned', assignmentId: 'sea-escort-active', readiness: 25, organization: 15, ships: 2 });
    Object.assign(state.fleets[1], { readiness: 41, organization: 33, ships: 5 });
    Object.assign(state.airGroups[1], { readiness: 42, serviceability: 28, aircraft: 6 });
    state.commandMessages.push({ id: 'pending-peace', week: 0, operationId: launched.operation.id,
      commander: '지휘관', office: '전대', subject: '작전 확인', body: '작전을 계속합니까?', status: 'pending', response: null });
    // A stale roster may still mention an escort, but its explicit sea owner wins.
    state.operations[0].fleetIds.push(state.fleets[0].id);
    const before = structuredClone(state);
    const result = standDownJointOperationsForPeace(recoverPeacetimeJointForces(state), 1);
    expect(result.state.operations).toEqual([]);
    expect(result.state.fleets[0]).toBe(state.fleets[0]);
    expect(result.state.fleets[1]).toEqual({ ...state.fleets[1], status: 'refit', assignmentId: null });
    expect(result.state.airGroups[1]).toEqual({ ...state.airGroups[1], status: 'refit', assignmentId: null });
    expect(result.state.records.at(-1)).toMatchObject({ id: `record-${launched.operation.id}`, outcome: 'setback', endedWeek: 1 });
    expect(result.state.records.at(-1)?.result).toContain('교전 패배 판정이 아닙니다');
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({ resolved: true, tone: 'neutral', side: 'player' });
    expect(result.state.commandMessages.find((message) => message.id === 'pending-peace')).toMatchObject({ status: 'resolved', response: 'report' });
    expect(result.state.opponent).toBe(state.opponent);
    expect(result.state.theaterControl).toBe(state.theaterControl);
    expect(result.state.objectives).toBe(state.objectives);
    expect(result.state.commandTrust).toBe(state.commandTrust);
    expect(result.state.engagements).toBe(state.engagements);
    expect(state).toEqual(before);
    const repeated = standDownJointOperationsForPeace(result.state, 2);
    expect(repeated).toEqual({ state: result.state, events: [] });
    expect(repeated.state).toBe(result.state);
    const nextWeek = recoverPeacetimeJointForces(result.state);
    expect(nextWeek.fleets[1].readiness).toBe(48);
    expect(nextWeek.airGroups[1].readiness).toBe(50);
  });

  it('does not invent ownership or stand down a future mission at an invalid peace week', () => {
    const initial = createJointForcesState('britain');
    const state = launchJointOperation(initial, 'fighter-sweep', [], [initial.airGroups[0].id], { ...context, week: 5 })!.state;
    for (const week of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5, 4]) {
      expect(standDownJointOperationsForPeace(state, week)).toEqual({ state, events: [] });
    }
    state.airGroups[0].assignmentId = 'external-air-reservation';
    state.fleets[0].status = 'assigned';
    state.fleets[0].assignmentId = null;
    const result = standDownJointOperationsForPeace(state, 6);
    expect(result.state.airGroups[0]).toBe(state.airGroups[0]);
    expect(result.state.fleets[0]).toBe(state.fleets[0]);
    expect(result.state.operations).toEqual([]);
    expect(result.events).toHaveLength(1);
  });

  it.each(['assigned', 'ready'] as const)('preserves an external sea escort with %s status across joint weeks and save restore', (status) => {
    const state = createJointForcesState('britain');
    state.opponent.lastDecisionWeek = 100;
    Object.assign(state.fleets[1], { status, assignmentId: 'sea-britain-8-expedition', ships: 3, readiness: 31, organization: 27 });
    const escort = structuredClone(state.fleets[1]);
    const restored = normalizeJointForcesState(state, 'britain');
    let current = restored;
    for (let week = 1; week <= 4; week += 1) current = advanceJointOperationsWeek(current, { ...context, week }).state;
    expect(current.fleets[1]).toEqual(escort);
    expect(current.fleets[1]).toBe(restored.fleets[1]);
    expect(state.fleets[1]).toEqual(escort);
    expect(current.operations).toEqual([]);
  });

  it('does not silently release an assigned force whose owner is unknown or absent', () => {
    const state = createJointForcesState('britain');
    state.opponent.lastDecisionWeek = 100;
    Object.assign(state.fleets[0], { status: 'assigned', assignmentId: 'external-escort-owner' });
    Object.assign(state.airGroups[0], { status: 'assigned', assignmentId: null });
    const result = advanceJointOperationsWeek(state, { ...context, week: 1 });
    expect(result.state.fleets[0]).toBe(state.fleets[0]);
    expect(result.state.airGroups[0]).toBe(state.airGroups[0]);
  });

  it.each(['assigned', 'ready'] as const)('blocks launching and refitting a %s force with an external reservation', (status) => {
    const state = createJointForcesState('britain');
    Object.assign(state.fleets[1], { status, assignmentId: 'sea-reserved-escort' });
    expect(forecastJointOperation(state, 'atlantic-lifeline', [state.fleets[1].id], [state.airGroups[1].id], context)?.warning).toContain('배속');
    expect(launchJointOperation(state, 'atlantic-lifeline', [state.fleets[1].id], [state.airGroups[1].id], context)).toBeNull();
    expect(sendJointForceToRefit(state, state.fleets[1].id)).toBe(state);
    Object.assign(state.airGroups[0], { status, assignmentId: 'external-air-support' });
    expect(launchJointOperation(state, 'fighter-sweep', [], [state.airGroups[0].id], context)).toBeNull();
    expect(sendJointForceToRefit(state, state.airGroups[0].id)).toBe(state);
  });

  it('rejects duplicate or missing requested formations rather than silently changing the roster', () => {
    const state = createJointForcesState('britain');
    const fleet = state.fleets[1].id; const air = state.airGroups[1].id;
    for (const [fleets, groups] of [[[fleet, fleet], [air]], [[fleet], [air, air]], [[fleet, 'missing-fleet'], [air]], [[fleet], [air, 'missing-air']]]) {
      expect(forecastJointOperation(state, 'atlantic-lifeline', fleets, groups, context)?.warning).not.toBeNull();
      expect(launchJointOperation(state, 'atlantic-lifeline', fleets, groups, context)).toBeNull();
    }
  });

  it('checks an existing operation roster even if the unit status and assignment were stale', () => {
    const initial = createJointForcesState('britain');
    const state = launchJointOperation(initial, 'fighter-sweep', [], [initial.airGroups[0].id], context)!.state;
    Object.assign(state.airGroups[0], { status: 'ready', assignmentId: null });
    expect(launchJointOperation(state, 'fighter-sweep', [], [state.airGroups[0].id], context)).toBeNull();
    expect(sendJointForceToRefit(state, state.airGroups[0].id)).toBe(state);
    expect(recoverPeacetimeJointForces(state).airGroups[0]).toBe(state.airGroups[0]);
  });

  it('cannot borrow an externally reserved escort through a stale joint-operation roster', () => {
    const initial = createJointForcesState('britain');
    initial.opponent.lastDecisionWeek = 100;
    const state = launchJointOperation(initial, 'atlantic-lifeline', [initial.fleets[1].id], [initial.airGroups[1].id], context)!.state;
    Object.assign(state.operations[0], { progress: 120, minimumWeeks: 1, maximumWeeks: 1, successChance: 96 });
    Object.assign(state.fleets[1], { assignmentId: 'sea-new-owner', ships: 4, readiness: 44, organization: 38 });
    const escort = structuredClone(state.fleets[1]);
    const result = advanceJointOperationsWeek(state, { ...context, week: 1 });
    expect(result.state.fleets[1]).toEqual(escort);
    expect(result.state.engagements).toEqual([]);
    expect(result.state.records[0]).toMatchObject({ outcome: 'setback', finalForceStrength: 0 });
    expect(result.gameDelta.victoryScore ?? 0).toBe(0);
  });

  it('recovers idle and refit player forces in peace without enemy orders or free ships', () => {
    const state = createJointForcesState('britain');
    Object.assign(state.fleets[0], { ships: 3, readiness: 70, organization: 60 });
    Object.assign(state.fleets[1], { status: 'refit', ships: 0, readiness: 91, organization: 80 });
    Object.assign(state.airGroups[0], { status: 'refit', aircraft: 3, readiness: 88, serviceability: 90 });
    const before = structuredClone(state);
    const result = recoverPeacetimeJointForces(state);
    expect(result.fleets[0]).toMatchObject({ ships: 3, readiness: 72, organization: 62, status: 'ready' });
    expect(result.fleets[1]).toMatchObject({ ships: 0, readiness: 98, organization: 86, status: 'ready' });
    expect(result.airGroups[0]).toMatchObject({ aircraft: 3, readiness: 96, serviceability: 97, status: 'ready' });
    expect(result.opponent).toBe(state.opponent);
    expect(result.objectives).toBe(state.objectives);
    expect(result.theaterControl).toBe(state.theaterControl);
    expect(result.operations).toBe(state.operations);
    expect(state).toEqual(before);
  });

  it('keeps peace refits in progress below threshold and preserves all external force reservations', () => {
    const state = createJointForcesState('britain');
    Object.assign(state.fleets[0], { status: 'refit', readiness: 50, organization: 40 });
    Object.assign(state.fleets[1], { status: 'assigned', assignmentId: 'sea-escort', readiness: 12 });
    Object.assign(state.airGroups[0], { status: 'ready', assignmentId: 'external-owner', readiness: 12 });
    const result = recoverPeacetimeJointForces(state);
    expect(result.fleets[0]).toMatchObject({ status: 'refit', readiness: 57, organization: 46 });
    expect(result.fleets[1]).toBe(state.fleets[1]);
    expect(result.airGroups[0]).toBe(state.airGroups[0]);
  });

  it('creates distinct historical force structures for every campaign nation', () => {
    const british = createJointForcesState('britain');
    const japanese = createJointForcesState('japan');
    const korean = createJointForcesState('korea');
    expect(british.fleets[0].name).toBe('본국함대');
    expect(japanese.fleets.some((unit) => unit.kind === 'carrier')).toBe(true);
    expect(korean.fleets.every((unit) => ['clandestine', 'coastal'].includes(unit.kind))).toBe(true);
  });

  it('requires a compatible assigned force before launch', () => {
    const state = createJointForcesState('britain');
    const invalid = forecastJointOperation(state, 'fighter-sweep', [], [], context);
    expect(invalid?.warning).toContain('필요');
    const valid = forecastJointOperation(state, 'fighter-sweep', [], [state.airGroups[0].id], context);
    expect(valid?.warning).toBeNull();
    expect(valid?.chance).toBeGreaterThan(10);
  });

  it('reduces the same air mission forecast for losses and blocks a zero-aircraft group', () => {
    const state = createJointForcesState('britain');
    const group = state.airGroups[0];
    const full = forecastJointOperation(state, 'fighter-sweep', [], [group.id], context)!;
    group.aircraft = Math.floor(group.aircraft / 2);
    const depleted = forecastJointOperation(state, 'fighter-sweep', [], [group.id], context)!;
    expect(depleted.chance).toBeLessThan(full.chance);
    expect(depleted.factors.join(' ')).toContain('전력 충족률');
    group.aircraft = 0;
    const empty = forecastJointOperation(state, 'fighter-sweep', [], [group.id], context)!;
    expect(empty.chance).toBe(0);
    expect(empty.warning).toContain('0대');
    expect(launchJointOperation(state, 'fighter-sweep', [], [group.id], context)).toBeNull();
  });

  it('reduces a combined mission for ship losses and cannot replace zero ships with aircraft', () => {
    const state = createJointForcesState('britain');
    const fleet = state.fleets[1];
    const airId = state.airGroups[1].id;
    const full = forecastJointOperation(state, 'atlantic-lifeline', [fleet.id], [airId], context)!;
    fleet.ships = Math.floor(fleet.ships / 2);
    const depleted = forecastJointOperation(state, 'atlantic-lifeline', [fleet.id], [airId], context)!;
    expect(depleted.chance).toBeLessThan(full.chance);
    fleet.ships = 0;
    const empty = forecastJointOperation(state, 'atlantic-lifeline', [fleet.id], [airId], context)!;
    expect(empty.chance).toBe(0);
    expect(empty.warning).toContain('0척');
    expect(launchJointOperation(state, 'atlantic-lifeline', [fleet.id], [airId], context)).toBeNull();
  });

  it('uses current aircraft strength in weekly progress under the same deterministic seed', () => {
    const initial = createJointForcesState('britain');
    initial.opponent.lastDecisionWeek = 100;
    const full = launchJointOperation(initial, 'fighter-sweep', [], [initial.airGroups[0].id], context)!.state;
    const depleted = structuredClone(full);
    depleted.airGroups[0].aircraft = Math.floor(depleted.airGroups[0].aircraft / 2);
    const fullWeek = advanceJointOperationsWeek(full, { ...context, week: 1 });
    const depletedWeek = advanceJointOperationsWeek(depleted, { ...context, week: 1 });
    expect(depletedWeek.state.operations[0].id).toBe(fullWeek.state.operations[0].id);
    expect(depletedWeek.state.operations[0].progress).toBeLessThan(fullWeek.state.operations[0].progress);
  });

  it('scales successful campaign effects to surviving strength under the same deterministic seed', () => {
    const initial = createJointForcesState('britain');
    initial.opponent.lastDecisionWeek = 100;
    const full = launchJointOperation(initial, 'fighter-sweep', [], [initial.airGroups[0].id], context)!.state;
    Object.assign(full.operations[0], { progress: 120, minimumWeeks: 1, maximumWeeks: 1, successChance: 96 });
    const depleted = structuredClone(full);
    depleted.airGroups[0].aircraft = Math.floor(depleted.airGroups[0].aircraft / 2);
    depleted.operations[0].initialForceStrength = .5;
    const fullWeek = advanceJointOperationsWeek(full, { ...context, week: 1 });
    const depletedWeek = advanceJointOperationsWeek(depleted, { ...context, week: 1 });
    expect(fullWeek.state.records[0].outcome).toBe('success');
    expect(depletedWeek.state.records[0].outcome).toBe('success');
    expect(depletedWeek.state.records[0].finalForceStrength).toBe(.5);
    expect(depletedWeek.gameDelta.victoryScore).toBeLessThan(fullWeek.gameDelta.victoryScore!);
    const targetId = full.operations[0].objectiveId;
    expect(depletedWeek.state.objectives.europe.find((target) => target.id === targetId)!.control)
      .toBeLessThan(fullWeek.state.objectives.europe.find((target) => target.id === targetId)!.control);
  });

  it('aborts a depleted in-flight operation without ghost aircraft losses or target damage', () => {
    const initial = createJointForcesState('britain');
    initial.opponent.lastDecisionWeek = 100;
    const state = launchJointOperation(initial, 'fighter-sweep', [], [initial.airGroups[0].id], context)!.state;
    Object.assign(state.operations[0], { progress: 120, successChance: 96 });
    state.airGroups[0].aircraft = 0;
    const result = advanceJointOperationsWeek(state, { ...context, week: 1 });
    expect(result.state.operations).toHaveLength(0);
    expect(result.state.records[0].outcome).toBe('setback');
    expect(result.aircraftDelta).toBe(0);
    expect(result.state.objectives).toEqual(state.objectives);
  });

  it('applies interception losses before resolving the last aircraft mission', () => {
    const initial = createJointForcesState('britain');
    initial.opponent.lastDecisionWeek = 100;
    const state = launchJointOperation(initial, 'fighter-sweep', [], [initial.airGroups[0].id], context, 'ruhr-industrial-area')!.state;
    const operation = state.operations[0];
    Object.assign(operation, { progress: 120, minimumWeeks: 1, maximumWeeks: 1, successChance: 96 });
    state.airGroups[0].aircraft = 1;
    const enemyGroup = state.opponent.airGroups[0];
    const enemyId = 'enemy-last-aircraft-interception';
    enemyGroup.assignmentId = enemyId;
    enemyGroup.status = 'assigned';
    state.opponent.operations = [{
      ...operation, id: enemyId, templateId: 'strategic-air-campaign', kind: 'strategic-bombing',
      airGroupIds: [enemyGroup.id], progress: 0, minimumWeeks: 5, maximumWeeks: 10,
      detected: true, intelligenceConfidence: 100, detectedWeek: 0, target: '루르 산업지대',
    }];
    const result = advanceJointOperationsWeek(state, { ...context, week: 1 });
    expect(result.state.engagements).toHaveLength(1);
    expect(result.state.airGroups[0].aircraft).toBe(0);
    expect(result.aircraftDelta).toBe(-1);
    expect(result.state.records[0].outcome).toBe('setback');
    expect(result.state.objectives).toEqual(state.objectives);
  });

  it('caps recorded air losses at aircraft actually available', () => {
    const initial = createJointForcesState('britain');
    initial.opponent.lastDecisionWeek = 100;
    const state = launchJointOperation(initial, 'fighter-sweep', [], [initial.airGroups[0].id], context)!.state;
    state.airGroups[0].aircraft = 2;
    Object.assign(state.operations[0], { maximumWeeks: 1, successChance: 1 });
    const result = advanceJointOperationsWeek(state, { ...context, week: 1 });
    expect(result.state.airGroups[0].aircraft).toBe(0);
    expect(result.aircraftDelta).toBe(-2);
    expect(result.state.records[0].losses).toContain('항공기 2대');
  });

  it('keeps historical authorized strength and losses when migrating old saves', () => {
    const original = createJointForcesState('britain');
    const expected = original.airGroups[0].aircraft;
    const legacy = structuredClone(original);
    delete legacy.airGroups[0].authorizedAircraft;
    legacy.airGroups[0].aircraft = Math.floor(expected / 2);
    delete legacy.fleets[0].authorizedShips;
    legacy.fleets[0].ships = 0;
    const restored = normalizeJointForcesState(legacy, 'britain');
    expect(restored.airGroups[0].authorizedAircraft).toBe(expected);
    expect(restored.airGroups[0].aircraft).toBe(Math.floor(expected / 2));
    expect(restored.fleets[0].ships).toBe(0);
    expect(forecastJointOperation(restored, 'fighter-sweep', [], [restored.airGroups[0].id], context)!.chance)
      .toBeLessThan(forecastJointOperation(original, 'fighter-sweep', [], [original.airGroups[0].id], context)!.chance);
  });

  it('does not let the opponent launch zero-strength formations', () => {
    const state = createJointForcesState('britain');
    state.opponent.fleets.forEach((unit) => { unit.ships = 0; });
    state.opponent.airGroups.forEach((unit) => { unit.aircraft = 0; });
    const result = advanceJointOperationsWeek(state, { ...context, week: 1 });
    expect(result.state.opponent.operations).toHaveLength(0);
  });

  it('does not provide land support for failed or other-week joint records', () => {
    const state = createJointForcesState('britain');
    state.opponent.lastDecisionWeek = 100;
    const launched = launchJointOperation(state, 'close-air-support', [], [state.airGroups[0].id], context)!.state;
    launched.airGroups[0].aircraft = 0;
    const result = advanceJointOperationsWeek(launched, { ...context, week: 1 });
    expect(result.state.records[0].finalForceStrength).toBe(0);
    expect(getCompletedCloseAirSupport(launched.operations, result.state.records, 1)).toEqual([]);
  });

  it('locks assigned units and resolves a multi-week operation', () => {
    let state = createJointForcesState('britain');
    const launched = launchJointOperation(state, 'fighter-sweep', [], [state.airGroups[0].id], context);
    expect(launched).not.toBeNull();
    state = launched!.state;
    expect(state.airGroups[0].status).toBe('assigned');
    expect(state.operations[0].maximumWeeks).toBeGreaterThan(1);

    let resolved = false;
    for (let week = 1; week <= 8; week += 1) {
      const result = advanceJointOperationsWeek(state, { ...context, week });
      state = result.state;
      resolved ||= result.events.some((event) => event.resolved);
      if (state.operations.length === 0) break;
    }
    expect(resolved).toBe(true);
    expect(state.operations).toHaveLength(0);
    expect(state.records).toHaveLength(1);
    expect(state.airGroups[0].status).toBe('ready');
  });

  it('supports refit and migrates absent save data', () => {
    const state = createJointForcesState('usa');
    const refitting = sendJointForceToRefit(state, state.fleets[0].id);
    expect(refitting.fleets[0].status).toBe('refit');
    expect(normalizeJointForcesState(null, 'usa').fleets).toHaveLength(2);
  });

  it('plans an opposing operation from the actual enemy force structure', () => {
    const state = createJointForcesState('britain');
    const result = advanceJointOperationsWeek(state, { ...context, week: 1, game: { ...context.game, intelNetwork: 100 } });
    expect(result.state.opponent.nationId).toBe('germany');
    expect(result.state.opponent.operations).toHaveLength(1);
    expect(result.state.opponent.operations[0].fleetIds[0]).toContain('germany-fleet');
    expect(result.state.opponent.operations[0].detected).toBe(true);
    expect(result.events.some((event) => event.side === 'enemy')).toBe(true);
  });

  it('turns escort and air cover into a concrete interception against submarine warfare', () => {
    const initial = createJointForcesState('britain');
    const launched = launchJointOperation(initial, 'atlantic-lifeline', [initial.fleets[1].id], [initial.airGroups[1].id], context);
    expect(launched).not.toBeNull();
    const result = advanceJointOperationsWeek(launched!.state, { ...context, week: 1 });
    expect(result.state.opponent.operations[0].kind).toBe('submarine-raiding');
    expect(result.state.engagements).toHaveLength(1);
    expect(result.state.engagements[0].domain).toBe('sea');
    expect(result.state.opponent.operations[0].detected).toBe(true);
    expect(result.state.theaterControl.europe.sea).not.toBe(50);
  });

  it('shows valid counter plans and lets command trust alter an active operation', () => {
    const state = createJointForcesState('usa');
    expect(getCounterOperationTemplateIds('carrier-strike', 'asia')).toContain('fighter-sweep');
    const launched = launchJointOperation(state, 'fighter-sweep', [], [state.airGroups[1].id], { ...context, theater: 'asia' });
    const message = launched!.state.commandMessages[0];
    const answered = respondToJointCommandMessage(launched!.state, message.id, 'back');
    expect(answered?.commandCost).toBe(3);
    expect(answered?.state.commandTrust).toBe(54);
    expect(answered?.state.operations[0].successChance).toBe(launched!.operation.successChance + 6);
    expect(answered?.state.commandMessages[0].status).toBe('resolved');
  });

  it('migrates version-one joint saves without losing player operations', () => {
    const state = createJointForcesState('japan');
    const legacy = { ...state, version: 1, opponent: undefined, engagements: undefined, commandMessages: undefined, theaterControl: undefined };
    const restored = normalizeJointForcesState(legacy, 'japan');
    expect(restored.version).toBe(3);
    expect(restored.opponent.nationId).toBe('usa');
    expect(restored.theaterControl.asia.sea).toBe(50);
    expect(restored.objectives.asia.length).toBeGreaterThanOrEqual(6);
  });

  it('resolves enemy operations over several weeks instead of applying an instant attack', () => {
    let state = createJointForcesState('britain');
    let resolvedEvent = false;
    for (let week = 1; week <= 12; week += 1) {
      const result = advanceJointOperationsWeek(state, { ...context, week });
      state = result.state;
      resolvedEvent ||= result.events.some((event) => event.side === 'enemy' && event.resolved);
      if (state.opponent.records.length) break;
    }
    expect(resolvedEvent).toBe(true);
    expect(state.opponent.records).toHaveLength(1);
    expect(state.opponent.records[0].endedWeek - state.opponent.records[0].startedWeek).toBeGreaterThanOrEqual(2);
  });

  it('attaches a concrete theater objective and exposes civilian risk before launch', () => {
    const state = createJointForcesState('usa');
    const bomber = state.airGroups.find((group) => group.kind === 'bomber')!;
    const forecast = forecastJointOperation(state, 'strategic-air-campaign', [], [bomber.id], context, 'ruhr-industrial-area');
    expect(forecast?.objective?.name).toBe('루르 산업지대');
    expect(forecast?.civilianWarning).toContain('민간 노출');
    const launched = launchJointOperation(state, 'strategic-air-campaign', [], [bomber.id], context, 'ruhr-industrial-area');
    expect(launched?.operation.objectiveId).toBe('ruhr-industrial-area');
  });

  it('persists resolved operation effects in the targeted campaign area', () => {
    let state = createJointForcesState('usa');
    const bomber = state.airGroups.find((group) => group.kind === 'bomber')!;
    const before = state.objectives.europe.find((objective) => objective.id === 'ruhr-industrial-area')!;
    state = launchJointOperation(state, 'strategic-air-campaign', [], [bomber.id], context, before.id)!.state;
    let accountabilityEvent = false;
    let legitimacyCost = 0;
    for (let week = 1; week <= 12 && state.operations.length; week += 1) {
      const result = advanceJointOperationsWeek(state, { ...context, week });
      state = result.state;
      accountabilityEvent ||= result.events.some((event) => event.title.includes('민간 피해 조사'));
      legitimacyCost += result.gameDelta.warSupport ?? 0;
    }
    const after = state.objectives.europe.find((objective) => objective.id === before.id)!;
    expect(after.lastChangedWeek).toBeGreaterThan(0);
    expect(after.damage).toBeGreaterThan(before.damage);
    expect(state.records[0].objectiveName).toBe(before.name);
    expect(state.records[0].campaignChanges?.length).toBeGreaterThan(0);
    expect(accountabilityEvent).toBe(true);
    expect(legitimacyCost).toBeLessThan(0);
  });
});
