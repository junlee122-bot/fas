import { describe, expect, it } from 'vitest';
import { achievementCategoryDestinations, achievementDefinitions, evaluateAchievements, getAchievementRecommendations, normalizeAchievementUnlocks, normalizeTrackedAchievementId, sortAchievementDefinitions } from './achievements';
import type { AchievementSnapshot } from './achievements';
import { createEconomyState } from './economy';
import { createEquipmentDevelopment } from './equipment';
import { createNationManagementState } from './nationManagement';
import { createPublicHealthState } from './publicHealth';

function createSnapshot(): AchievementSnapshot {
  const game = { week: 10, manpower: 100, politicalPower: 50, fuel: 80, steel: 80, factories: 30, stability: 70, warSupport: 75, commandPoints: 50, treasury: 500, victoryScore: 50, airPower: 50, navalPower: 50, intelNetwork: 70, enemyPressure: 50 };
  const economy = createEconomyState('britain');
  return {
    game,
    stockpile: { infantryEquipment: 1000, tanks: 100, aircraft: 100, convoys: 500, artillery: 100, trucks: 100 },
    divisions: [{ id: 'd1', name: '1st', type: 'infantry', strength: 90, organization: 90, experience: 50, supply: 80, territoryId: 't1', commanderId: 'c1', status: 'ready' }],
    research: [],
    operations: [],
    staff: [],
    relations: [],
    completedDecisions: [],
    events: [],
    battleReports: [],
    careerTier: 3,
    selectedPolicies: [],
    campaignOutcome: null,
    campaignPhase: 'war',
    equipmentDevelopment: createEquipmentDevelopment('britain'),
    economy,
    publicHealth: createPublicHealthState(1),
    nationManagement: createNationManagementState('britain', game, economy, 0, 'negotiated'),
  };
}

