import { describe, expect, it } from 'vitest';
import {
  advanceSocialistWorldWeek,
  calculateSocialistModelOutlooks,
  chooseSocialistSettlement,
  chooseSocialistTransitionMethod,
  createSocialistWorldState,
  getSocialistSettlementsForStage,
  normalizeSocialistWorldState,
  previewSocialistTransitionMethod,
  socialistModelDefinitions,
  socialistSettlementDefinitions,
  startSocialistTransition,
  type SocialistSettlementId,
  type SocialistTransitionSponsor,
  type SocialistWorldContext,
  type SocialistWorldState,
} from './socialistWorld';
import type { CareerRole } from './types';

const role: CareerRole = {
  id: 'test-prime-minister',
  nationId: 'korea',
  title: '국무총리',
  branch: 'politics',
  tier: 4,
  archetype: 'cabinet-minister',
  scope: '국정 운영',
  authority: 86,
  expectation: '체제 전환을 조정한다',
  historicalHolderId: 'test-holder',
  historicalHolderName: '기존 국무총리',
  historicalOffice: '국무총리',
  historicalBasis: '테스트 보직',
  coverIdentity: '공직자',
  replacementEffect: '사용자가 사회체제를 선택한다',
};

const sponsor: SocialistTransitionSponsor = { id: 'sponsor', name: '김사회', department: 'political', ability: 84, loyalty: 78 };

const context = (overrides: Partial<SocialistWorldContext> = {}): SocialistWorldContext => ({
  week: 1,
  year: 1942,
  phase: 'war',
  nationId: 'korea',
  role,
  politicalPower: 100,
  treasury: 500,
  stability: 64,
  warSupport: 68,
  enemyPressure: 38,
  legitimacy: 67,
  unrest: 52,
  welfare: 48,
  employment: 66,
  inequality: 62,
  education: 64,
  civilianIndustry: 62,
  institutionalCapacity: 66,
  publicConfidence: 61,
  inflation: 6,
  relationAverage: 58,
  laborSupport: 68,
  laborInfluence: 64,
  civicSupport: 62,
  intelligentsiaSupport: 65,
  securitySupport: 55,
  ...overrides,
});

const beginWithSettlement = (settlementId: SocialistSettlementId = 'broad-front-charter') => {
  const started = startSocialistTransition(createSocialistWorldState('korea', 0), 'popular-front', sponsor, context()).state;
  return chooseSocialistSettlement(started, settlementId, context()).state;
};

