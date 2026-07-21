import { describe, expect, it } from 'vitest';
import { createEconomyState } from './economy';
import {
  advanceNationManagementWeek,
  calculateTransitionReadiness,
  createNationManagementState,
  normalizeNationManagementState,
  rebalanceNationBudget,
} from './nationManagement';
import type { GameState } from './types';

const game: GameState = {
  week: 48,
  manpower: 1200,
  politicalPower: 82,
  fuel: 70,
  steel: 108,
  factories: 34,
  stability: 72,
  warSupport: 78,
  commandPoints: 48,
  treasury: 860,
  victoryScore: 66,
  airPower: 61,
  navalPower: 56,
  intelNetwork: 64,
  enemyPressure: 42,
};

describe('war-to-state nation management', () => {
  it('inherits wartime conditions into a scored postwar government', () => {
    const economy = createEconomyState('britain');
    const state = createNationManagementState('britain', game, economy, 3, 'victory');
    expect(state.startedWeek).toBe(game.week);
    expect(state.transitionReason).toBe('victory');
    expect(Object.values(state.budget).reduce((total, amount) => total + amount, 0)).toBe(100);
    expect(state.infrastructure).toBeGreaterThan(40);
    expect(state.nationalScore).toBeGreaterThan(0);
    expect(state.mandateScore).toBeGreaterThan(0);
  });

  it('requires a credible mix of war position, legitimacy, finance, industry and diplomacy for negotiated peace', () => {
    const economy = createEconomyState('britain');
    const ready = calculateTransitionReadiness(game, 68, economy);
    const unready = calculateTransitionReadiness({ ...game, victoryScore: 18, stability: 26, treasury: 80, factories: 8 }, 22, { ...economy, inflation: 18 });
    expect(ready.eligible).toBe(true);
    expect(ready.score).toBeGreaterThan(unready.score);
    expect(unready.eligible).toBe(false);
    expect(Object.keys(ready.pillars)).toEqual(['security', 'legitimacy', 'finance', 'industry', 'diplomacy']);
  });

  it('rebalances a fixed 100 percent cabinet budget without mutating the previous state', () => {
    const economy = createEconomyState('britain');
    const state = createNationManagementState('britain', game, economy, 3, 'negotiated');
    const next = rebalanceNationBudget(state, 'education', 5);
    expect(next).not.toBe(state);
    expect(next.budget.education).toBe(state.budget.education + 5);
    expect(Object.values(next.budget).reduce((total, amount) => total + amount, 0)).toBe(100);
    expect(state.budget.education).toBe(15);
  });

  it('advances fiscal, social and political outcomes with an auditable cause-and-effect report', () => {
    const economy = createEconomyState('britain');
    const state = createNationManagementState('britain', game, economy, 3, 'victory');
    const result = advanceNationManagementWeek(state, {
      week: game.week + 1,
      game,
      economy,
      relationAverage: 62,
      completedResearch: 3,
      publicHealthPressure: 8,
    });
    expect(result.gameDelta.week).toBe(1);
    expect(result.state.reports[0]).toEqual(result.report);
    expect(result.report.causes.length).toBeGreaterThanOrEqual(3);
    expect(result.report.effects.some((effect) => effect.includes('국가 성과'))).toBe(true);
    expect(result.report.fiscalBalance).toBeCloseTo(result.report.fiscalRevenue - result.report.fiscalExpenditure, 1);
    expect(result.state.infrastructure).toBeGreaterThan(state.infrastructure);
  });

  it('turns the scheduled public evaluation into a renewable four-year mandate', () => {
    const economy = { ...createEconomyState('britain'), inflation: 2, publicConfidence: 90 };
    const base = createNationManagementState('britain', game, economy, 5, 'victory');
    const campaign = base.electoral.activeCampaign!;
    const state = {
      ...base,
      legitimacy: 90,
      welfare: 88,
      employment: 92,
      inequality: 18,
      unrest: 12,
      nextElectionWeek: game.week + 1,
      electoral: {
        ...base.electoral,
        nextParliamentaryWeek: game.week + 1,
        activeCampaign: {
          ...campaign,
          electionWeek: game.week + 1,
          momentum: Object.fromEntries(base.electoral.candidates.map((candidate, index) => [candidate.id, index === 0 ? 92 : 12])),
        },
      },
    };
    const result = advanceNationManagementWeek(state, {
      week: game.week + 1,
      game,
      economy,
      relationAverage: 75,
      completedResearch: 5,
      publicHealthPressure: 0,
    });
    expect(result.report.events.some((event) => event.id.startsWith('result-'))).toBe(true);
    expect(result.state.electionWins).toBe(1);
    expect(result.state.nextElectionWeek).toBe(game.week + 1 + 208);
  });

  it('migrates valid saves and rejects a malformed budget total', () => {
    const economy = createEconomyState('britain');
    const fallback = createNationManagementState('britain', game, economy, 3, 'negotiated');
    const restored = normalizeNationManagementState({ ...fallback, strategyId: 'developmental-state', taxBurden: 63 }, fallback);
    const malformed = normalizeNationManagementState({ ...fallback, budget: { ...fallback.budget, industry: 99 } }, fallback);
    expect(restored.strategyId).toBe('developmental-state');
    expect(restored.taxBurden).toBe(63);
    expect(malformed).toBe(fallback);
  });
});
