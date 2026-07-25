import { describe, expect, it } from 'vitest';
import { runPlaytestMatrix } from './playtestHarness';

describe('225-session UX playtest harness', () => {
  it('runs a balanced, deterministic matrix through the live game engines', () => {
    const result = runPlaytestMatrix(225, 104);

    expect(result.sessions).toHaveLength(225);
    expect(result.aggregate.totalWeeks).toBe(23_400);
    expect(result.aggregate.nationCoverage).toBe(13);
    expect(result.aggregate.roleCoverage).toBe(169);
    expect(result.aggregate.tierCoverage).toBe(5);
    expect(result.aggregate.branchCoverage).toBe(3);
    expect(result.aggregate.profileCoverage).toBe(5);
    expect(result.sessions.every((session) => Number.isFinite(session.finalTreasury))).toBe(true);
  }, 30_000);
});
