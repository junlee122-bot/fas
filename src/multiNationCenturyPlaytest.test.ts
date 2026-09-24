import { describe, expect, it } from 'vitest';
import { nations } from './campaign';
import {
  aggregateMultiNationCenturySessions,
  getNationCenturyEngineSessionId,
  runNationCenturySession,
} from './multiNationCenturyPlaytest';

describe('multi-nation century playtest harness', () => {
  it('routes the same scenario index into every playable nation', () => {
    const sessions = nations.map((nation) => runNationCenturySession(nation.id, 0, 400));
    const run = aggregateMultiNationCenturySessions(sessions, 1, 400);

    expect(run.aggregate.nationCount).toBe(nations.length);
    expect(run.aggregate.totalSessions).toBe(nations.length);
    expect(new Set(sessions.map((session) => session.nationId)).size).toBe(nations.length);
    expect(Object.values(run.aggregate.byNation).every((nation) => nation.sessions === 1)).toBe(true);
    expect(run.aggregate.transitionArchetypeCoverage).toBeGreaterThan(1);
    expect(Object.values(run.aggregate.byNation).every((nation) => nation.averageFinalStructuralUnrestTarget >= nation.averageFinalStructuralUnrestFloor)).toBe(true);
    expect(Object.values(run.aggregate.byNation).every((nation) => nation.warDecisionsPerYear > 0)).toBe(true);
    expect(Object.values(run.aggregate.byNation).every((nation) => nation.averageNationYears === 0 || nation.nationDecisionsPerYear > 0)).toBe(true);
  }, 60_000);

  it('uses stable, non-overlapping engine session ids', () => {
    const ids = nations.flatMap((nation) => [0, 1, 499].map((scenarioId) => getNationCenturyEngineSessionId(nation.id, scenarioId)));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every office and all three authority branches with thirteen anchor careers', () => {
    const sessions = Array.from({ length: 13 }, (_, scenarioId) => runNationCenturySession('korea', scenarioId, 400));
    const run = aggregateMultiNationCenturySessions(sessions, 13, 400);
    expect(run.aggregate.roleCoverage).toBe(13);
    expect(run.aggregate.expectedRoleCoverage).toBe(169);
    expect(run.aggregate.branchCoverage).toBe(3);
    sessions.forEach((session) => {
      expect(session.warDecisionInteractions + session.nationDecisionInteractions).toBe(session.decisionInteractions);
      const warDecisionsPerYear = session.warDecisionInteractions / Math.max(1, session.warWeeks / 52);
      expect(warDecisionsPerYear).toBeGreaterThanOrEqual(6);
      expect(warDecisionsPerYear).toBeLessThanOrEqual(26);
    });
  }, 60_000);
});
