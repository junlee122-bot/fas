import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ArtworkViewer } from './ArtworkViewer';
import { FleetVoyageCard } from './FleetVoyageCard';
import { createJointForcesState, jointOperationTemplates, type AirGroup, type NavalTaskForce } from './jointOperations';
import { beginFleetReturn, createFleetNavigation, dispatchFleetTransit, getFleetNavigationSummary, type FleetNavigationMode } from './navalNavigation';
import { createInitialSeaTransportSelection, getSeaTransportBoardPlan, SeaTransportBoardView, type SeaTransportBoardProps, type SeaTransportSelection } from './SeaTransportBoard';
import { createSeaTransportState, forecastSeaTransport, getSeaTransportAssignedFleetIds, launchSeaTransport, launchSeaTransportRescue, advanceSeaTransportWeek, type SeaTransportContext, type SeaTransportPlan, type SeaTransportResult } from './seaTransport';
import { applySeaTransportAirGroupUpdates, applySeaTransportFleetUpdates } from './seaTransportIntegration';
import { getJointForceSelectionReason, initialJointBoardSelection, JointOperationsBoardView } from './JointOperationsBoard';
import type { Territory } from './types';

// Pure view interaction traversal, as in JointOperationsBoard.test.tsx. Memo/id
// hooks are deterministic here; real mounted browser behavior is tested by the
// desktop 1080p/1440p/4K verification, not claimed by these server-side tests.
vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>();
  return { ...react, useMemo: (factory: () => unknown) => factory(), useId: () => 'maritime-desktop-test' };
});

const site = (id: string, neighbors: string[]): Territory => ({ id, name: id, region: '검증 항로', x: 0, y: 0, controller: 'allies',
  value: 5, supply: 70, terrain: '해안', siteType: 'port', neighbors, theater: 'europe' });
