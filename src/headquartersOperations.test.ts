import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCareerState, createStaffRoster, getRole } from './campaign';
import { createEconomyState } from './economy';
import { headquartersRooms } from './headquarters';
import { buildHeadquartersOperations } from './headquartersOperations';
import { createNationManagementState } from './nationManagement';
import { deriveNationalSimulation } from './nationalSimulation';
import type { NationalSimulationInput } from './nationalSimulation';
import { createPoliticalCrisisState, getNationPoliticalProfile } from './politicalCrisis';
import { createPublicHealthState } from './publicHealth';
import type { StaffDecisionInput } from './staffDecisions';
import * as organization from './staffOrganization';
import { attachStaffWorkReports } from './staffWorkReport';
import type { GameState, ResearchProject } from './types';

const money = (value: number) => `£${value}`;
const project = (id: string, changes: Partial<ResearchProject> = {}): ResearchProject => ({
  id, name: `연구 ${id}`, branch: '과학', description: '시험', progress: 0, duration: 100, active: false, complete: false, icon: 'research', ...changes,
});

function fixture() {
  const game: GameState = { week: 5, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30,
    stability: 78, warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38, airPower: 57, navalPower: 52, intelNetwork: 64, enemyPressure: 68 };
  const economy = createEconomyState('britain');
  const input: NationalSimulationInput = {
    nationId: 'britain', phase: 'war', game, economy,
    stockpile: { infantryEquipment: 1000, tanks: 100, aircraft: 20, convoys: 15, artillery: 80, trucks: 200 },
    production: [{ id: 'rifle', name: '소총', category: '보병 장비', assigned: 8, efficiency: 84, output: 1200, icon: 'factory' },
      { id: 'truck', name: '트럭', category: '수송', assigned: 6, efficiency: 76, output: 160, icon: 'truck' }],
    divisions: [{ id: 'd1', name: '부대1', type: 'infantry', strength: 82, organization: 78, experience: 54, supply: 76, territoryId: 'home', commanderId: 'c1', status: 'ready' },
      { id: 'd2', name: '부대2', type: 'armor', strength: 78, organization: 72, experience: 60, supply: 68, territoryId: 'front', commanderId: 'c2', status: 'combat' }],
    research: [project('active', { active: true, progress: 25 }), project('next'), project('future', { minimumYear: 2000 }), project('locked', { prerequisites: ['missing'] })],
    publicHealth: { ...createPublicHealthState(42), preparedness: 70 }, selectedPolicies: [],
    politicalState: createPoliticalCrisisState('britain'),
    coupRisk: { score: 18, tier: 'stable', weeklyChance: 0, triggers: [], leadingFaction: getNationPoliticalProfile('britain').factions[0],
      weakestRelation: { pair: 'civil-military', value: 48 }, crisisLabel: '헌정 전환' },
    nationManagement: createNationManagementState('britain', game, economy, 1, 'negotiated'),
  };
  const role = getRole('britain-tier1', 'britain');
  const staffInput: StaffDecisionInput = { game, role, staff: createStaffRoster('britain', role.id),
    developmentFocusId: null, campaignPhase: 'war', nationStatus: 'sovereign', affiliationStatus: 'serving', career: createCareerState('britain', role.id) };
  const snapshot = deriveNationalSimulation(input);
  return { input, staffInput, snapshot, build: (issues = 0) => buildHeadquartersOperations(input, snapshot, staffInput, issues, money) };
}

afterEach(() => vi.restoreAllMocks());

