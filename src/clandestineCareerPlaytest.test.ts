import { describe, expect, it } from 'vitest';
import {
  aggregateClandestineCareerSessions,
  runClandestineCareerSession,
} from './clandestineCareerPlaytest';

describe('clandestine career long-horizon playtest', () => {
  it('covers every behavior profile and produces bounded weekly rates', () => {
    const sessions = Array.from({ length: 12 }, (_, id) => runClandestineCareerSession(id, 520));
    const run = aggregateClandestineCareerSessions(sessions, 520);
    expect(run.aggregate.profileCoverage).toBe(6);
    expect(run.aggregate.roleCoverage).toBe(12);
    expect(run.aggregate.branchCoverage).toBe(3);
    expect(run.aggregate.tierCoverage).toBe(4);
    expect(run.aggregate.attentionWeekRate).toBeGreaterThanOrEqual(0);
    expect(run.aggregate.attentionWeekRate).toBeLessThanOrEqual(100);
    expect(run.aggregate.highStressWeekRate).toBeLessThanOrEqual(100);
    expect(run.sessions.every((session) => session.weeksPlayed === 520)).toBe(true);
  });

  it('keeps era, mission and incident measurements internally consistent', () => {
    const session = runClandestineCareerSession(0, 1040);
    expect(session.eraMetrics.reduce((sum, era) => sum + era.weeks, 0)).toBe(1040);
    expect(session.missionsResolved + session.missionsFailed).toBeLessThanOrEqual(session.missionsOffered);
    expect(session.missionResponses).toBeLessThanOrEqual(session.missionsOffered);
    expect(session.incidents).toBe(Object.values(session.incidentKinds).reduce((sum, value) => sum + (value ?? 0), 0));
  });
});