function context(): SeaTransportContext {
  const jointForces = createJointForcesState('britain');
  jointForces.theaterControl.europe = { sea: 100, air: 100, intelligence: 100, trend: 0, lastChangedWeek: 0 };
  const air: AirGroup = { id: 'desktop-patrol', name: '해상초계비행단', kind: 'maritime', commander: '초계 지휘관', principalAircraft: 'Sunderland', base: '북아일랜드',
    aircraft: 90, authorizedAircraft: 90, serviceability: 90, readiness: 90, experience: 50, status: 'ready', assignmentId: null, historicalBasis: 'UI 검증 편제' };
  jointForces.airGroups = [air, { ...air, id: 'desktop-fighter', name: '영국남부전투비행단', kind: 'fighter', base: '영국 남부' }];
  return { week: 0, nationId: 'britain', playerFaction: 'allies', phase: 'war', canCommandEscort: true, jointForces,
    territories: [site('britain', ['belfast', 'normandy']), site('belfast', ['britain']), site('normandy', ['britain']), site('liverpool', [])],
    divisions: [{ id: 'desktop-division', name: '검증 해병사단', type: 'marine', territoryId: 'britain', status: 'ready', strength: 95, organization: 95, supply: 95, experience: 60, commanderId: 'general' }],
    commandableDivisionIds: new Set(['desktop-division']), orders: [],
    game: { week: 0, manpower: 500, politicalPower: 100, fuel: 200, steel: 80, factories: 20, stability: 70, warSupport: 70, commandPoints: 100,
      treasury: 100, victoryScore: 0, airPower: 80, navalPower: 80, intelNetwork: 70, enemyPressure: 20 },
    stockpile: { infantryEquipment: 100, tanks: 10, aircraft: 100, convoys: 100, artillery: 20, trucks: 10 },
  };
}
function props(): SeaTransportBoardProps {
  const ctx = context();
  return { state: createSeaTransportState(), context: ctx,
    initialPlan: { divisionId: ctx.divisions[0].id, fromId: 'britain', targetId: 'belfast', escortFleetIds: ctx.jointForces.fleets.map((fleet) => fleet.id), airGroupIds: ['desktop-patrol'] },
    onLaunch: vi.fn(), onReturn: vi.fn(), onRescue: vi.fn(), onEscortRelief: vi.fn(), onOpenLocation: vi.fn() };
}
function view(input: SeaTransportBoardProps, patch: Partial<SeaTransportSelection> = {}, onSelectionChange = vi.fn()) {
  return SeaTransportBoardView({ ...input, selection: { ...createInitialSeaTransportSelection(input), ...patch }, onSelectionChange });
}
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  const result: ReactElement<Record<string, unknown>>[] = [];
  Children.forEach(node, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return;
    result.push(child);
    // Keep the hook-based, read-only viewer opaque to this command-handler walker.
    // Its real React rendering is covered by SSR here and ArtworkViewer.test.tsx.
    if (child.type === ArtworkViewer) return;
    if (typeof child.type === 'function') result.push(...elements((child.type as (props: Record<string, unknown>) => ReactNode)(child.props)));
    else result.push(...elements(child.props.children as ReactNode));
  });
  return result;
}
function button(tree: ReactNode, label: string) {
  const control = elements(tree).find((element) => element.type === 'button' && renderToStaticMarkup(element).includes(label));
  expect(control, label).toBeDefined();
  return control!;
}
function click(tree: ReactNode, label: string) {
  const control = button(tree, label);
  expect(control.props.disabled, label).not.toBe(true);
  (control.props.onClick as () => void)();
}
function fleetInMode(mode: FleetNavigationMode): NavalTaskForce {
  const ctx = context(); const fleet = ctx.jointForces.fleets[0];
  if (mode === 'in-port') return { ...fleet, navigation: createFleetNavigation(fleet) };
  const outbound = dispatchFleetTransit(fleet, 'britain', ctx.territories, 0, 'sea-desktop', 'allies');
  if (mode === 'outbound') return outbound;
  const returning = beginFleetReturn(outbound, 1, ctx.territories, 'allies');
  return mode === 'returning' ? returning : { ...returning, navigation: { ...returning.navigation!, mode, position: returning.navigation!.homePort, lastMessage: '귀항 후 급유·점검 중입니다.' } };
}
function apply(input: SeaTransportContext, result: SeaTransportResult): SeaTransportContext {
  return { ...input, jointForces: applySeaTransportAirGroupUpdates(applySeaTransportFleetUpdates(input.jointForces, result.fleetUpdates), result.airGroupUpdates),
    game: { ...input.game, commandPoints: input.game.commandPoints + (result.gameDelta.commandPoints ?? 0), fuel: input.game.fuel + (result.gameDelta.fuel ?? 0) },
    stockpile: { ...input.stockpile, convoys: input.stockpile.convoys + result.convoyDelta },
    divisions: input.divisions.map((division) => result.divisionUpdates.find((update) => update.id === division.id) ?? division) };
}

