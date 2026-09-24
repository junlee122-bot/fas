import { describe, expect, it } from 'vitest';
import { careerRoles } from './campaign';
import {
  advanceNationalPlanWeek,
  advanceStrategicOperationWeek,
  createNationalPlanningState,
  createStrategicContinuityState,
  launchNationalPlan,
  launchStrategicOperation,
  type NationalPlanMetrics,
  type StrategicOperationContext,
} from './strategicContinuity';

const role = careerRoles.find((candidate) => candidate.nationId === 'korea' && candidate.branch === 'politics' && candidate.tier === 1)!;
const operationContext: StrategicOperationContext = {
  week: (1948 - 1942) * 52,
  role,
  politicalPower: 100,
  treasury: 900,
  commandPoints: 80,
  stability: 72,
  legitimacy: 68,
  institutionalCapacity: 64,
  securityBudget: 18,
  diplomacyBudget: 22,
  intelNetwork: 65,
  enemyPressure: 34,
};
const planMetrics: NationalPlanMetrics = {
  nationalScore: 62,
  mandateScore: 61,
  legitimacy: 70,
  welfare: 68,
  education: 72,
  civilianIndustry: 67,
  institutionalCapacity: 71,
  inequality: 36,
  unrest: 28,
  relativeCompetitiveness: 66,
  demographicPressure: 24,
  ecologicalPressure: 25,
  hegemonyCost: 12,
  relationAverage: 69,
};

describe('strategic continuity and long-term planning', () => {
  it('keeps a peacetime operation active for multiple weeks and records its result', () => {
    const launch = launchStrategicOperation(createStrategicContinuityState(), 'humanitarian-airlift', operationContext)!;
    expect(launch.state.active?.progressWeeks).toBe(0);
    let state = launch.state;
    for (let offset = 1; offset <= 10; offset += 1) {
      state = advanceStrategicOperationWeek(state, { ...operationContext, week: operationContext.week + offset }).state;
    }
    expect(state.active).toBeNull();
    expect(state.history).toHaveLength(1);
    expect(state.history[0].resolvedWeek - state.history[0].startedWeek).toBe(10);
  });

  it('reviews and resolves a one-year national plan from live metrics', () => {
    const started = launchNationalPlan(createNationalPlanningState(), 'secure-transition', 100, planMetrics)!;
    const halfway = advanceNationalPlanWeek(started, 126, planMetrics);
    expect(halfway.state.active?.progress).toBeGreaterThan(0);
    expect(halfway.event?.title).toContain('중간평가');
    const finished = advanceNationalPlanWeek(halfway.state, 152, planMetrics);
    expect(finished.state.active).toBeNull();
    expect(finished.state.history[0].planId).toBe('secure-transition');
  });
});
