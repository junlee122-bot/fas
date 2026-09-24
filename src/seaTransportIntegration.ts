import { jointOperationTemplates, type AirGroup, type JointForcesState, type NavalTaskForce } from './jointOperations';
import { getSeaTransportAssignedAirGroupIds, getSeaTransportAssignedFleetIds, type SeaTransportContext, type SeaTransportState } from './seaTransport';
import { beginFleetReturn, hasFleetNavigationReservation } from './navalNavigation';

/** Patch only existing player fleets; a voyage must never import a foreign formation. */
export function applySeaTransportFleetUpdates(state: JointForcesState, updates: readonly NavalTaskForce[] = []): JointForcesState {
  if (!updates.length) return state;
  const byId = new Map(updates.map((fleet) => [fleet.id, fleet]));
  return { ...state, fleets: state.fleets.map((fleet) => byId.get(fleet.id) ?? fleet) };
}
export function applySeaTransportAirGroupUpdates(state: JointForcesState, updates: readonly AirGroup[] = []): JointForcesState {
  if (!updates.length) return state;
  const byId = new Map(updates.map((group) => [group.id, group]));
  return { ...state, airGroups: state.airGroups.map((group) => byId.get(group.id) ?? group) };
}

/** Reconcile old saves without stealing an existing joint-operation assignment. */
export function reconcileSeaTransportEscortAssignments(joint: JointForcesState, sea: SeaTransportState): JointForcesState {
  const operations = sea.operations.filter((operation) => operation.nationId === joint.nationId);
  const claims = new Map<string, string>();
  // Existing escorts take precedence over a conflicting pending claim in a damaged save.
  for (const operation of operations) {
    for (const id of getSeaTransportAssignedFleetIds(operation)) if (!claims.has(id)) claims.set(id, operation.id);
  }
  for (const operation of operations) {
    const incoming = operation.pendingEscortRelief?.fleetId;
    if (incoming && !claims.has(incoming)) claims.set(incoming, operation.id);
  }
  return { ...joint, fleets: joint.fleets.map((fleet) => {
    const claim = claims.get(fleet.id);
    const jointClaim = joint.operations.some((operation) => operation.fleetIds.includes(fleet.id));
    if (claim && !jointClaim && (!fleet.assignmentId || fleet.assignmentId === claim) && !['returning', 'refueling', 'stranded'].includes(fleet.navigation?.mode ?? '')) {
      return { ...fleet, status: 'assigned' as const, assignmentId: claim };
    }
    if (!claim && !jointClaim && fleet.assignmentId?.startsWith('sea-')) {
      return fleet.navigation && hasFleetNavigationReservation(fleet) ? beginFleetReturn(fleet, Math.max(sea.lastProcessedWeek ?? 0, fleet.navigation.lastProcessedWeek)) : { ...fleet, status: 'refit' as const, assignmentId: null };
    }
    return fleet;
  }), airGroups: joint.airGroups.map((group) => {
    const claim = operations.find((operation) => getSeaTransportAssignedAirGroupIds(operation).includes(group.id));
    const jointClaim = joint.operations.some((operation) => operation.airGroupIds.includes(group.id));
    if (claim && !jointClaim && (!group.assignmentId || group.assignmentId === claim.id)) return { ...group, status: 'assigned' as const, assignmentId: claim.id };
    if (!claim && !jointClaim && group.assignmentId?.startsWith('sea-')) return { ...group, status: 'refit' as const, assignmentId: null };
    return group;
  }) };
}

/** Include dispatches accepted before React paints their costs, including rescue and escort changes. */
export function getLiveSeaTransportContext(context: SeaTransportContext, rendered: SeaTransportState, live: SeaTransportState, joint: JointForcesState): SeaTransportContext {
  const previous = new Map(rendered.operations.map((operation) => [operation.id, operation]));
  let command = 0; let fuel = 0; let convoys = 0;
  for (const operation of live.operations) {
    const old = previous.get(operation.id);
    command += Math.max(0, operation.commandCost - (old?.commandCost ?? 0));
    fuel += Math.max(0, operation.fuelCost - (old?.fuelCost ?? 0));
    convoys += Math.max(0, operation.convoysReserved - (old?.convoysReserved ?? 0));
  }
  const renderedJointIds = new Set(context.jointForces.operations.map((operation) => operation.id));
  for (const operation of joint.operations) {
    if (renderedJointIds.has(operation.id)) continue;
    const template = jointOperationTemplates.find((item) => item.id === operation.templateId);
    command += template?.commandCost ?? 0; fuel += template?.fuelCost ?? 0; convoys += template?.convoyCost ?? 0;
  }
  return { ...context, jointForces: joint,
    game: { ...context.game, commandPoints: context.game.commandPoints - command, fuel: context.game.fuel - fuel },
    stockpile: { ...context.stockpile, convoys: context.stockpile.convoys - convoys },
  };
}
