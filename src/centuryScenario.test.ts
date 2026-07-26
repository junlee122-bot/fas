import { describe, expect, it } from 'vitest';
import { nations } from './campaign';
import {
  CENTURY_SCENARIO_COMBINATION_CAPACITY,
  createCenturyScenarioBlueprint,
} from './centuryScenario';

describe('century scenario combinations', () => {
  it('provides at least 3,000 genuinely distinct combinations for every playable nation', () => {
    nations.forEach((nation) => {
      const scenarios = Array.from({ length: 3_000 }, (_, scenarioId) => createCenturyScenarioBlueprint(nation.id, scenarioId));
      expect(new Set(scenarios.map((scenario) => scenario.combinationCode)).size).toBe(3_000);
      expect(new Set(scenarios.map((scenario) => scenario.combinationKey)).size).toBe(3_000);
      expect(new Set(scenarios.map((scenario) => scenario.profile)).size).toBe(6);
      expect(new Set(scenarios.map((scenario) => scenario.nationStrategy)).size).toBe(5);
      expect(new Set(scenarios.map((scenario) => scenario.transitionApproach)).size).toBe(4);
      expect(new Set(scenarios.map((scenario) => scenario.crisisApproach)).size).toBe(4);
      expect(new Set(scenarios.map((scenario) => scenario.futurePriority)).size).toBe(5);
    });
  });

  it('does not repeat before the mixed-radix capacity is exhausted', () => {
    const nation = nations[0];
    const scenarios = Array.from(
      { length: CENTURY_SCENARIO_COMBINATION_CAPACITY },
      (_, scenarioId) => createCenturyScenarioBlueprint(nation.id, scenarioId),
    );
    expect(new Set(scenarios.map((scenario) => scenario.combinationCode)).size).toBe(CENTURY_SCENARIO_COMBINATION_CAPACITY);
  });
});