describe('read-only headquarters operation summaries', () => {
  it('provides all eight rooms with input, process and verification without mutating state', () => {
    const { input, staffInput, snapshot, build } = fixture();
    const before = structuredClone({ input, staffInput, snapshot });
    const result = build();
    expect(Object.keys(result).sort()).toEqual(headquartersRooms.map((room) => room.id).sort());
    expect(Object.values(result).every((room) => room.inputs.length > 0 && room.process.length > 0 && room.verify.length > 0)).toBe(true);
    expect({ input, staffInput, snapshot }).toEqual(before);
    expect(build()).toEqual(result);
  });

  it('uses actual research progress and explains slots, year and prerequisites without inventing completion dates', () => {
    const { build } = fixture();
    expect(build().research).toMatchObject({ status: 'active', progress: { label: '연구 active', value: 25, max: 100 } });
    expect(build().research.headline).toContain('빈 슬롯 1개');
    expect(build().research.process.join(' ')).toContain('2000년부터');
    expect(build().research.process.join(' ')).toContain('선행 연구: missing');
    expect(build().research.verify.join(' ')).toContain('완료 날짜를 보장하지');
  });

  it('does not manufacture urgent research for empty slots with no available projects', () => {
    const { input, build } = fixture();
    input.research = [project('future', { minimumYear: 2000 }), project('locked', { prerequisites: ['missing'] })];
    expect(build().research.status).toBe('quiet');
    expect(build().research.progress).toBeUndefined();
    expect(build().research.process.join(' ')).toContain('긴급 과제는 아닙니다');
    input.research.push(project('available'));
    expect(build().research.status).toBe('ready');
  });

  it('flags an active project whose actual start requirements are no longer met', () => {
    const { input, build } = fixture();
    input.research = [project('blocked-active', { active: true, progress: 15, prerequisites: ['missing'] })];
    expect(build().research.status).toBe('attention');
    expect(build().research.progress).toMatchObject({ value: 15, max: 100 });
    expect(build().research.process.join(' ')).toContain('선행·시대 조건 재확인');
  });

  it('shows actual factory allocation and weighted efficiency without calling potential output confirmed deliveries', () => {
    const { build } = fixture();
    const room = build().workshop;
    expect(room.headline).toBe('군수 14 / 30개 · 민수 여력 16개');
    expect(room.inputs.join(' ')).toContain('80.6%');
    expect(room.progress).toEqual({ label: '전체 공장 중 군수 배정', value: 14, max: 30 });
    expect(room.process.join(' ')).toContain('납품 수량이 아닙니다');
    expect(room.process.join(' ')).toContain('전망');
    expect(room.verify.join(' ')).toContain('가용 비축을 구분');
  });

  it('does not warn about warehouse supply when all divisions are supplied, including zero stocks of unused categories', () => {
    const { input, build } = fixture();
    input.stockpile.aircraft = 0;
    input.stockpile.tanks = 0;
    input.divisions.forEach((division) => { division.supply = 100; });
    expect(build().warehouse.status).toBe('ready');
    expect(build().warehouse.headline).toBe('보급 60 미만 0 / 2개 부대');
    input.divisions[1].supply = 20;
    expect(build().warehouse.status).toBe('attention');
    expect(build().warehouse.headline).toContain('1 / 2');
  });

  it('counts actual combat and readiness weaknesses without implying battle completion in one week', () => {
    const { input, build } = fixture();
    expect(build().command.status).toBe('active');
    expect(build().command.headline).toBe('교전 1 · 이동 0 · 회복 0');
    expect(build().command.verify.join(' ')).toContain('종료나 목적지 도착 주차');
    input.divisions[0].organization = 20;
    expect(build().command.status).toBe('attention');
    input.divisions = [];
    expect(build().command.status).toBe('quiet');
  });

  it('counts only confirmed current-week staff results and does not expose individual identities in room summaries', () => {
    const { staffInput, build } = fixture();
    staffInput.staff = staffInput.staff.map((member) => ({ ...member, joinedWeek: 0, workload: 30, contractWeeksRemaining: 100 }));
    staffInput.staff = attachStaffWorkReports(staffInput.staff, staffInput.staff, staffInput.staff, { nationId: 'britain', fromWeek: 4, week: 5 });
    const room = build().personnel;
    expect(room.process.join(' ')).toContain(`현재 주차 확정 결산 ${staffInput.staff.length}명`);
    expect(room.status).toBe('ready');
    expect(JSON.stringify(room)).not.toContain(staffInput.staff[0].name);
    staffInput.staff[0].workload = 90;
    staffInput.staff[1].contractWeeksRemaining = 0;
    expect(build().personnel.status).toBe('attention');
    staffInput.staff[0] = { ...staffInput.staff[0], personId: 'replacement' };
    expect(build().personnel.process.join(' ')).toContain('기록 확인 필요 1명');
  });

  it('excludes hidden people and unscoped incident totals, including their invalid fields', () => {
    const { staffInput, build } = fixture();
    const profile = organization.getStaffAuthorityProfile(staffInput.role);
    vi.spyOn(organization, 'getStaffAuthorityProfile').mockReturnValue({ ...profile, visibleDepartments: ['operations'] });
    staffInput.staff = staffInput.staff.map((member) => ({ ...member, workload: member.department === 'operations' ? 10 : NaN,
      contractWeeksRemaining: member.department === 'operations' ? 100 : NaN }));
    const room = build(927).personnel;
    expect(room.status).toBe('ready');
    expect(room.headline).toContain('참모 1명');
    expect(JSON.stringify(room)).not.toContain('927');
    expect(room.inputs.join(' ')).toContain('집계에서 제외');
  });

  it('reports actual treasury metrics and rejects a future ledger instead of presenting it as current income', () => {
    const { input, build } = fixture();
    expect(build().treasury.headline).toBe('현재 국고 £920');
    expect(build().treasury.process.join(' ')).toContain('아직 확인된');
    input.economy.lastLedger = { week: 5, revenues: [], financing: [], expenses: [], operatingRevenue: 20, financingRaised: 5,
      totalExpenses: 30, netTreasuryChange: -5, monthlyProjection: -20, debtAfter: 10, portfolioValue: 0, unrealizedGain: 0 };
    expect(build().treasury.status).toBe('ready');
    expect(build().treasury.process.join(' ')).toContain('보관된 제6주 재정 결산 수지 £-5');
    input.economy.lastLedger.week = 6;
    expect(build().treasury.status).toBe('unknown');
  });

  it('does not convert a stored negative ledger into a current deficit alert across campaign phases', () => {
    const { input, staffInput, build } = fixture();
    input.economy.lastLedger = { week: 0, revenues: [], financing: [], expenses: [], operatingRevenue: 20, financingRaised: 0,
      totalExpenses: 100, netTreasuryChange: -80, monthlyProjection: -320, debtAfter: 100, portfolioValue: 0, unrealizedGain: 0 };
    for (const phase of ['war', 'nation'] as const) {
      input.phase = phase;
      staffInput.campaignPhase = phase;
      const room = build().treasury;
      expect(room.status).toBe('ready');
      expect(room.process.join(' ')).toContain('보관된 제1주 재정 결산 수지 £-80');
      expect(room.process.join(' ')).toContain('현재 단계의 성과나 현재 적자를 뜻하지');
    }
    input.economy.inflation = 25;
    expect(build().treasury.status).toBe('attention');
    input.economy.inflation = 5;
    input.economy.publicConfidence = 20;
    expect(build().treasury.status).toBe('attention');
    input.economy.publicConfidence = 70;
    input.game.treasury = 0;
    expect(build().treasury.status).toBe('attention');
  });

  it('uses actual outbreak and preparedness without inventing doctor activity or a cure date', () => {
    const { input, build } = fixture();
    expect(build().infirmary).toMatchObject({ status: 'quiet', headline: '현재 진행 중인 유행 없음' });
    input.publicHealth.activeOutbreak = { id: 'o1', templateId: 'test', codeName: '시험 유행', origin: '지역', detectedWeek: 4, phase: 'epidemic',
      weeksActive: 1, estimatedCases: 1000, weeklyCases: 100, deaths: 1, rEffective: 1.4, hospitalLoad: 110,
      knowledge: 20, peakWeeklyCases: 100, consecutiveDecline: 0, variantCount: 0 };
    expect(build().infirmary.status).toBe('attention');
    expect(build().infirmary.inputs.join(' ')).toContain('110%');
    input.publicHealth.activeOutbreak.detectedWeek = 6;
    expect(build().infirmary.status).toBe('unknown');
  });

  it('does not infer negotiation odds from political power', () => {
    const { input, build } = fixture();
    const initial = build().diplomacy;
    input.game.politicalPower = 999;
    expect(build().diplomacy.headline).toEqual(initial.headline);
    expect(build().diplomacy.inputs).toEqual(['현재 정치력 999']);
    expect(build().diplomacy.process.join(' ')).toContain('성공률·상대국의 수락 여부를 계산하지');
  });
});