describe('desktop fleet navigation presentation', () => {
  it.each(['in-port', 'outbound', 'returning', 'refueling'] as const)('renders the actual %s phase, home, position, ETA and bounded endurance meter', (mode) => {
    const fleet = fleetInMode(mode); const summary = getFleetNavigationSummary(fleet);
    const tree = FleetVoyageCard({ fleet }); const html = renderToStaticMarkup(tree);
    expect(html).toContain(summary.label); expect(html).toContain(summary.homePort); expect(html).toContain(summary.position);
    expect(html).toContain(`aria-label="${fleet.name} 항해 현황"`);
    const current = elements(tree).filter((element) => element.type === 'li' && element.props['aria-current'] === 'step');
    expect(current).toHaveLength(1);
    const meter = elements(tree).find((element) => element.props.role === 'meter')!;
    expect(meter.props['aria-valuemin']).toBe(0); expect(meter.props['aria-valuemax']).toBe(100);
    expect(meter.props['aria-valuenow']).toBeGreaterThanOrEqual(0); expect(meter.props['aria-valuenow']).toBeLessThanOrEqual(100);
    if (summary.arrivalWeeks) expect(html).toContain(`약 ${summary.arrivalWeeks}주`);
    if (mode === 'returning' || mode === 'refueling') expect(html).toContain('귀항·급유가 끝날 때까지 새 작전·호위에 배속할 수 없습니다');
  });
  it.each(['outbound', 'returning', 'refueling'] as const)('disables reassignment and refit controls for a %s fleet, even with a stale ready flag', (mode) => {
    const ctx = context(); const fleet = { ...fleetInMode(mode), status: 'ready' as const, assignmentId: null };
    const template = jointOperationTemplates.find((item) => item.id === 'amphibious-cover')!;
    expect(getJointForceSelectionReason(fleet, template)).toBeTruthy();
    const tree = JointOperationsBoardView({ view: 'naval', state: { ...ctx.jointForces, fleets: [fleet] }, theater: 'europe', game: ctx.game, stockpile: ctx.stockpile,
      onLaunch: vi.fn(), onDoctrineChange: vi.fn(), onRefit: vi.fn(), onCommandResponse: vi.fn(), selection: { ...initialJointBoardSelection, fleetId: fleet.id }, onSelectionChange: vi.fn() });
    expect(button(tree, '정비 전환').props.disabled).toBe(true);
  });
});

describe('desktop layered escort planning', () => {
  it('renders the engine total for two fleets plus air and submits all selected IDs only after review', () => {
    const input = props(); const plan = input.initialPlan!;
    const model = getSeaTransportBoardPlan(input.state, input.context, plan);
    expect(model.canReview, model.forecast.reason).toBe(true);
    expect(model.forecast).toEqual(forecastSeaTransport(input.state, plan, input.context));
    expect(model.forecast.escorts).toHaveLength(2); expect(model.forecast.airSupport).toHaveLength(1);
    const tree = view(input, { reviewedSignature: model.signature }); const html = renderToStaticMarkup(tree);
    expect(html).toContain('함대 2개 · 항공대 1개');
    expect(html).toContain(`지휘력 ${model.forecast.commandCost}·연료 ${model.forecast.fuelCost}`);
    expect(html).toContain('비용은 위 합계에 포함');
    expect(input.onLaunch).not.toHaveBeenCalled(); click(tree, '비용을 지불하고 수송 승인');
    expect(input.onLaunch).toHaveBeenCalledExactlyOnceWith(plan);
  });
  it.each(['secondary-fleet', 'air-group'] as const)('invalidates review after a same-week %s change without erasing the plan', (asset) => {
    const input = props(); const plan = input.initialPlan!; const old = getSeaTransportBoardPlan(input.state, input.context, plan);
    const jointForces = asset === 'secondary-fleet' ? { ...input.context.jointForces, fleets: input.context.jointForces.fleets.map((fleet, index) => index === 1 ? { ...fleet, experience: fleet.experience + 1 } : fleet) }
      : { ...input.context.jointForces, airGroups: input.context.jointForces.airGroups.map((group, index) => index === 0 ? { ...group, experience: group.experience + 1 } : group) };
    const changed = { ...input, context: { ...input.context, jointForces } };
    const next = getSeaTransportBoardPlan(changed.state, changed.context, plan);
    expect(next.forecast).toEqual(old.forecast); expect(next.signature).not.toBe(old.signature);
    const html = renderToStaticMarkup(view(changed, { plan, reviewedSignature: old.signature }));
    expect(html).toContain('초안은 유지했습니다'); expect(html).not.toContain('비용을 지불하고 수송 승인');
    expect(plan).toBe(input.initialPlan); expect(input.onLaunch).not.toHaveBeenCalled();
  });
  it('includes a legacy lead in the review signature even when a separate roster array exists', () => {
    const input = props(); const [lead, second] = input.context.jointForces.fleets;
    const plan: SeaTransportPlan = { ...input.initialPlan!, escortFleetId: lead.id, escortFleetIds: [second.id] };
    const before = getSeaTransportBoardPlan(input.state, input.context, plan);
    const changed = { ...input.context, jointForces: { ...input.context.jointForces, fleets: [{ ...lead, experience: lead.experience + 1 }, second] } };
    expect(getSeaTransportBoardPlan(input.state, changed, plan).signature).not.toBe(before.signature);
  });
  it('deselects the legacy lead from both representations and preserves other fleets and air', () => {
    const input = props(); const [lead, second] = input.context.jointForces.fleets;
    const plan: SeaTransportPlan = { ...input.initialPlan!, escortFleetId: lead.id, escortFleetIds: [second.id] };
    const onSelectionChange = vi.fn(); const tree = view(input, { plan }, onSelectionChange);
    expect(button(tree, lead.name).props['aria-pressed']).toBe(true); click(tree, lead.name);
    const patch = onSelectionChange.mock.calls[0][0] as Partial<SeaTransportSelection>;
    expect(patch.reviewedSignature).toBeNull(); expect(patch.plan?.escortFleetId).toBe(second.id);
    expect(getSeaTransportAssignedFleetIds(patch.plan!)).toEqual([second.id]); expect(patch.plan?.airGroupIds).toEqual(['desktop-patrol']);
    expect(input.onLaunch).not.toHaveBeenCalled();
  });
  it('clears sea escorts without silently clearing the separate air choice', () => {
    const input = props(); const onSelectionChange = vi.fn(); click(view(input, {}, onSelectionChange), '지정 호위 없음');
    const plan = onSelectionChange.mock.calls[0][0].plan as SeaTransportPlan;
    expect(plan.escortFleetId).toBeUndefined(); expect(plan.escortFleetIds).toEqual([]); expect(plan.airGroupIds).toEqual(['desktop-patrol']);
  });
  it('displays fractional route coverage as 50%/100%, not 0.5%/1%', () => {
    const input = props(); const html = renderToStaticMarkup(view(input));
    expect(html).toContain('항로 엄호 가능 100%'); expect(html).toContain('항로 엄호 가능 50%');
    expect(html).not.toContain('항로 엄호 가능 0.5%'); expect(html).not.toContain('항로 엄호 가능 1%');
  });
});

