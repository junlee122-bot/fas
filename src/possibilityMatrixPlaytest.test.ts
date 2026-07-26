import { describe, expect, it } from 'vitest';
import { nations } from './campaign';
import {
  aggregatePossibilityMatrixSessions,
  runPossibilityMatrixSession,
} from './possibilityMatrixPlaytest';
import { worldHistoryEvents } from './worldHistory';

describe('3,000-combination possibility matrix', () => {
  it('resolves every historical and future event family through 2060', () => {
    const result = runPossibilityMatrixSession('korea', 42);
    expect(result.eraSnapshots).toHaveLength(12);
    expect(result.eraSnapshots.at(-1)?.endYear).toBe(2060);
    expect(result.eventChoices).toBe(worldHistoryEvents.length);
    expect(result.futurePathCode).toMatch(/^[a-z0-9]+$/);
  });

  it('is deterministic while different scenario combinations produce different futures', () => {
    const first = runPossibilityMatrixSession('germany', 17);
    const repeated = runPossibilityMatrixSession('germany', 17);
    const alternative = runPossibilityMatrixSession('germany', 18);
    expect(repeated).toEqual(first);
    expect(alternative.scenario.combinationKey).not.toBe(first.scenario.combinationKey);
    expect(alternative.futurePathCode).not.toBe(first.futurePathCode);
  });

  it('aggregates all playable nations without losing combination coverage', () => {
    const sessions = nations.flatMap((nation) => [0, 1].map((scenarioId) =>
      runPossibilityMatrixSession(nation.id, scenarioId)
    ));
    const run = aggregatePossibilityMatrixSessions(sessions, 2);
    expect(run.totalSessions).toBe(nations.length * 2);
    expect(run.uniqueCombinations).toBe(nations.length * 2);
    expect(run.futurePathCollisionRate).toBe(0);
    Object.values(run.byNation).forEach((nation) => expect(nation.uniqueCombinations).toBe(2));
  });
});
