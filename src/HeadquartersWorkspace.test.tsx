import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCareerState, createStaffRoster, getNation, getRole } from './campaign';
import { createEconomyState } from './economy';
import { headquartersRooms } from './headquarters';
import { HeadquartersWorkspace, type HeadquartersWorkspaceProps } from './HeadquartersWorkspace';
import { createNationManagementState } from './nationManagement';
import { deriveNationalSimulation, type NationalSimulationInput } from './nationalSimulation';
import { createPoliticalCrisisState, getNationPoliticalProfile } from './politicalCrisis';
import { createPublicHealthState } from './publicHealth';
import { createRegionalIndustryState } from './regionalIndustry';
import { createJointForcesState } from './jointOperations';
import { createSeaTransportState } from './seaTransport';
import { createStaffDeliveryPledgeState } from './staffDeliveryPledges';
import { getRoleTabMandates } from './roleMandate';
import { createStaffNarrativeState } from './staffNarrative';
import type { GameState } from './types';

// Override only initial UI choices for SSR branch coverage; mounted clicks and
// focus remain the responsibility of the browser integration fixture.
const initialUiStates = vi.hoisted(() => ({ values: [] as unknown[] }));
vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>();
  return { ...react, useState: (initial: unknown) => react.useState(initialUiStates.values.length ? initialUiStates.values.shift() : initial) };
});

function fixture(): HeadquartersWorkspaceProps {
  const role = getRole('britain-tier1', 'britain');
  const staff = createStaffRoster('britain', role.id);
  const game: GameState = { week: 8, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30,
    stability: 78, warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38,
    airPower: 57, navalPower: 52, intelNetwork: 64, enemyPressure: 68 };
  const economy = createEconomyState('britain');
  const nation: NationalSimulationInput = { nationId: 'britain', phase: 'war', game, economy,
    stockpile: { infantryEquipment: 48200, tanks: 1284, aircraft: 2106, convoys: 624, artillery: 3840, trucks: 12600 },
    divisions: [{ id: 'a', name: '제1사단', type: 'infantry', strength: 82, organization: 78, experience: 54, supply: 76, territoryId: 'home', commanderId: 'a', status: 'ready' }],
    production: [{ id: 'rifles', name: '소총', category: '보병 장비', assigned: 8, efficiency: 84, output: 1200, icon: 'factory' }],
    research: [{ id: 'radio', name: '무선 통신', branch: '통신', description: '지휘 연결', progress: 100, duration: 100, active: false, complete: true, icon: 'radio' }],
    publicHealth: createPublicHealthState(42), selectedPolicies: [], politicalState: createPoliticalCrisisState('britain'),
    coupRisk: { score: 18, tier: 'stable', weeklyChance: 0, triggers: [], leadingFaction: getNationPoliticalProfile('britain').factions[0], weakestRelation: { pair: 'civil-military', value: 48 }, crisisLabel: '헌정 비상전환' },
    nationManagement: createNationManagementState('britain', game, economy, 1, 'negotiated'),
  };
  const mandates = getRoleTabMandates(role);
  return {
    context: { input: { game, role, staff, developmentFocusId: null, campaignPhase: 'war', nationStatus: getNation('britain').status,
      career: createCareerState('britain', role.id), affiliationStatus: 'serving' }, formatMoney: value => `${value} 파운드`,
      onUpgradeStaff: vi.fn(), onRenewStaff: vi.fn(), onAssignStaff: vi.fn() },
    staffNarrative: createStaffNarrativeState(staff), onToggleDelegation: vi.fn(), onSetDevelopmentFocus: vi.fn(),
    onSetWorkPriority: vi.fn(), onMeetStaff: vi.fn(), onOpenOrganization: vi.fn(), mandates, year: 1942,
    world: { nationName: '영국', input: nation, snapshot: deriveNationalSimulation(nation), industryMandate: mandates.industry,
      staffIssues: 2, onNavigate: vi.fn(), onReallocate: vi.fn(), onOpenBriefing: vi.fn() },
  };
}