describe('achievement engine', () => {
  it('starts with no accidental completions', () => {
    const result = evaluateAchievements(createSnapshot());
    expect(achievementDefinitions).toHaveLength(26);
    expect(Object.values(result).every((item) => !item.complete)).toBe(true);
  });

  it('covers twelve distinct play styles', () => {
    expect(new Set(achievementDefinitions.map((achievement) => achievement.category))).toEqual(new Set([
      'combat', 'logistics', 'intelligence', 'organization', 'technology', 'economy',
      'health', 'governance', 'history', 'career', 'diplomacy', 'legacy',
    ]));
    expect(Object.values(achievementCategoryDestinations).every((destination) => destination.tab.length > 0 && destination.label.length > 0)).toBe(true);
  });

  it('recommends the nearest unfinished goal and supports strategic sorting', () => {
    const progress = evaluateAchievements(createSnapshot());
    progress['first-victory'] = { current: 8, target: 10, percent: 80, complete: false, detail: '8/10' };
    progress['war-ended'] = { current: 81, target: 90, percent: 90, complete: false, detail: '81/90' };
    const unlocked = new Set(['war-ended']);
    expect(getAchievementRecommendations(progress, unlocked, 1)[0]?.id).toBe('first-victory');
    expect(sortAchievementDefinitions(progress, unlocked, 'progress')[0]?.id).toBe('war-ended');
    expect(sortAchievementDefinitions(progress, unlocked, 'points')[0]?.id).toBe('long-peace');
  });

  it('unlocks the first victory from a victorious battle report', () => {
    const snapshot = createSnapshot();
    snapshot.battleReports = [{ id: 'r1', week: 10, divisionId: 'd1', divisionName: '1st', commanderName: 'C', targetId: 't2', targetName: 'T', terrain: 'plain', stance: 'balanced', victory: true, margin: 10, phases: [] as never, attackerStrengthLoss: 1, defenderStrengthLoss: 5, organizationLoss: 2, supplySpent: 2, summary: 'victory' }];
    expect(evaluateAchievements(snapshot)['first-victory'].complete).toBe(true);
  });

  it('requires every logistics gate', () => {
    const snapshot = createSnapshot();
    snapshot.research = [{ id: 'logistics', name: 'Logistics', branch: 'doctrine', description: '', progress: 100, duration: 90, active: false, complete: true, icon: '' }];
    snapshot.stockpile.convoys = 700;
    snapshot.divisions[0].supply = 85;
    expect(evaluateAchievements(snapshot)['lifeline-unbroken'].complete).toBe(true);
  });

  it('recognizes intelligence, recruitment, authored history, career, diplomacy and victory goals', () => {
    const snapshot = createSnapshot();
    snapshot.game.intelNetwork = 95;
    snapshot.research = [{ id: 'code', name: 'Code', branch: 'intel', description: '', progress: 100, duration: 100, active: false, complete: true, icon: '' }];
    snapshot.operations = [{ id: 'op', name: 'Op', region: 'R', risk: 20, progress: 100, active: false, icon: 'eye' }];
    snapshot.events = [
      { id: 1, week: 2, title: '신임 참모 영입 — A', detail: '', tone: 'good' },
      { id: 2, week: 3, title: '신임 참모 영입 — B', detail: '', tone: 'good' },
      { id: 3, week: 6, title: '전시 승진 — TIER 2', detail: '', tone: 'good' },
      { id: 4, week: 9, title: '전시 승진 — TIER 1', detail: '', tone: 'good' },
      { id: 5, week: 12, title: '전시 승진 — TIER 4', detail: '', tone: 'good' },
      { id: 6, week: 15, title: '전시 승진 — TIER 3', detail: '', tone: 'good' },
    ];
    snapshot.staff = [
      { id: 's', personId: 's', name: 'S', candidateName: '', role: '', historicalOffice: '', affiliation: '', summary: '', department: 'science', ability: 82, potential: 90, loyalty: 70, workload: 20, weeklyCost: 1, specialty: '', influence: 70, delegated: true, grade: 1, development: 0 },
      { id: 'e', personId: 'e', name: 'E', candidateName: '', role: '', historicalOffice: '', affiliation: '', summary: '', department: 'economy', ability: 80, potential: 85, loyalty: 70, workload: 20, weeklyCost: 1, specialty: '', influence: 70, delegated: true, grade: 1, development: 0 },
    ];
    snapshot.selectedPolicies = ['economy-balanced', 'doctrine-defense', 'society-autonomy', 'diplomacy-aid'];
    snapshot.completedDecisions = ['world-flashpoint:a:x:4', 'world-flashpoint:b:y:8', 'world-flashpoint:c:z:12', 'diplomatic-agenda-britain'];
    snapshot.relations = [{ id: 'usa', name: 'USA', code: 'US', value: 92, status: 'ally', color: '#fff' }];
    snapshot.careerTier = 1;
    snapshot.campaignOutcome = 'victory';
    const result = evaluateAchievements(snapshot);
    expect(result['invisible-front'].complete).toBe(true);
    expect(result['cabinet-of-minds'].complete).toBe(true);
    expect(result['author-of-history'].complete).toBe(true);
    expect(result['from-field-to-command'].complete).toBe(true);
    expect(result['negotiated-front'].complete).toBe(true);
    expect(result['war-ended'].complete).toBe(true);
  });

  it('recognizes technology, economic and public-health mastery', () => {
    const snapshot = createSnapshot();
    snapshot.game.week = 30;
    snapshot.game.treasury = 620;
    snapshot.research = Array.from({ length: 5 }, (_, index) => ({ id: `r${index}`, name: `R${index}`, branch: 'industry', description: '', progress: 100, duration: 100, active: false, complete: true, icon: '' }));
    snapshot.equipmentDevelopment = {
      ...snapshot.equipmentDevelopment,
      prototypes: [
        { id: 'p0', category: 'armor' },
        { id: 'p1', category: 'aircraft' },
        { id: 'p2', category: 'infantry' },
      ] as never[],
      fieldedByCategory: { ...snapshot.equipmentDevelopment.fieldedByCategory, armor: 'p0', aircraft: 'p1' },
    };
    snapshot.economy = {
      ...snapshot.economy,
      inflation: 4.2,
      publicConfidence: 78,
      holdings: Array.from({ length: 3 }, (_, index) => ({ companyId: `c${index}` } as never)),
    };
    snapshot.publicHealth = {
      ...snapshot.publicHealth,
      preparedness: 86,
      surveillance: 84,
      medicalCapacity: 88,
      completedInvestments: ['laboratory-network', 'field-hospitals', 'protective-stockpile'],
      history: [{ id: 'h1', templateId: 'influenza', codeName: 'H1', detectedWeek: 4, resolvedWeek: 12, cases: 1000, deaths: 8, outcome: 'contained' }],
    };
    const result = evaluateAchievements(snapshot);
    expect(result['prototype-age'].complete).toBe(true);
    expect(result['price-stability'].complete).toBe(true);
    expect(result['industrial-portfolio'].complete).toBe(true);
    expect(result['epidemic-contained'].complete).toBe(true);
    expect(result['prepared-state'].complete).toBe(true);
  });

  it('recognizes a successful postwar state and long peace', () => {
    const snapshot = createSnapshot();
    snapshot.campaignPhase = 'nation';
    snapshot.nationManagement = {
      ...snapshot.nationManagement,
      civilianIndustry: 72,
      employment: 74,
      infrastructure: 68,
      welfare: 78,
      education: 76,
      inequality: 28,
      electionWins: 1,
      mandateScore: 72,
      nationalScore: 75,
      unrest: 24,
      reports: Array.from({ length: 52 }, (_, index) => ({ week: index, fiscalBalance: 10 } as never)),
    };
    snapshot.relations = [
      { id: 'usa', name: 'USA', code: 'US', value: 86, status: 'ally', color: '#fff' },
      { id: 'freefrance', name: 'France', code: 'FR', value: 83, status: 'ally', color: '#fff' },
      { id: 'china', name: 'China', code: 'CN', value: 81, status: 'ally', color: '#fff' },
    ];
    const result = evaluateAchievements(snapshot);
    expect(result['balanced-ledger'].complete).toBe(true);
    expect(result['peace-dividend'].complete).toBe(true);
    expect(result['social-contract-achievement'].complete).toBe(true);
    expect(result['renewed-mandate'].complete).toBe(true);
    expect(result['league-of-many'].complete).toBe(true);
    expect(result['long-peace'].complete).toBe(true);
  });

  it('normalizes imported unlock records and removes duplicates', () => {
    const result = normalizeAchievementUnlocks([
      { id: 'first-victory', unlockedWeek: 2, unlockedAt: '1942-01-01' },
      { id: 'first-victory', unlockedWeek: 3, unlockedAt: '1942-01-02' },
      { id: 'unknown', unlockedWeek: 1, unlockedAt: '1942-01-01' },
    ]);
    expect(result).toEqual([{ id: 'first-victory', unlockedWeek: 2, unlockedAt: '1942-01-01' }]);
  });

  it('accepts only valid persisted tracking targets', () => {
    expect(normalizeTrackedAchievementId('first-victory')).toBe('first-victory');
    expect(normalizeTrackedAchievementId('unknown')).toBeNull();
    expect(normalizeTrackedAchievementId({ id: 'first-victory' })).toBeNull();
  });
});
