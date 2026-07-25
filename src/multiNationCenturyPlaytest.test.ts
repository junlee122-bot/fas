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
  }, 60_000);

  it('uses stable, non-overlapping engine session ids', () => {
    const ids = nations.flatMap((nation) => [0, 1, 499].map((scenarioId) => getNationCenturyEngineSessionId(nation.id, scenarioId)));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