function withSeaTransport(props = fixture()): HeadquartersWorkspaceProps {
  return { ...props, seaTransport: {
    state: createSeaTransportState(),
    context: { week: props.world.input.game.week, nationId: 'britain', playerFaction: 'allies', phase: props.world.input.phase,
      divisions: props.world.input.divisions, territories: [], orders: [], commandableDivisionIds: new Set<string>(),
      game: props.world.input.game, stockpile: props.world.input.stockpile, jointForces: createJointForcesState('britain'), canCommandEscort: false },
    onOpen: vi.fn(), onOpenLocation: vi.fn(),
  } };
}

afterEach(() => { initialUiStates.values = []; vi.restoreAllMocks(); });

describe('headquarters workspace integration', () => {
  it('connects the goal desk only for the same national phase and current week', () => {
    const props = fixture(); props.world.input.phase = 'nation'; props.context.input!.campaignPhase = 'nation';
    props.deliveryGoals = { state: createStaffDeliveryPledgeState(), context: { nationId: 'britain', week: 8, phase: 'nation', staff: props.context.input!.staff, production: props.world.input.production, manageableDepartments: ['armaments'], industryMandate: props.mandates.industry, lineEquipment: [{ lineId: 'rifles', equipmentKey: 'infantryEquipment' }] }, onCreate: vi.fn(() => false) };
    initialUiStates.values = ['goals'];
    const html = renderToStaticMarkup(<HeadquartersWorkspace {...props} />);
    expect(html).toContain('이행 목표'); expect(html).toContain('첫 이행 약속 작성'); expect(html).not.toContain('type="submit"');
    expect(props.deliveryGoals.onCreate).not.toHaveBeenCalled();
    for (const change of [{ nationId: 'korea' as const }, { week: 9 }, { phase: 'war' as const }]) {
      initialUiStates.values = ['goals'];
      const stale = { ...props, deliveryGoals: { ...props.deliveryGoals, context: { ...props.deliveryGoals.context, ...change } } };
      const denied = renderToStaticMarkup(<HeadquartersWorkspace {...stale} />);
      expect(denied).toContain('class="hq-floorplan"'); expect(denied).not.toContain('>이행 목표<');
    }
  });

  it('offers a goal shortcut from production without issuing a pledge or instruction', () => {
    const props = fixture(); props.world.input.phase = 'nation'; props.context.input!.campaignPhase = 'nation';
    props.deliveryGoals = { state: createStaffDeliveryPledgeState(), context: { nationId: 'britain', week: 8, phase: 'nation', staff: props.context.input!.staff, production: props.world.input.production, manageableDepartments: ['armaments'], industryMandate: props.mandates.industry, lineEquipment: [] }, onCreate: vi.fn(() => false) };
    initialUiStates.values = ['floor', 'workshop'];
    const html = renderToStaticMarkup(<HeadquartersWorkspace {...props} />);
    expect(html).toContain('담당자·납품 목표 추적'); expect(props.deliveryGoals.onCreate).not.toHaveBeenCalled();
  });

  it('starts with three view choices, eight room selectors and seven real person selectors', () => {
    const props = fixture(); const html = renderToStaticMarkup(<HeadquartersWorkspace {...props} />);
    const views = html.match(/<nav class="hq-view-switch"[\s\S]*?<\/nav>/)?.[0] ?? '';
    expect(views.match(/<button\b/g)).toHaveLength(3);
    expect(views).toContain('지휘부 배치도'); expect(views).toContain('참모 업무표'); expect(views).toContain('국가 현황');
    expect(html.match(/class="hq-room-hit"/g)).toHaveLength(8);
    expect(html.match(/class="hq-person-token"/g)).toHaveLength(7);
    for (const person of props.context.input!.staff) expect(html).toContain(`aria-label="${person.name} 선택 ·`);
    expect(html).toContain('보건 체계 보고'); expect(html).toContain('실제 건물·이동 위치 아님');
    expect(html).toContain('방 선택·참모 선택만으로 명령이 집행되지 않습니다.');
  });

  it('does not execute any callback, change the engine, or manufacture staff by rendering', () => {
    const props = fixture(); const before = JSON.stringify({ staff: props.context.input, nation: props.world.input });
    renderToStaticMarkup(<HeadquartersWorkspace {...props} />);
    const callbacks = [props.context.onAssignStaff, props.context.onRenewStaff, props.context.onUpgradeStaff,
      props.onToggleDelegation, props.onSetDevelopmentFocus, props.onSetWorkPriority, props.onMeetStaff, props.onOpenOrganization,
      props.world.onNavigate, props.world.onReallocate, props.world.onOpenBriefing];
    for (const callback of callbacks) expect(callback).not.toHaveBeenCalled();
    expect(JSON.stringify({ staff: props.context.input, nation: props.world.input })).toBe(before);
  });

  it('offers a fourth logistics view only when real regional state is connected, including read-only access', () => {
    const props = fixture();
    props.logistics = {
      state: createRegionalIndustryState('britain', 8),
      context: { nationId: 'britain', week: 8, factories: 30, authorized: false, territories: [], playableTerritoryIds: [] },
      onOpen: vi.fn(),
    };
    const before = JSON.stringify(props.logistics);
    const html = renderToStaticMarkup(<HeadquartersWorkspace {...props} />);
    const views = html.match(/<nav class="hq-view-switch"[\s\S]*?<\/nav>/)?.[0] ?? '';
    expect(views.match(/<button\b/g)).toHaveLength(4);
    expect(views).toContain('물류 현장');
    expect(views).toMatch(/<button type="button" aria-pressed="false">[\s\S]*?물류 현장<\/button>/);
    expect(html.match(/class="hq-room-hit"/g)).toHaveLength(8);
    expect(props.logistics.onOpen).not.toHaveBeenCalled();
    expect(props.world.onNavigate).not.toHaveBeenCalled();
    expect(props.world.onReallocate).not.toHaveBeenCalled();
    expect(props.onSetWorkPriority).not.toHaveBeenCalled();
    expect(JSON.stringify(props.logistics)).toBe(before);
  });

  it('offers a sea transport view in war and nation phases without issuing commands or granting authority', () => {
    for (const phase of ['war', 'nation'] as const) {
      const props = withSeaTransport(); props.seaTransport!.context.phase = phase;
      const before = JSON.stringify(props.seaTransport);
      const html = renderToStaticMarkup(<HeadquartersWorkspace {...props} />);
      const views = html.match(/<nav class="hq-view-switch"[\s\S]*?<\/nav>/)?.[0] ?? '';
      expect(views.match(/<button\b/g)).toHaveLength(4);
      expect(views).toContain('해상 수송');
      expect(props.seaTransport!.context.commandableDivisionIds.size).toBe(0);
      expect(props.seaTransport!.onOpen).not.toHaveBeenCalled();
      expect(props.seaTransport!.onOpenLocation).not.toHaveBeenCalled();
      expect(JSON.stringify(props.seaTransport)).toBe(before);
    }
  });

  it('keeps regional cargo and troop sea transport as separate optional views', () => {
    const props = withSeaTransport();
    props.logistics = { state: createRegionalIndustryState('britain', 8), context: { nationId: 'britain', week: 8, factories: 30, authorized: false, territories: [], playableTerritoryIds: [] }, onOpen: vi.fn() };
    const html = renderToStaticMarkup(<HeadquartersWorkspace {...props} />);
    const views = html.match(/<nav class="hq-view-switch"[\s\S]*?<\/nav>/)?.[0] ?? '';
    expect(views.match(/<button\b/g)).toHaveLength(5);
    expect(views).toContain('물류 현장'); expect(views).toContain('해상 수송');
  });

  it('offers the warehouse shortcut only when sea transport is connected', () => {
    for (const connected of [false, true]) {
      initialUiStates.values = ['floor', 'warehouse'];
      const props = connected ? withSeaTransport() : fixture();
      const html = renderToStaticMarkup(<HeadquartersWorkspace {...props} />);
      expect(html.includes('병력 해상 수송 보기')).toBe(connected);
      expect(props.world.onNavigate).not.toHaveBeenCalled();
      initialUiStates.values = [];
    }
  });

  it('falls back to the floor if a previously selected sea scene is no longer connected', () => {
    initialUiStates.values = ['sea'];
    const html = renderToStaticMarkup(<HeadquartersWorkspace {...fixture()} />);
    expect(html).toContain('class="hq-floorplan"');
    const views = html.match(/<nav class="hq-view-switch"[\s\S]*?<\/nav>/)?.[0] ?? '';
    expect(views).toMatch(/aria-pressed="true"[^>]*>[\s\S]*?지휘부 배치도<\/button>/);
    expect(views).not.toContain('해상 수송');
  });

  it('connects facility and staff selectors to the same real detail region', () => {
    const html = renderToStaticMarkup(<HeadquartersWorkspace {...fixture()} />);
    const detailId = html.match(/<aside class="hq-detail" id="([^"]+)"/)?.[1];
    expect(detailId).toBeTruthy();
    const controlledIds = [...html.matchAll(/aria-controls="([^"]+)"/g)].map(match => match[1]);
    expect(controlledIds).toHaveLength(15);
    expect(new Set(controlledIds)).toEqual(new Set([detailId]));
    expect(html).toContain('aria-label="선택 대상 행동"');
    expect(html).toContain('교전 0 · 부대 1'); expect(html).toContain('공장 배분 8 / 30');
    expect(html).toContain('국고 920 파운드');
  });

  it('changes to postwar facility names and cosmetic modern apparatus without changing the roster', () => {
    const props = fixture(); props.context.input!.campaignPhase = 'nation'; props.world.input.phase = 'nation'; props.year = 2000;
    const html = renderToStaticMarkup(<HeadquartersWorkspace {...props} />);
    for (const room of headquartersRooms) expect(html).toContain(`<strong>${room.postwarLabel}</strong>`);
    expect(html.match(/data-era-furnishing="modern"/g)).toHaveLength(8);
    expect(html.match(/class="hq-person-token"/g)).toHaveLength(7);
    expect(html).toContain('국가안보보좌관');
  });

  it.each([
    { branch: 'military' as const, expected: 'direct', action: '작전 지도 열기' },
    { branch: 'intelligence' as const, expected: 'request', action: '상신·조건 확인' },
    { branch: 'politics' as const, expected: 'report', action: '담당 보고 확인' },
  ])('uses the map mandate, not national sovereignty, for $expected opening actions', ({ branch, expected, action }) => {
    const props = fixture(); const role = { ...props.context.input!.role, branch, tier: 3 as const, archetype: 'bureau-director' as const };
    props.context.input!.role = role; props.mandates = getRoleTabMandates(role);
    expect(props.mandates.map.mode).toBe(expected);
    const html = renderToStaticMarkup(<HeadquartersWorkspace {...props} />);
    const inspector = html.match(/<section class="hq-facility-inspector"[\s\S]*?<\/aside>/)?.[0] ?? '';
    expect(inspector).toContain(props.mandates.map.label); expect(inspector).toContain(props.mandates.map.reason);
    expect(inspector).toContain(action); expect(props.world.onNavigate).not.toHaveBeenCalled();
    if (expected !== 'direct') expect(inspector).not.toContain('>작전 지도 열기<');
  });

  it('exposes a navigation-only equipment issue entrance and keeps locked army access hidden', () => {
    const props = fixture(); const onOpenUnitSupply = vi.fn();
    const html = renderToStaticMarkup(<HeadquartersWorkspace {...props} onOpenUnitSupply={onOpenUnitSupply} />);
    expect(html).toContain('부대 지급·수령 창구'); expect(onOpenUnitSupply).not.toHaveBeenCalled();
    props.mandates = { ...props.mandates, army: { ...props.mandates.army, mode: 'locked' } };
    expect(renderToStaticMarkup(<HeadquartersWorkspace {...props} onOpenUnitSupply={onOpenUnitSupply} />)).not.toContain('부대 지급·수령 창구');
  });

  it('keeps locked map navigation disabled and a missing staff context empty', () => {
    const props = fixture(); props.mandates = getRoleTabMandates(props.context.input!.role, 'civilian'); props.context.input = null;
    const html = renderToStaticMarkup(<HeadquartersWorkspace {...props} />);
    expect(html.match(/class="hq-room-hit"/g)).toHaveLength(8);
    expect(html.match(/class="hq-person-token"/g) ?? []).toHaveLength(0);
    expect(html).toContain('현재 보직 확인 필요'); expect(html).toContain('현재 담당 기록 없음');
    expect(html.match(/<button type="button" disabled=""/g)?.length).toBeGreaterThanOrEqual(2);
    expect(props.world.onNavigate).not.toHaveBeenCalled();
  });
});
