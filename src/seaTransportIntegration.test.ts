import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { advanceJointOperationsWeek, createJointForcesState, launchJointOperation, recoverPeacetimeJointForces, type JointForcesState } from './jointOperations';
import { advanceSeaTransportWeek, createSeaTransportState, dispatchSeaTransportEscortRelief, getSeaTransportBusyFleetIds, launchSeaTransport, launchSeaTransportRescue, normalizeSeaTransportState, type SeaTransportContext, type SeaTransportResult } from './seaTransport';
import { applySeaTransportAirGroupUpdates, applySeaTransportFleetUpdates, getLiveSeaTransportContext, reconcileSeaTransportEscortAssignments } from './seaTransportIntegration';

function context(): SeaTransportContext {
  const jointForces = createJointForcesState('britain');
  jointForces.theaterControl.europe = { sea: 100, air: 100, intelligence: 100, trend: 0, lastChangedWeek: 0 };
  return { week: 0, nationId: 'britain', playerFaction: 'allies', phase: 'war',
    territories, divisions: [{ id: 'transport-test-unit', name: '검증 기갑군', type: 'armor', territoryId: 'britain', status: 'ready', strength: 90, organization: 90, supply: 90, experience: 50, commanderId: 'player' }], orders: [],
    commandableDivisionIds: new Set(['transport-test-unit']), canCommandEscort: true, jointForces,
    game: { week: 0, manpower: 400, politicalPower: 100, fuel: 200, steel: 50, factories: 10, stability: 70, warSupport: 70, commandPoints: 100, treasury: 100, victoryScore: 0, airPower: 80, navalPower: 80, intelNetwork: 60, enemyPressure: 25 },
    stockpile: { infantryEquipment: 100, tanks: 10, aircraft: 10, convoys: 100, artillery: 20, trucks: 10 },
  };
}
function approve(input = context()) {
  const result = launchSeaTransport(createSeaTransportState(), { divisionId: input.divisions[0].id, fromId: 'britain', targetId: 'belfast', escortFleetId: input.jointForces.fleets[0].id }, input);
  expect(result.accepted).toBe(true);
  return result;
}
function apply(input: SeaTransportContext, result: SeaTransportResult, joint: JointForcesState = input.jointForces): SeaTransportContext {
  return { ...input, jointForces: applySeaTransportAirGroupUpdates(applySeaTransportFleetUpdates(joint, result.fleetUpdates), result.airGroupUpdates),
    game: { ...input.game, commandPoints: input.game.commandPoints + (result.gameDelta.commandPoints ?? 0), fuel: input.game.fuel + (result.gameDelta.fuel ?? 0) },
    stockpile: { ...input.stockpile, convoys: input.stockpile.convoys + result.convoyDelta },
    divisions: input.divisions.map((division) => result.divisionUpdates.find((update) => update.id === division.id) ?? division),
  };
}

