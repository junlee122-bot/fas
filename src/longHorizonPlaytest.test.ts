import { describe, expect, it } from 'vitest';
import {
  aggregateLongHorizonSessions,
  runLongHorizonSession,
} from './longHorizonPlaytest';

describe('1942-2020 long-horizon production-engine playtest', () => {
  it('runs deterministically across war and nation-management phases', () => {
    const first = runLongHorizonSession(0, 260);
    const second = runLongHorizonSession(0, 260);

    expect(second).toEqual(first);
    expect(first.warWeeks).toBe(104);
    expect(first.nationWeeks).toBe(156);
    expect(first.worldFlashpointCount).toBeGreaterThan(0);
    expect(first.finalResearchCompleted).toBe(6);
  }, 30_000);

  it('aggregates independently generated session ranges without rerunning them', () => {
    const sessions = [0, 1, 2, 3, 4, 5].map((id) => runLongHorizonSession(id, 156));
    const result = aggregateLongHorizonSessions(sessions, 156);

    expect(result.aggregate.sessionCount).toBe(6);
    expect(result.aggregate.profileCoverage).toBe(6);
    expect(result.aggregate.totalWeeks).toBe(936);
    expect(result.findings.map((finding) => finding.id)).toContain('research-content-cliff');
  }, 30_000);
});
