import { describe, expect, it } from 'vitest';
import matrixPayload from '../docs/possibility-matrix-3000-2060-summary.json';
import weeklyAnchorPayload from '../docs/possibility-matrix-weekly-anchor-13-2060-summary.json';

const matrix = matrixPayload as any;
const weeklyPayload = weeklyAnchorPayload as any;

describe('possibility remediation artifacts', () => {
  it('keeps the full matrix free of P0/P1 findings and weak choice axes', () => {
    const impacts = Object.values(matrix.byNation).flatMap((nation: any) => nation.dimensionImpacts);
    const impactKeys = [
      'transitionYearSpread',
      'nationalScoreSpread',
      'unrestSpread',
      'prosperitySpread',
      'sustainabilitySpread',
      'crisisAttemptSpread',
      'conflictSpread',
      'outbreakSpread',
      'electionWinRateSpread',
    ];

    expect(matrix.totalSessions).toBe(39_000);
    expect(matrix.uniqueCombinations).toBe(39_000);
    expect(matrix.uniqueFuturePaths).toBe(39_000);
    expect(matrix.futurePathCollisionRate).toBe(0);
    expect(matrix.findings.every((finding: any) => finding.priority === 'P2')).toBe(true);
    expect(impacts.every((impact: any) => Math.max(...impactKeys.map((key) => impact[key])) >= 1.5)).toBe(true);
  });

  it('keeps the expanded weekly anchor on every role and inside the interaction bounds', () => {
    const weekly = weeklyPayload.aggregate;
    const nations = Object.values(weekly.byNation) as any[];
    const crisisKinds = new Set(nations.flatMap((nation) => Object.keys(nation.crisisIncidentsByKind)));

    expect(weekly.totalSessions).toBe(169);
    expect(weekly.roleCoverage).toBe(weekly.expectedRoleCoverage);
    expect(weekly.branchCoverage).toBe(3);
    expect(weekly.tierCoverage).toBe(5);
    expect(weekly.profileCoverage).toBe(6);
    expect(nations.every((nation) => nation.warDecisionsPerYear >= 6 && nation.warDecisionsPerYear <= 26)).toBe(true);
    expect(nations.every((nation) => nation.nationDecisionsPerYear >= 6 && nation.nationDecisionsPerYear <= 26)).toBe(true);
    expect(nations.every((nation) => nation.averageSuccessfulRuptures <= 2.5)).toBe(true);
    expect(crisisKinds).toEqual(new Set([
      'constitutional-crisis',
      'regime-struggle',
      'center-region-break',
      'colonial-repression',
      'exile-split',
      'liberation-split',
    ]));
    expect(weeklyPayload.findings.every((finding: any) => finding.priority === 'P2')).toBe(true);
  });
});