describe('headquarters operation data and permission boundaries', () => {
  it.each(['nation', 'politicalNation', 'managementNation', 'week', 'phase', 'game', 'civilian', 'dismissed', 'busy'] as const)('returns unknown for mismatched or unavailable context: %s', (kind) => {
    const { input, staffInput, build } = fixture();
    if (kind === 'nation') staffInput.role = { ...staffInput.role, nationId: 'japan' };
    if (kind === 'politicalNation') input.politicalState.nationId = 'japan';
    if (kind === 'managementNation') input.nationManagement.nationId = 'japan';
    if (kind === 'week') staffInput.game = { ...staffInput.game, week: 6 };
    if (kind === 'phase') staffInput.campaignPhase = 'nation';
    if (kind === 'game') staffInput.game = { ...staffInput.game, treasury: 3 };
    if (kind === 'civilian') staffInput.career = { ...staffInput.career!, startMode: 'civilian', civilian: undefined };
    if (kind === 'dismissed') staffInput.affiliationStatus = 'dismissed';
    if (kind === 'busy') staffInput.busy = true;
    expect(Object.values(build()).every((room) => room.status === 'unknown')).toBe(true);
    expect(Object.values(build()).every((room) => room.progress === undefined)).toBe(true);
  });

  it('returns unknown in an unavailable read-only staff context', () => {
    const { input, snapshot } = fixture();
    expect(Object.values(buildHeadquartersOperations(input, snapshot, null, 0, money)).every((room) => room.status === 'unknown')).toBe(true);
  });

  it('keeps lower-office reporting read-only without claiming direct authority', () => {
    const { staffInput, build } = fixture();
    staffInput.role = getRole('britain-tier3', 'britain');
    staffInput.career = createCareerState('britain', staffInput.role.id);
    expect(build().personnel.status).not.toBe('unknown');
    expect(build().personnel.process.join(' ')).toContain('별도 권한 검토');
  });

  it.each(['research', 'workshop', 'warehouse', 'command', 'personnel', 'treasury', 'infirmary', 'diplomacy'] as const)('never displays invalid numeric state in %s', (roomId) => {
    const { input, staffInput, build } = fixture();
    if (roomId === 'research') input.research[0].duration = 0;
    if (roomId === 'workshop') input.production[0].efficiency = Infinity;
    if (roomId === 'warehouse') input.stockpile.infantryEquipment = NaN;
    if (roomId === 'command') input.divisions[0].organization = -1;
    if (roomId === 'personnel') staffInput.staff[0].workload = 101;
    if (roomId === 'treasury') input.economy.debt = Infinity;
    if (roomId === 'infirmary') input.publicHealth.preparedness = NaN;
    if (roomId === 'diplomacy') input.game.politicalPower = NaN;
    const room = build()[roomId];
    expect(room.status).toBe('unknown');
    expect(JSON.stringify(room)).not.toMatch(/NaN|Infinity|undefined/);
  });

  it('rejects overallocated factories, duplicate research and invalid consumer snapshot values', () => {
    const { input, snapshot, build } = fixture();
    input.production[0].assigned = 31;
    expect(build().workshop.status).toBe('unknown');
    input.production[0].assigned = 8;
    snapshot.goods.find((good) => good.id === 'consumer')!.availability = NaN;
    expect(build().workshop.status).toBe('unknown');
    input.research.push({ ...input.research[0] });
    expect(build().research.status).toBe('unknown');
  });

  it('handles formatter failure safely and never passes an invalid amount to it', () => {
    const { input, snapshot, staffInput } = fixture();
    const broken = () => { throw new Error('currency unavailable'); };
    expect(buildHeadquartersOperations(input, snapshot, staffInput, 0, broken).treasury.status).toBe('unknown');
    const formatter = vi.fn(money);
    input.game.treasury = NaN;
    expect(buildHeadquartersOperations(input, snapshot, staffInput, 0, formatter).treasury.status).toBe('unknown');
    expect(formatter).not.toHaveBeenCalled();
  });
});
