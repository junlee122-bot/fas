import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createCareerState, createStaffRoster, getRole } from './campaign';
import { createEconomyState } from './economy';
import { createNationManagementState } from './nationManagement';
import { createPoliticalCrisisState, getNationPoliticalProfile } from './politicalCrisis';
import { createPublicHealthState } from './publicHealth';
import { getRoleTabMandates } from './roleMandate';
import { HeadquartersFacilityWork, assessHeadquartersFacilityWork, type HeadquartersWorkInput } from './HeadquartersFacilityWork';
import { HeadquartersActivityDetail, HeadquartersOperationsRibbon } from './HeadquartersOperationsView';
import { buildHeadquartersOperations } from './headquartersOperations';
import { deriveNationalSimulation, type NationalSimulationInput } from './nationalSimulation';
import type { GameState } from './types';

function fixture(roomId: HeadquartersWorkInput['roomId'] = 'research'): HeadquartersWorkInput {
  const role = getRole('britain-tier1', 'britain');
  const game: GameState = { week: 5, manpower: 1200, politicalPower: 80, fuel: 70, steel: 100, factories: 30, stability: 75,
    warSupport: 80, commandPoints: 40, treasury: 900, victoryScore: 30, airPower: 50, navalPower: 50, intelNetwork: 60, enemyPressure: 60 };
  const economy = createEconomyState('britain');
  const nation: NationalSimulationInput = { nationId: 'britain', phase: 'war', game, economy, stockpile: { infantryEquipment: 1000, tanks: 100, aircraft: 100, convoys: 50, artillery: 100, trucks: 200 },
    production: [{ id: 'rifle', name: '소총', category: '보병', assigned: 8, efficiency: 84, output: 1200, icon: 'factory' }], divisions: [],
    research: [{ id: 'radio', name: '무선 통신', branch: '통신', description: '지휘 연결', progress: 20, duration: 100, active: false, complete: false, icon: 'radio' }],
    publicHealth: createPublicHealthState(42), selectedPolicies: [], politicalState: createPoliticalCrisisState('britain'),
    coupRisk: { score: 18, tier: 'stable', weeklyChance: 0, triggers: [], leadingFaction: getNationPoliticalProfile('britain').factions[0], weakestRelation: { pair: 'civil-military', value: 48 }, crisisLabel: '헌정 전환' },
    nationManagement: createNationManagementState('britain', game, economy, 1, 'negotiated') };
  return { roomId, nation, staffInput: { game, role, staff: createStaffRoster('britain', role.id), career: createCareerState('britain', role.id), developmentFocusId: null, campaignPhase: 'war', nationStatus: 'sovereign', affiliationStatus: 'serving' },
    mandate: getRoleTabMandates(role)[roomId === 'research' ? 'research' : 'industry'], year: 1942, weeklyResearchGain: 20,
    researchConnected: true, selectedId: roomId === 'research' ? 'radio' : 'rifle', direction: -1 };
}

