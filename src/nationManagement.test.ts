import { describe, expect, it } from 'vitest';
import { createEconomyState } from './economy';
import {
  advanceNationManagementWeek,
  calculateNationScore,
  calculateTransitionReadiness,
  createNationManagementState,
  getActiveNationAgenda,
  normalizeNationManagementState,
  rebalanceNationBudget,
  resolveNationAgendaChoice,
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
    const ready = calculateTransitionReadiness({ ...game, week: 160 }, 68, economy, 'britain');
    const unready = calculateTransitionReadiness(
      { ...game, week: 160, victoryScore: 18, stability: 26, treasury: 80, factories: 8 },
      22,
      { ...economy, inflation: 18 },
      'britain',
    );
    expect(ready.eligible).toBe(true);
    expect(ready.score).toBeGreaterThan(unready.score);
    expect(unready.eligible).toBe(false);
    expect(Object.keys(ready.pillars)).toEqual(['security', 'legitimacy', 'finance', 'industry', 'diplomacy', 'sovereignty']);
    expect(ready.transitionLabel).toBe('연합전 승리와 제국 재협상');
    expect(ready.earliestWeek).toBe(150);
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

  it('prevents perfect domestic metrics from erasing late-era structural costs', () => {
    const economy = createEconomyState('britain');
    const base = createNationManagementState('britain', game, economy, 8, 'victory');
    const excellent = {
      ...base,
      legitimacy: 100,
      welfare: 100,
      infrastructure: 100,
      education: 100,
      housing: 100,
      employment: 100,
      inequality: 0,
      institutionalCapacity: 100,
      civilianIndustry: 100,
      unrest: 0,
    };
    const healthyCompetition = calculateNationScore({ ...excellent, relativeCompetitiveness: 82, institutionalAge: 8, demographicPressure: 8, ecologicalPressure: 8, hegemonyCost: 4 });
    const lateHegemony = calculateNationScore({ ...excellent, relativeCompetitiveness: 58, institutionalAge: 55, demographicPressure: 52, ecologicalPressure: 61, hegemonyCost: 48 });
    expect(healthyCompetition).toBeLessThan(99);
    expect(lateHegemony).toBeLessThan(healthyCompetition);
  });

  it('regenerates social unrest from country-specific structural pressure instead of collapsing to zero', () => {
    const economy = createEconomyState('britain');
    const base = createNationManagementState('britain', game, economy, 8, 'victory');
    const state = { ...base, unrest: 0 };
    const result = advanceNationManagementWeek(state, {
      week: game.week + 1,
      game,
      economy,
      relationAverage: 62,
      completedResearch: 8,
      publicHealthPressure: 4,
    });

    expect(result.state.unrest).toBeGreaterThanOrEqual(result.state.structuralPressure.floor);
    expect(result.state.structuralPressure.targetUnrest).toBeGreaterThan(result.state.structuralPressure.floor);
    expect(result.state.structuralPressure.drivers[0].value).toBeGreaterThan(0);
  });

  it('opens a national historical agenda on its own cadence and records the actual response', () => {
    const economy = createEconomyState('britain');
    const state = createNationManagementState('britain', game, economy, 3, 'victory');
    const result = advanceNationManagementWeek(state, {
      week: state.agenda.nextIssueWeek,
      game,
      economy,
      relationAverage: 62,
      completedResearch: 3,
      publicHealthPressure: 0,
    });
    const active = getActiveNationAgenda(result.state);
    expect(active?.title).toBeTruthy();

    const decision = resolveNationAgendaChoice(result.state, 'bargain', state.agenda.nextIssueWeek);
    expect(decision?.state.agenda.active).toBeNull();
    expect(decision?.state.agenda.totalDecisions).toBe(1);
    expect(decision?.state.agenda.history[0].choiceId).toBe('bargain');
    expect(decision?.title).toContain(active!.title);
  });
});