describe('socialist possible worlds', () => {
  it('offers seven historically distinct models rather than one ideology switch', () => {
    expect(socialistModelDefinitions).toHaveLength(7);
    expect(new Set(socialistModelDefinitions.map((definition) => definition.ownership)).size).toBe(7);
    expect(socialistModelDefinitions.every((definition) => definition.historicalBasis && definition.sourceUrl.startsWith('https://'))).toBe(true);
  });

  it('offers three sourced institutional settlements at each transition stage', () => {
    expect(socialistSettlementDefinitions).toHaveLength(12);
    for (const stageIndex of [0, 1, 2, 3] as const) {
      const settlements = getSocialistSettlementsForStage(stageIndex);
      expect(settlements).toHaveLength(3);
      expect(settlements.every((settlement) => settlement.sourceUrl.startsWith('https://'))).toBe(true);
    }
  });

  it('creates at least 45,927 institutional transition routes before weekly context branches', () => {
    const settlementRoutes = 3 ** 4;
    const executionRoutes = 3 ** 4;
    expect(settlementRoutes * executionRoutes * socialistModelDefinitions.length).toBe(45_927);
  });

  it('starts the USSR from its 1942 central-plan condition without forcing China into one result', () => {
    expect(createSocialistWorldState('ussr', 0).currentModelId).toBe('central-plan');
    expect(createSocialistWorldState('ussr', 0).bureaucraticCapture).toBeGreaterThan(60);
    expect(createSocialistWorldState('china', 0).currentModelId).toBeNull();
    expect(createSocialistWorldState('china', 0).peasantMobilization).toBeGreaterThan(60);
  });

  it('derives model viability and blockers from society and the existing power network', () => {
    const state = createSocialistWorldState('korea', 0);
    const strong = calculateSocialistModelOutlooks(state, context());
    const weak = calculateSocialistModelOutlooks(state, context({ civicSupport: 20, laborSupport: 25, laborInfluence: 20 }));
    expect(strong.some((outlook) => outlook.available)).toBe(true);
    expect(weak.find((outlook) => outlook.definition.id === 'council-commonwealth')?.blockers.length).toBeGreaterThan(0);
    expect(strong[0].viability).toBeGreaterThan(weak[0].viability);
  });

  it('opens a visible convention when existing conditions make transition possible', () => {
    const result = advanceSocialistWorldWeek(createSocialistWorldState('korea', 0), context({ week: 2 }));
    expect(result.state.conventionAvailable).toBe(true);
    expect(result.events.some((event) => event.id.startsWith('socialist-convention-'))).toBe(true);
    expect(result.state.currentModelId).toBeNull();
  });

  it('opens a four-stage transition and waits for an institutional settlement first', () => {
    const result = startSocialistTransition(createSocialistWorldState('korea', 0), 'popular-front', sponsor, context());
    expect(result.state.active?.stage).toBe('coalition');
    expect(result.state.active?.sponsor.name).toBe(sponsor.name);
    expect(result.state.active?.settlementId).toBeNull();
    expect(result.state.active?.methodId).toBeNull();
    expect(result.politicalPowerDelta).toBe(-8);
    expect(chooseSocialistTransitionMethod(result.state, 'constitutional', context()).state.active?.methodId).toBeNull();
  });

  it('applies institutional costs and persistent systemic consequences immediately', () => {
    const started = startSocialistTransition(createSocialistWorldState('korea', 0), 'popular-front', sponsor, context()).state;
    const propertyStage: SocialistWorldState = {
      ...started,
      stage: 'property',
      active: { ...started.active!, stage: 'property', stageIndex: 1 },
    };
    const result = chooseSocialistSettlement(propertyStage, 'rapid-expropriation', context());
    expect(result.state.active?.settlementId).toBe('rapid-expropriation');
    expect(result.state.socialOwnership).toBeGreaterThan(propertyStage.socialOwnership);
    expect(result.state.capitalFlight).toBeGreaterThan(propertyStage.capitalFlight);
    expect(result.state.foreignPressure).toBeGreaterThan(propertyStage.foreignPressure);
    expect(result.politicalPowerDelta).toBeLessThan(0);
    expect(result.treasuryDelta).toBeLessThan(0);
  });

  it('shows a faster but more contradictory command path after the same settlement', () => {
    const settled = beginWithSettlement();
    const constitutional = previewSocialistTransitionMethod(settled, 'constitutional', context())!;
    const command = previewSocialistTransitionMethod(settled, 'party-command', context())!;
    expect(command.weeklyProgress).toBeGreaterThan(constitutional.weeklyProgress);
    expect(command.weeklyContradiction).toBeGreaterThan(constitutional.weeklyContradiction);
    expect(command.mandateChange).toBeLessThan(constitutional.mandateChange);
  });

  it('waits for the player at every undecided stage', () => {
    const started = startSocialistTransition(createSocialistWorldState('korea', 0), 'popular-front', sponsor, context()).state;
    const weekly = advanceSocialistWorldWeek(started, context({ week: 2 }));
    expect(weekly.requiresDecision).toBe(true);
    expect(weekly.state.active?.progress).toBe(started.active?.progress);
  });

  it('turns excessive contradiction into a recoverable scar rather than game over', () => {
    const started = startSocialistTransition(createSocialistWorldState('korea', 0), 'central-plan', sponsor, context()).state;
    const settled = chooseSocialistSettlement(started, 'vanguard-compact', context()).state;
    const selected = chooseSocialistTransitionMethod(settled, 'party-command', context()).state;
    const pressured = { ...selected, active: { ...selected.active!, progress: 24, contradiction: 99 } };
    const weekly = advanceSocialistWorldWeek(pressured, context({ week: 2, enemyPressure: 90 }));
    expect(weekly.requiresDecision).toBe(true);
    expect(weekly.state.stage).toBe('fractured');
    expect(weekly.state.active?.setbacks).toBe(1);
    expect(weekly.state.active?.scars).toHaveLength(1);
    expect(weekly.state.active?.progress).toBeGreaterThan(0);
    expect(weekly.state.active?.settlementId).toBe('vanguard-compact');
    expect(weekly.state.active?.methodId).toBeNull();
  });

  it('resolves the final stage into a persistent constitutional profile', () => {
    const settled = beginWithSettlement();
    const selected = chooseSocialistTransitionMethod(settled, 'constitutional', context()).state;
    const finalSettlements: SocialistSettlementId[] = [
      'broad-front-charter',
      'compensated-socialization',
      'constitutional-pluralism',
      'peaceful-coexistence',
    ];
    const finale: SocialistWorldState = {
      ...selected,
      active: {
        ...selected.active!,
        stage: 'world-order',
        stageIndex: 3,
        settlementId: 'peaceful-coexistence',
        settlements: finalSettlements,
        progress: 99,
        contradiction: 8,
      },
    };
    const result = advanceSocialistWorldWeek(finale, context({ week: 20, year: 1943 }));
    expect(result.state.active).toBeNull();
    expect(result.state.currentModelId).toBe('popular-front');
    expect(result.state.history[0].outcome).toBe('plural');
    expect(result.state.history[0].settlements).toEqual(finalSettlements);
    expect(result.state.history[0].constitutionalProfile.length).toBeGreaterThan(4);
    expect(result.state.institutionalMemory.length).toBeGreaterThanOrEqual(5);
  });

  it('feeds capital flight, foreign pressure and bureaucracy back into weekly outcomes', () => {
    const established: SocialistWorldState = {
      ...createSocialistWorldState('korea', 0),
      currentModelId: 'central-plan',
      stage: 'consolidated',
      capitalFlight: 82,
      foreignPressure: 86,
      bureaucraticCapture: 88,
      productiveDemocracy: 12,
    };
    const result = advanceSocialistWorldWeek(established, context({ week: 2 }));
    expect(result.nationDelta.civilianIndustry).toBeLessThan(.11);
    expect(result.nationDelta.institutionalCapacity).toBeLessThan(.04);
    expect(result.nationDelta.unrest).toBeGreaterThan(.03);
  });

  it('lets unresolved inequality, shortages and systemic risks create later reform pressure', () => {
    const state: SocialistWorldState = {
      ...createSocialistWorldState('korea', 0),
      currentModelId: 'central-plan',
      stage: 'consolidated',
      consumerProvision: 34,
      bureaucraticCapture: 75,
      conventionAvailable: false,
      reformCooldownUntil: 1,
    };
    const result = advanceSocialistWorldWeek(state, context({ week: 2, inequality: 75, unrest: 64, inflation: 12 }));
    expect(result.state.conventionAvailable).toBe(true);
    expect(result.events.some((event) => event.id.startsWith('socialist-reform-'))).toBe(true);
  });

  it('normalizes compatible old saves including missing settlement and risk fields', () => {
    const fallback = createSocialistWorldState('korea', 0);
    const started = startSocialistTransition(fallback, 'popular-front', sponsor, context()).state;
    const legacyActive = { ...started.active } as Record<string, unknown>;
    delete legacyActive.settlementId;
    delete legacyActive.settlements;
    const restored = normalizeSocialistWorldState({
      ...fallback,
      currentModelId: 'unknown-model',
      active: legacyActive,
      institutionalMemory: ['기억'],
      capitalFlight: undefined,
    }, fallback);
    expect(restored.currentModelId).toBeNull();
    expect(restored.active?.settlementId).toBeNull();
    expect(restored.active?.settlements).toEqual([]);
    expect(restored.capitalFlight).toBe(fallback.capitalFlight);
    expect(restored.institutionalMemory).toEqual(['기억']);
    expect(normalizeSocialistWorldState({ version: 2 }, fallback)).toBe(fallback);
  });
});