describe('headquarters facility proposals', () => {
  it('previews a specific research action without changing the engine', () => {
    const input = fixture(); const before = JSON.stringify(input); const review = assessHeadquartersFacilityWork(input);
    expect(review).toMatchObject({ allowed: true, execution: { type: 'research', id: 'radio' } });
    expect(review.allowed && review.details.join(' ')).toContain('약 4회 주간 결산'); expect(JSON.stringify(input)).toBe(before);
  });
  it('does not promise a completion date when weekly gain is zero', () => {
    const input = fixture(); input.weeklyResearchGain = 0; const review = assessHeadquartersFacilityWork(input);
    expect(review.allowed && review.details.join(' ')).toContain('예측할 수 없습니다');
  });
  it('preserves progress when pausing an active research slot', () => {
    const input = fixture(); input.nation.research[0].active = true; const review = assessHeadquartersFacilityWork(input);
    expect(review.allowed && review.title).toContain('일시 중지'); expect(review.allowed && review.details[0]).toContain('20 / 100은 보존');
  });
  it.each(['busy', 'report', 'dismissed', 'foreign', 'week', 'missing-career'] as const)('blocks %s at proposal time', reason => {
    const input = fixture();
    if (reason === 'busy') input.staffInput!.busy = true;
    if (reason === 'report') input.mandate = { ...input.mandate, mode: 'report' };
    if (reason === 'dismissed') input.staffInput!.affiliationStatus = 'dismissed';
    if (reason === 'foreign') input.nation.nationId = 'korea';
    if (reason === 'week') input.staffInput!.game = { ...input.staffInput!.game, week: 6 };
    if (reason === 'missing-career') input.staffInput!.career = undefined;
    expect(assessHeadquartersFacilityWork(input).allowed).toBe(false);
  });
  it.each(['missing', 'duplicate', 'future', 'full', 'complete'] as const)('does not substitute or start %s research', reason => {
    const input = fixture();
    if (reason === 'missing') input.selectedId = 'removed';
    if (reason === 'duplicate') input.nation.research.push({ ...input.nation.research[0] });
    if (reason === 'future') input.nation.research[0].minimumYear = 2000;
    if (reason === 'full') input.nation.research.push(...['a', 'b'].map(id => ({ ...input.nation.research[0], id, active: true })));
    if (reason === 'complete') input.nation.research[0].complete = true;
    expect(assessHeadquartersFacilityWork(input).allowed).toBe(false);
  });
  it('invalidates a review when progress, available capacity, or week changes', () => {
    const input = fixture(); const first = assessHeadquartersFacilityWork(input); input.nation.research[0].progress = 30;
    const changed = assessHeadquartersFacilityWork(input);
    expect(first.allowed && changed.allowed && first.fingerprint !== changed.fingerprint).toBe(true);
    const production = fixture('workshop'); const before = assessHeadquartersFacilityWork(production); production.nation.game.factories += 1;
    const after = assessHeadquartersFacilityWork(production);
    expect(before.allowed && after.allowed && before.fingerprint !== after.fingerprint).toBe(true);
  });
  it('uses the actual factory reallocation preview and keeps production completion separate', () => {
    const input = fixture('workshop'); const before = JSON.stringify(input.nation.production); const review = assessHeadquartersFacilityWork(input);
    expect(review).toMatchObject({ allowed: true, execution: { type: 'production', id: 'rifle', amount: -1 } });
    expect(review.allowed && review.details[0]).toBe('배치 8 → 7개 · 라인 효율 84 → 80');
    expect(review.allowed && review.details.join(' ')).toContain('이후 주간 결산'); expect(JSON.stringify(input.nation.production)).toBe(before);
  });
  it('cannot take a factory from an empty line or allocate beyond national capacity', () => {
    const input = fixture('workshop'); input.nation.production[0].assigned = 0; expect(assessHeadquartersFacilityWork(input).allowed).toBe(false);
    input.direction = 1; input.nation.production[0].assigned = 30; expect(assessHeadquartersFacilityWork(input).allowed).toBe(false);
  });
  it('renders controls without issuing or approving anything on mount', () => {
    const input = fixture(); const onToggle = vi.fn(); const onReallocate = vi.fn();
    const html = renderToStaticMarkup(<HeadquartersFacilityWork {...input} researchControl={{ weeklyGain: 20, onToggle }} onReallocate={onReallocate} />);
    expect(html).toContain('현장 연구 지시'); expect(html).toContain('대상을 직접 선택하세요'); expect(html).not.toContain('이 지시 승인');
    expect(onToggle).not.toHaveBeenCalled(); expect(onReallocate).not.toHaveBeenCalled();
  });
  it('shows the operation chain and its scope without generating location or movement facts', () => {
    const input = fixture(); const operations = buildHeadquartersOperations(input.nation, deriveNationalSimulation(input.nation), input.staffInput, 0, String);
    const onRoom = vi.fn(); const onRoute = vi.fn();
    const html = renderToStaticMarkup(<HeadquartersOperationsRibbon routeId="defence" activities={operations} selectedRoom="research" onRoute={onRoute} onRoom={onRoom} postwar={false} />);
    expect(html).toContain('연구실'); expect(html).toContain('생산 관리실'); expect(html).toContain('군수 창고'); expect(html).toContain('작전 지휘실');
    expect(html).toContain('연결선이 생산 보너스·운송 경로를 만들지는 않습니다'); expect(onRoom).not.toHaveBeenCalled(); expect(onRoute).not.toHaveBeenCalled();
    const detail = renderToStaticMarkup(<HeadquartersActivityDetail activity={operations.research} />);
    expect(detail).toContain('필요한 것'); expect(detail).toContain('지금 처리 중인 것'); expect(detail).toContain('결과를 확인할 곳');
  });
});
