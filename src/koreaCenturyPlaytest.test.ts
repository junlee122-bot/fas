import { describe, expect, it } from 'vitest';
import { runKoreaCenturyPlaytest } from './koreaCenturyPlaytest';

describe('Korea century playtest harness', () => {
  it('runs only Korean careers and records liberation readiness at transition', () => {
    const run = runKoreaCenturyPlaytest(6, 600);

    expect(run.sessions).toHaveLength(6);
    expect(new Set(run.sessions.map((session) => session.nationId))).toEqual(new Set(['korea']));
    expect(run.aggregate.nationCoverage).toBe(1);
    expect(run.aggregate.profileCoverage).toBe(6);
    expect(run.sessions.every((session) => session.koreaLiberationAtTransition !== null)).toBe(true);
    expect(run.aggregate.totalWeeks).toBe(3_600);
  }, 60_000);
});
