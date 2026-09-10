import { describe, expect, it } from 'vitest';
import {
  advancePowerNetworkWeek,
  calculateCoalitionSupport,
  createPowerNetworkState,
  makeBlocPromise,
  manageRival,
  normalizePowerNetworkState,
  resolvePowerOpportunity,
  selectLegacyPath,
  setLeadershipPrinciples,
  type PowerNetworkContext,
} from './powerNetwork';
import type { CareerRole } from './types';

const role: CareerRole = {
  id: 'test-minister',
  nationId: 'korea',
  title: '국무위원',
  branch: 'politics',
  tier: 4,
  archetype: 'cabinet-minister',
  scope: '국가 운영',
  authority: 82,
  expectation: '연합을 유지한다',
  historicalHolderId: 'test-holder',
  historicalHolderName: '기존 보직자',
  historicalOffice: '국무위원',
  historicalBasis: '테스트 보직',
  coverIdentity: '공직자',
  replacementEffect: '사용자가 결정을 내린다',
};

const context = (overrides: Partial<PowerNetworkContext> = {}): PowerNetworkContext => ({
  week: 1,
  year: 1942,
  phase: 'nation',
  nationId: 'korea',
  role,
  strategyId: 'reconstruction-state',
  budget: { reconstruction: 22, welfare: 20, education: 18, industry: 22, diplomacy: 8, security: 10 },
  politicalPower: 100,
  treasury: 500,
  stability: 66,
  warSupport: 62,
  enemyPressure: 35,
  intelNetwork: 64,
  legitimacy: 64,
  unrest: 32,
  welfare: 62,
  education: 68,
  employment: 64,
  civilianIndustry: 67,
  institutionalCapacity: 66,
  inequality: 34,
  relativeCompetitiveness: 65,
  relationAverage: 63,
  inflation: 4,
  publicConfidence: 67,
  mediaFreedom: 62,
  pressTrust: 64,
  activeElection: false,
  ...overrides,
});

describe('power network', () => {
  it('creates eight persistent blocs, a rival and a long-term legacy', () => {
    const state = createPowerNetworkState('korea', 0, role, 'reconstruction-state');
    expect(state.blocs).toHaveLength(8);
    expect(new Set(state.blocs.map((bloc) => bloc.id)).size).toBe(8);
    expect(state.rival.name).toBeTruthy();
    expect(state.legacy.activePathId).toBe('knowledge-society');
    expect(calculateCoalitionSupport(state)).toBeGreaterThan(0);
  });

  it('fulfills a measurable promise as soon as the policy result exists', () => {
    const state = createPowerNetworkState('korea', 0, role, 'social-contract');
    const accepted = makeBlocPromise(state, 'labor', context());
    expect(accepted?.state.activePromise?.progress).toBe(100);
    const weekly = advancePowerNetworkWeek(accepted!.state, context({ week: 2 }));
    expect(weekly.state.activePromise).toBeNull();
    expect(weekly.state.promiseHistory[0].status).toBe('fulfilled');
    expect(weekly.state.promiseReliability).toBeGreaterThan(state.promiseReliability);
    expect(weekly.events.some((event) => event.id.includes('promise-kept'))).toBe(true);
  });

  it('breaks an unfulfilled promise after its visible deadline', () => {
    const poor = context({ welfare: 18, employment: 20, inflation: 24, budget: { reconstruction: 30, welfare: 5, education: 15, industry: 20, diplomacy: 10, security: 20 } });
    const accepted = makeBlocPromise(createPowerNetworkState('korea', 0, role, 'security-republic'), 'labor', poor)!;
    const deadline = accepted.state.activePromise!.deadlineWeek;
    const weekly = advancePowerNetworkWeek(accepted.state, { ...poor, week: deadline + 1 });
    expect(weekly.state.promiseHistory[0].status).toBe('broken');
    expect(weekly.state.promiseReliability).toBeLessThan(60);
    expect(weekly.unrest).toBeGreaterThan(0);
  });

  it('opens a condition-based opportunity and records the chosen route', () => {
    const initial = { ...createPowerNetworkState('korea', 0, role, 'reconstruction-state'), nextOpportunityWeek: 1 };
    const opened = advancePowerNetworkWeek(initial, context({ week: 1, inflation: 13 }));
    expect(opened.state.activeOpportunity).not.toBeNull();
    expect(opened.state.activeOpportunity?.choices).toHaveLength(3);
    const resolved = resolvePowerOpportunity(opened.state, 'first', context({ week: 1, inflation: 13 }));
    expect(resolved?.state.activeOpportunity).toBeNull();
    expect(resolved?.state.opportunityHistory[0].choice).toBe(opened.state.activeOpportunity?.choices[0].label);
  });

  it('gives the rival a permission-gated interaction and a six-week cooldown', () => {
    const state = createPowerNetworkState('korea', 0, role, 'reconstruction-state');
    const result = manageRival(state, 'background-audit', context({ week: 2 }));
    expect(result).not.toBeNull();
    expect(result?.state.rival.actionCooldownUntil).toBe(8);
    expect(manageRival(result!.state, 'private-talk', context({ week: 3 }))).toBeNull();
  });

  it('turns a long-term score threshold into a named legacy milestone', () => {
    const state = createPowerNetworkState('korea', 0, role, 'reconstruction-state');
    const primed = { ...state, legacy: { ...state.legacy, progress: 24.8, highWaterMark: 24.8 } };
    const weekly = advancePowerNetworkWeek(primed, context());
    expect(weekly.state.legacy.stage).toBeGreaterThanOrEqual(1);
    expect(weekly.state.legacy.milestones[0]).toContain('지식 사회');
    expect(weekly.events.some((event) => event.id.includes('legacy-stage'))).toBe(true);
  });

  it('requires three distinct principles and changes bloc reactions', () => {
    const state = createPowerNetworkState('korea', 0, role, 'reconstruction-state');
    expect(setLeadershipPrinciples(state, ['liberty', 'truth'], context())).toBeNull();
    const result = setLeadershipPrinciples(state, ['liberty', 'truth', 'solidarity'], context());
    expect(result?.state.principles).toEqual(['liberty', 'truth', 'solidarity']);
    expect(result?.state.memories[0].title).toContain('원칙');
  });

  it('allows a legacy change only after the deliberation interval', () => {
    const state = createPowerNetworkState('korea', 0, role, 'reconstruction-state');
    const first = selectLegacyPath(state, 'industrial-miracle', context({ week: 1 }));
    expect(first?.state.legacy.activePathId).toBe('industrial-miracle');
    expect(selectLegacyPath(first!.state, 'social-commonwealth', context({ week: 10 }))).toBeNull();
    const result = selectLegacyPath(first!.state, 'social-commonwealth', context({ week: 28 }));
    expect(result?.state.legacy.activePathId).toBe('social-commonwealth');
    expect(result?.politicalPowerDelta).toBe(-6);
  });

  it('migrates an old save without power-network fields safely', () => {
    const restored = normalizePowerNetworkState({ promiseReliability: 73, blocs: [{ id: 'labor', support: 81 }] }, 'korea', 100, role, 'social-contract');
    expect(restored.blocs).toHaveLength(8);
    expect(restored.blocs.find((bloc) => bloc.id === 'labor')?.support).toBe(81);
    expect(restored.promiseReliability).toBe(73);
    expect(restored.rival.name).toBeTruthy();
  });
});
