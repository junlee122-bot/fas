import { describe, expect, it } from 'vitest';
import { aggregateCenturySessions } from './centuryPlaytest';
import { runLongHorizonSession } from './longHorizonPlaytest';

describe('1942-2060 century playtest instrumentation', () => {
  it('records decade-level agency, event and saturation metrics', () => {
    const session = runLongHorizonSession(0, 520);
    expect(session.eraMetrics.map((era) => era.era)).toEqual(['1942–1949', '1950–1959']);
    expect(session.eraMetrics.reduce((sum, era) => sum + era.weeks, 0)).toBe(520);
    expect(session.eraMetrics[0].actionPrompts).toBeGreaterThan(0);
    expect(session.eraMetrics[0].inflationTotal).toBeGreaterThanOrEqual(0);
  }, 60_000);

  it('aggregates independently generated sessions into UX findings', () => {
    const sessions = Array.from({ length: 6 }, (_, id) => runLongHorizonSession(id, 260));
    const run = aggregateCenturySessions(sessions, 260);
    expect(run.aggregate.sessionCount).toBe(6);
    expect(run.aggregate.profileCoverage).toBe(6);
    expect(run.aggregate.eraTimeline.length).toBeGreaterThan(0);
    expect(run.findings.map((finding) => finding.id)).toContain('century-agency-dilution');
  }, 60_000);
});
