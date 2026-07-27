import { describe, expect, it } from 'vitest';
import summaryPayload from '../docs/arms-diplomacy-stage-1000-2060-summary.json';
import { nations } from './campaign';
import { strategicStages } from './strategicArmsDiplomacy';

const summary = summaryPayload as any;
const nationReports = import.meta.glob<string>(
  '../docs/arms-diplomacy-stage-1000-2060-nations/*/*-1000-per-stage.md',
  { eager: true, query: '?raw', import: 'default' },
);
const nationSummaries = import.meta.glob<any[]>(
  '../docs/arms-diplomacy-stage-1000-2060-nations/*/*-1000-per-stage-summary.json',
  { eager: true, import: 'default' },
);
const nationRawArchives = import.meta.glob<string>(
  '../docs/arms-diplomacy-stage-1000-2060-nations/*/*-1000-per-stage-data.json.gz',
  { eager: true, query: '?url', import: 'default' },
);

describe('arms and diplomacy playtest artifacts', () => {
  it('preserves the complete 65,000-session nation-stage matrix', () => {
    expect(summary.sessions).toBe(65_000);
    expect(summary.simulationsPerNationStage).toBe(1_000);
    expect(summary.nationCoverage).toBe(nations.length);
    expect(summary.stageCoverage).toBe(strategicStages.length);
    expect(summary.byNationStage).toHaveLength(nations.length * strategicStages.length);
    expect(summary.totalWeaponProgramUses).toBe(780_000);
    expect(summary.totalDiplomaticPolicyUses).toBe(260_000);
    expect(summary.totalDecisions).toBe(1_040_000);
    expect(summary.findings.every((finding: any) => finding.priority === 'P2')).toBe(true);
  });

  it('keeps a readable report, summary, and compressed raw sessions for every nation', () => {
    expect(Object.keys(nationReports)).toHaveLength(nations.length);
    expect(Object.keys(nationSummaries)).toHaveLength(nations.length);
    expect(Object.keys(nationRawArchives)).toHaveLength(nations.length);
    expect(Object.values(nationReports).every((report) => report.length > 100)).toBe(true);
    expect(Object.values(nationRawArchives).every((archiveUrl) => archiveUrl.length > 0)).toBe(true);
    expect(Object.values(nationSummaries).every((nationSummary) => (
      nationSummary.length === strategicStages.length
      && nationSummary.every((stage) => stage.sessions === 1_000)
    ))).toBe(true);
  });
});