describe('sea and joint fleet settlement integration', () => {
  it('merges only existing formations and leaves unrelated references untouched', () => {
    const joint = createJointForcesState('britain');
    const updated = { ...joint.fleets[0], readiness: 15 };
    const result = applySeaTransportFleetUpdates(joint, [updated, { ...updated, id: 'foreign-fleet' }]);
    expect(result.fleets).toHaveLength(joint.fleets.length);
    expect(result.fleets[0]).toBe(updated);
    expect(result.fleets[1]).toBe(joint.fleets[1]);
    expect(result.airGroups).toBe(joint.airGroups);
    expect(applySeaTransportFleetUpdates(joint)).toBe(joint);
  });
  it('patches only existing air groups and does not import a foreign formation', () => {
    const joint = createJointForcesState('britain'); const group = { ...joint.airGroups[0], readiness: 20 };
    const patched = applySeaTransportAirGroupUpdates(joint, [group, { ...group, id: 'foreign-air' }]);
    expect(patched.airGroups).toHaveLength(joint.airGroups.length); expect(patched.airGroups[0]).toBe(group);
    expect(patched.fleets).toBe(joint.fleets); expect(applySeaTransportAirGroupUpdates(joint)).toBe(joint);
  });
  it('restores every layered escort lock without stealing an air group from a joint mission', () => {
    const input = context(); const fleetIds = input.jointForces.fleets.map((fleet) => fleet.id); const airId = input.jointForces.airGroups[0].id;
    const result = launchSeaTransport(createSeaTransportState(), { divisionId: input.divisions[0].id, fromId: 'britain', targetId: 'belfast', escortFleetIds: fleetIds, airGroupIds: [airId] }, input);
    expect(result.accepted, result.reason).toBe(true);
    const restored = reconcileSeaTransportEscortAssignments(input.jointForces, normalizeSeaTransportState(JSON.parse(JSON.stringify(result.state))));
    expect(restored.fleets.every((fleet) => fleet.assignmentId === result.state.operations[0].id)).toBe(true);
    expect(restored.airGroups[0].assignmentId).toBe(result.state.operations[0].id);
    const joint = launchJointOperation(input.jointForces, 'fighter-sweep', [], [airId], { week: 0, theater: 'europe', game: input.game })!;
    expect(joint).not.toBeNull();
    expect(reconcileSeaTransportEscortAssignments(joint.state, result.state).airGroups[0].assignmentId).toBe(joint.operation.id);
    const orphan = reconcileSeaTransportEscortAssignments(restored, createSeaTransportState());
    expect(orphan.airGroups[0]).toMatchObject({ assignmentId: null, status: 'refit' });
  });

  it.each(['war', 'nation'] as const)('retains escort fatigue, assignment and release through actual %s weekly settlement', (phase) => {
    let input = { ...context(), phase }; let result = approve(input); input = apply(input, result);
    const operationId = result.state.operations[0].id; const fleetId = input.jointForces.fleets[0].id;
    const initialShips = input.jointForces.fleets[0].ships;
    for (let week = 1; week <= 4; week += 1) {
      input = { ...input, week };
      const fleetBefore = input.jointForces.fleets[0];
      const joint = phase === 'war' ? advanceJointOperationsWeek(input.jointForces, { week, theater: 'europe', game: input.game }).state : recoverPeacetimeJointForces(input.jointForces);
      expect(joint.fleets[0]).toMatchObject({ readiness: fleetBefore.readiness, organization: fleetBefore.organization, assignmentId: operationId });
      result = advanceSeaTransportWeek(result.state, input);
      input = apply(input, result, joint);
      if (week < 4) expect(input.jointForces.fleets[0]).toMatchObject({ id: fleetId, status: 'assigned', assignmentId: operationId });
    }
    expect(result.state.operations).toHaveLength(0);
    expect(result.state.records[0]).toMatchObject({ outcome: 'transferred', arrivalId: 'belfast', escortFleetId: fleetId });
    expect(input.jointForces.fleets[0].assignmentId).toBe(`nav-return-${fleetId}`);
    for (let week = 5; week < 20 && input.jointForces.fleets[0].assignmentId; week += 1) {
      input = { ...input, week }; result = advanceSeaTransportWeek(result.state, input); input = apply(input, result);
    }
    expect(input.jointForces.fleets[0].assignmentId).toBeNull();
    expect(input.jointForces.fleets[0].ships).toBeLessThanOrEqual(initialShips);
    expect(input.stockpile.convoys).toBe(100 - result.state.records[0].convoysLost);
  });

  it('restores an escort reservation but never steals a joint roster or foreign reservation', () => {
    const input = context(); const result = approve(input); const fleetId = input.jointForces.fleets[0].id;
    const restored = reconcileSeaTransportEscortAssignments(input.jointForces, normalizeSeaTransportState(JSON.parse(JSON.stringify(result.state))));
    expect(restored.fleets[0].assignmentId).toBe(result.state.operations[0].id);
    const deployed = launchJointOperation(input.jointForces, 'amphibious-cover', [fleetId], [input.jointForces.airGroups[0].id], { week: 0, theater: 'europe', game: input.game });
    expect(deployed).not.toBeNull();
    expect(reconcileSeaTransportEscortAssignments(deployed!.state, result.state).fleets[0].assignmentId).toBe(deployed!.operation.id);
    const foreign = { ...result.state, operations: result.state.operations.map((operation) => ({ ...operation, nationId: 'japan' as const })) };
    expect(reconcileSeaTransportEscortAssignments(input.jointForces, foreign).fleets[0].assignmentId).toBeNull();
  });

  it('clears only orphan sea assignments into refit without recreating ships', () => {
    const input = context(); const fleet = { ...input.jointForces.fleets[0], status: 'assigned' as const, assignmentId: 'sea-orphan', ships: 1, readiness: 20 };
    const joint = { ...input.jointForces, fleets: [fleet, input.jointForces.fleets[1]] };
    expect(reconcileSeaTransportEscortAssignments(joint, createSeaTransportState()).fleets[0]).toMatchObject({ status: 'refit', assignmentId: null, ships: 1, readiness: 20 });
  });

  it('accounts for a pending rescue increment on an already-rendered operation', () => {
    const input = context(); const launch = approve(input);
    const rendered = { ...launch.state, operations: launch.state.operations.map((operation) => ({ ...operation, stage: 'waiting-return' as const, convoysRemaining: 0 })) };
    const afterLaunch = apply(input, launch);
    const rescue = launchSeaTransportRescue(rendered, rendered.operations[0].id, afterLaunch);
    expect(rescue.accepted).toBe(true);
    const live = getLiveSeaTransportContext(afterLaunch, rendered, rescue.state, afterLaunch.jointForces);
    expect(live.game.commandPoints).toBe(afterLaunch.game.commandPoints + rescue.gameDelta.commandPoints!);
    expect(live.game.fuel).toBe(afterLaunch.game.fuel + rescue.gameDelta.fuel!);
    expect(live.stockpile.convoys).toBe(afterLaunch.stockpile.convoys + rescue.convoyDelta);
    expect(launchSeaTransportRescue(rescue.state, rendered.operations[0].id, live).accepted).toBe(false);
  });

  it('subtracts unpainted sea and joint approvals once, but not already-rendered costs', () => {
    const input = context(); const result = approve(input);
    const joint = launchJointOperation(apply(input, result).jointForces, 'fighter-sweep', [], [input.jointForces.airGroups[0].id], { week: 0, theater: 'europe', game: input.game })!;
    const live = getLiveSeaTransportContext(input, createSeaTransportState(), result.state, joint.state);
    expect(live.game.commandPoints).toBe(input.game.commandPoints + result.gameDelta.commandPoints! - joint.forecast.commandCost);
    expect(live.game.fuel).toBe(input.game.fuel + result.gameDelta.fuel! - joint.forecast.fuelCost);
    const painted = { ...live, jointForces: joint.state };
    expect(getLiveSeaTransportContext(painted, result.state, result.state, joint.state).game).toEqual(live.game);
  });

  it.each(['war', 'nation'] as const)('restores both locks, joins once, then releases through %s weekly settlement', (phase) => {
    let input = { ...context(), phase };
    let result = approve(input); input = apply(input, result);
    const operationId = result.state.operations[0].id;
    const original = input.jointForces.fleets[0].id;
    const incoming = input.jointForces.fleets[1].id;
    input = { ...input, week: 1 };
    result = advanceSeaTransportWeek(result.state, input); input = apply(input, result);
    // A deliberately slow transport leaves enough physical rendezvous time.
    result.state.operations[0].phaseWeeks.sailing = 4;
    result = dispatchSeaTransportEscortRelief(result.state, operationId, incoming, input);
    expect(result.accepted).toBe(true); input = apply(input, result);
    expect(getSeaTransportBusyFleetIds(result.state)).toEqual(new Set([original, incoming]));
    const restoredSea = normalizeSeaTransportState(JSON.parse(JSON.stringify(result.state)));
    const unlocked = { ...input.jointForces, fleets: input.jointForces.fleets.map((fleet) => ({ ...fleet, status: 'ready' as const, assignmentId: null })) };
    input = { ...input, jointForces: reconcileSeaTransportEscortAssignments(unlocked, restoredSea) };
    expect(input.jointForces.fleets.map((fleet) => fleet.assignmentId)).toEqual([operationId, operationId]);
    result = { ...result, state: restoredSea };
    for (let week = 2; week <= 6; week += 1) {
      input = { ...input, week };
      const before = input.jointForces;
      const joint = phase === 'war' ? advanceJointOperationsWeek(before, { week, theater: 'europe', game: input.game }).state : recoverPeacetimeJointForces(before);
      for (const fleet of before.fleets.filter((fleet) => fleet.assignmentId === operationId)) {
        expect(joint.fleets.find((item) => item.id === fleet.id)).toMatchObject({ assignmentId: operationId, readiness: fleet.readiness, organization: fleet.organization });
      }
      result = advanceSeaTransportWeek(result.state, input); input = apply(input, result, joint);
      if (week === 2) {
        expect(result.state.operations[0].escortFleetId).toBe(incoming);
        expect(result.state.operations[0].pendingEscortRelief).toBeUndefined();
        expect(input.jointForces.fleets[0].assignmentId).toBe(`nav-return-${original}`);
        expect(input.jointForces.fleets[1].assignmentId).toBe(operationId);
        expect(result.state.operations[0].escortReliefHistory).toHaveLength(1);
      }
    }
    expect(result.state.operations).toHaveLength(0);
    expect(result.state.records[0].escortReliefHistory).toHaveLength(1);
    expect(result.state.records[0].escortReliefHistory?.[0]).toMatchObject({ fleetId: incoming, previousFleetId: original, status: 'joined' });
    expect(input.jointForces.fleets[1].assignmentId).toBe(`nav-return-${incoming}`);
    for (let week = 7; week < 22 && input.jointForces.fleets.some((fleet) => fleet.assignmentId); week += 1) {
      input = { ...input, week }; result = advanceSeaTransportWeek(result.state, input); input = apply(input, result);
    }
    expect(input.jointForces.fleets.every((fleet) => fleet.assignmentId === null)).toBe(true);
    expect(input.stockpile.convoys).toBe(100 - result.state.records[0].convoysLost);
    expect(input.game.commandPoints).toBe(100 - result.state.records[0].commandCost);
    expect(input.game.fuel).toBe(200 - result.state.records[0].fuelCost);
  });

  it('restores an incoming lock without stealing another joint operation', () => {
    const start = context(); const launch = approve(start); const input = apply(start, launch);
    const incoming = input.jointForces.fleets[1].id;
    const dispatched = dispatchSeaTransportEscortRelief(launch.state, launch.state.operations[0].id, incoming, input);
    expect(dispatched.accepted).toBe(true);
    const joint = launchJointOperation(input.jointForces, 'amphibious-cover', [incoming], [input.jointForces.airGroups[0].id], { week: 0, theater: 'europe', game: input.game });
    expect(joint).not.toBeNull();
    const restored = reconcileSeaTransportEscortAssignments(joint!.state, dispatched.state);
    expect(restored.fleets[0].assignmentId).toBe(launch.state.operations[0].id);
    expect(restored.fleets[1].assignmentId).toBe(joint!.operation.id);
  });

  it('accounts for unpainted escort dispatch costs and prevents the reserved fleet being borrowed', () => {
    const start = context(); const launch = approve(start); const input = apply(start, launch);
    const incoming = input.jointForces.fleets[1].id;
    const dispatched = dispatchSeaTransportEscortRelief(launch.state, launch.state.operations[0].id, incoming, input);
    expect(dispatched.accepted).toBe(true);
    const currentJoint = applySeaTransportFleetUpdates(input.jointForces, dispatched.fleetUpdates);
    const live = getLiveSeaTransportContext(input, launch.state, dispatched.state, currentJoint);
    expect(live.game.commandPoints).toBe(input.game.commandPoints + dispatched.gameDelta.commandPoints!);
    expect(live.game.fuel).toBe(input.game.fuel + dispatched.gameDelta.fuel!);
    expect(live.stockpile.convoys).toBe(input.stockpile.convoys);
    expect(launchJointOperation(live.jointForces, 'amphibious-cover', [incoming], [live.jointForces.airGroups[0].id], { week: 0, theater: 'europe', game: live.game })).toBeNull();
    expect(dispatchSeaTransportEscortRelief(dispatched.state, launch.state.operations[0].id, incoming, live).accepted).toBe(false);
    expect(getLiveSeaTransportContext(apply(input, dispatched), dispatched.state, dispatched.state, currentJoint).game).toEqual(apply(input, dispatched).game);
  });

  it('keeps a rescue-selected escort reserved across reload until pickup, then releases it on return', () => {
    const start = context(); const launched = approve(start); let input = apply(start, launched);
    const oldFleetId = input.jointForces.fleets[0].id; const newFleetId = input.jointForces.fleets[1].id;
    const stranded = { ...launched.state, operations: launched.state.operations.map((operation) => ({ ...operation, stage: 'waiting-return' as const, convoysRemaining: 0 })) };
    let result = launchSeaTransportRescue(stranded, stranded.operations[0].id, input, newFleetId);
    expect(result.accepted).toBe(true);
    const live = getLiveSeaTransportContext(input, stranded, result.state, applySeaTransportFleetUpdates(input.jointForces, result.fleetUpdates));
    expect(live.game.commandPoints).toBe(input.game.commandPoints + result.gameDelta.commandPoints!);
    expect(live.game.fuel).toBe(input.game.fuel + result.gameDelta.fuel!);
    input = apply(input, result);
    result = { ...result, state: normalizeSeaTransportState(JSON.parse(JSON.stringify(result.state))) };
    input.jointForces = reconcileSeaTransportEscortAssignments(input.jointForces, result.state);
    const pickupWeek = result.state.operations[0].rescue!.outboundWeeks;
    const finishWeek = pickupWeek + result.state.operations[0].rescue!.returnWeeks;
    for (let week = 1; week <= finishWeek; week += 1) {
      input = { ...input, week };
      const joint = advanceJointOperationsWeek(input.jointForces, { week, theater: 'europe', game: input.game }).state;
      result = advanceSeaTransportWeek(result.state, input); input = apply(input, result, joint);
      if (week === 1) {
        expect(result.state.operations[0].escortFleetId).toBe(oldFleetId);
        expect(result.state.operations[0].pendingEscortRelief?.fleetId).toBe(newFleetId);
      }
      if (week === pickupWeek) {
        expect(result.state.operations[0].stage).toBe('returning');
        expect(result.state.operations[0].escortFleetId).toBe(newFleetId);
        expect(input.jointForces.fleets[0].assignmentId).toBe(`nav-return-${oldFleetId}`);
      }
    }
    expect(result.state.operations).toHaveLength(0);
    const report = result.state.records[0];
    expect(report).toMatchObject({ arrivalId: 'britain', rescueDispatches: 1, escortFleetId: newFleetId });
    expect(report.escortReliefHistory?.[0]).toMatchObject({ source: 'rescue', status: 'joined' });
    for (let week = finishWeek + 1; week < finishWeek + 20 && input.jointForces.fleets.some((fleet) => fleet.assignmentId); week += 1) {
      input = { ...input, week }; result = advanceSeaTransportWeek(result.state, input); input = apply(input, result);
    }
    expect(input.jointForces.fleets.every((fleet) => !fleet.assignmentId)).toBe(true);
    expect(input.game.commandPoints).toBe(100 - report.commandCost);
    expect(input.game.fuel).toBe(200 - report.fuelCost);
    expect(input.stockpile.convoys).toBe(100 - report.convoysLost);
  });
});
