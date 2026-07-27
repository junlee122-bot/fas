import { describe, expect, it } from 'vitest';
import { careerRoles, nations } from './campaign';
import {
  applyCivilizationEconomyEffects,
  civilizationDomainDefinitions,
  civilizationEras,
  civilizationPrograms,
  countCivilizationEffectSurfaces,
  getCivilizationDecisionId,
  getCivilizationPaths,
  getCivilizationPrograms,
  getCivilizationReviewedMarker,
  getCivilizationReviewMarker,
  nationCivilizationProfiles,
  parseCivilizationReviewMarker,
} from './civilizationSystems';
import type { EconomyState } from './economy';

describe('era-spanning civilization systems', () => {
  it('covers ten civilian domains in every era with traceable historical sources', () => {
    expect(civilizationEras).toHaveLength(6);
    expect(Object.keys(civilizationDomainDefinitions)).toHaveLength(10);
    expect(civilizationPrograms).toHaveLength(60);

    civilizationEras.forEach((era) => {
      const programs = getCivilizationPrograms(era.startYear);
      expect(programs).toHaveLength(10);
      expect(new Set(programs.map((program) => program.domainId))).toHaveLength(10);
      programs.forEach((program) => {
        expect(program.historicalBasis.length).toBeGreaterThan(30);
        expect(program.sourceUrl).toMatch(/^https:\/\//);
        expect(program.reviewWeeks).toBeGreaterThanOrEqual(4);
      });
    });
  });

  it('generates 2,340 nation-era-domain approaches with visible trade-offs', () => {
    const matrix = nations.flatMap((nation) => {
      const role = careerRoles.find((candidate) => candidate.nationId === nation.id && candidate.tier === 1)!;
      return civilizationPrograms.flatMap((program) => getCivilizationPaths(program, nation.id, role).map((path) => ({ nationId: nation.id, path })));
    });

    expect(Object.keys(nationCivilizationProfiles)).toHaveLength(nations.length);
    expect(matrix).toHaveLength(13 * 6 * 10 * 3);
    expect(new Set(matrix.map(({ nationId, path }) => `${nationId}:${path.id}`))).toHaveLength(matrix.length);
    matrix.forEach(({ path }) => {
      expect(path.effectiveness).toBeGreaterThanOrEqual(30);
      expect(path.effectiveness).toBeLessThanOrEqual(140);
      expect(path.politicalCost).toBeGreaterThan(0);
      expect(path.treasuryCost).toBeGreaterThan(0);
      expect(path.beneficiary.length).toBeGreaterThan(5);
      expect(path.risk.length).toBeGreaterThan(5);
      expect(countCivilizationEffectSurfaces(path)).toBeGreaterThanOrEqual(2);
      expect(path.id).toBe(getCivilizationDecisionId(path.programId, path.approachId));
    });
  });

  it('turns office level and departmental remit into different authority routes', () => {
    const koreaTop = careerRoles.find((role) => role.id === 'korea-tier1')!;
    const koreaFieldAgent = careerRoles.find((role) => role.id === 'korea-resistance-agent')!;
    const program = civilizationPrograms.find((candidate) => candidate.domainId === 'housing')!;

    const executive = getCivilizationPaths(program, 'korea', koreaTop)[0];
    const fieldProposal = getCivilizationPaths(program, 'korea', koreaFieldAgent)[0];

    expect(executive.authorityMode).toBe('direct');
    expect(fieldProposal.authorityMode).toBe('proposal');
    expect(fieldProposal.politicalCost).toBeGreaterThan(executive.politicalCost);
    expect(fieldProposal.effectiveness).toBeLessThan(executive.effectiveness);
  });

  it('applies policy effects immutably and respects economy bounds', () => {
    const role = careerRoles.find((candidate) => candidate.id === 'britain-tier1')!;
    const program = civilizationPrograms.find((candidate) => candidate.domainId === 'food')!;
    const path = getCivilizationPaths(program, 'britain', role)[0];
    const economy = {
      debt: 499,
      inflation: 99,
      publicConfidence: 99,
    } as EconomyState;

    const next = applyCivilizationEconomyEffects(economy, path);
    expect(next).not.toBe(economy);
    expect(next.debt).toBeGreaterThanOrEqual(0);
    expect(next.debt).toBeLessThanOrEqual(500);
    expect(next.inflation).toBeGreaterThanOrEqual(0);
    expect(next.inflation).toBeLessThanOrEqual(100);
    expect(next.publicConfidence).toBeGreaterThanOrEqual(0);
    expect(next.publicConfidence).toBeLessThanOrEqual(100);
    expect(economy.debt).toBe(499);
  });

  it('serializes delayed review schedules into save-compatible decision markers', () => {
    const role = careerRoles.find((candidate) => candidate.id === 'usa-tier1')!;
    const program = civilizationPrograms.find((candidate) => candidate.domainId === 'science')!;
    const path = getCivilizationPaths(program, 'usa', role)[2];
    const marker = getCivilizationReviewMarker(path, 26);
    const schedule = parseCivilizationReviewMarker(marker);

    expect(schedule).toEqual({ dueWeek: 26, programId: program.id, approachId: 'market' });
    expect(getCivilizationReviewedMarker(schedule!)).toBe(`civilization-reviewed:26:${program.id}:market`);
    expect(parseCivilizationReviewMarker(path.id)).toBeNull();
  });
});