describe('rescue escort explanation', () => {
  it('explains outward rescue-vessel protection distinctly from the later troop pickup', () => {
    const input = props(); const plan = { ...input.initialPlan!, escortFleetIds: [], airGroupIds: [] };
    const launched = launchSeaTransport(input.state, plan, input.context); input.context = apply(input.context, launched);
    input.state = { ...launched.state, operations: launched.state.operations.map((operation) => ({ ...operation, stage: 'waiting-return', convoysRemaining: 0 })) };
    const fleetId = input.context.jointForces.fleets[1].id;
    const html = renderToStaticMarkup(view(input, { workspace: 'active', rescueEscortFleetId: fleetId }));
    expect(html).toContain('이동 중부터 구조선을 엄호'); expect(html).toContain('부대를 원격 보호하지 않습니다');
    const rescue = launchSeaTransportRescue(input.state, input.state.operations[0].id, input.context, fleetId);
    expect(rescue.accepted, rescue.reason).toBe(true); input.context = apply(input.context, rescue); input.state = rescue.state;
    const assemblyWeeks = input.state.operations[0].rescue!.assemblyWeeks!;
    for (let week = 1; week <= assemblyWeeks; week += 1) {
      input.context = { ...input.context, week }; const result = advanceSeaTransportWeek(input.state, input.context);
      input.state = result.state; input.context = apply(input.context, result);
    }
    expect(input.state.operations[0].stage).toBe('rescuing');
    const underway = renderToStaticMarkup(view(input, { workspace: 'active' }));
    expect(underway).not.toContain('출동 중 · 아직 보호 미적용');
    expect(underway).toContain('구조선');
  });
});
