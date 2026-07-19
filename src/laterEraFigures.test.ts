import { describe, expect, it } from 'vitest';
import {
  createLaterEraCandidates,
  getEligibleLaterEraFigures,
  getLaterEraRosterSummary,
  laterEraFigures,
} from './laterEraFigures';

describe('later-era real-person generations', () => {
  it('ships a sourced forty-person roster for every playable nation', () => {
    const summary = getLaterEraRosterSummary();
    expect(summary.total).toBe(520);
    expect(Object.values(summary.byNation)).toHaveLength(13);
    expect(Object.values(summary.byNation).every((count) => count === 40)).toBe(true);
    expect(laterEraFigures.some((figure) => figure.name === '스티븐 호킹')).toBe(true);
    expect(laterEraFigures.some((figure) => figure.name === '마틴 루터 킹 2세')).toBe(true);
    expect(laterEraFigures.some((figure) => figure.name === '유리 가가린')).toBe(true);
    expect(laterEraFigures.some((figure) => figure.name === '봉준호')).toBe(true);
  });

  it('never introduces a person before adulthood, even on a highly accelerated worldline', () => {
    expect(getEligibleLaterEraFigures('usa', 1942, 2099)).toHaveLength(0);
    const eligible = getEligibleLaterEraFigures('usa', 1950, 2099);
    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible.every((figure) => 1950 >= figure.minimumAdultYear)).toBe(true);
  });

  it('allows an adult to be discovered early only when the alternate-history horizon reaches their generation', () => {
    const figure = laterEraFigures.find((candidate) => candidate.nationId === 'britain' && candidate.minimumAdultYear < candidate.generationUnlockYear);
    expect(figure).toBeDefined();
    if (!figure) return;
    expect(getEligibleLaterEraFigures('britain', figure.minimumAdultYear, figure.generationUnlockYear - 1).some((candidate) => candidate.qid === figure.qid)).toBe(false);
    const candidate = createLaterEraCandidates('britain', figure.minimumAdultYear, figure.generationUnlockYear)
      .find((entry) => entry.personId === `later-${figure.qid}`);
    expect(candidate?.alternateHistoryEntry).toBe(true);
    expect(candidate?.marketEntryYear).toBe(figure.minimumAdultYear);
  });

  it('keeps factual identity fields separate from deterministic game-only ratings', () => {
    const first = createLaterEraCandidates('usa', 1980, 1980);
    const second = createLaterEraCandidates('usa', 1980, 1980);
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((candidate) => candidate.sourceUrl?.startsWith('https://www.wikidata.org/wiki/Q'))).toBe(true);
    expect(first.every((candidate) => candidate.historicalConstraint?.includes('대체역사 시뮬레이션'))).toBe(true);
    expect(first.every((candidate) => candidate.birthYear && 1980 >= candidate.birthYear + 18)).toBe(true);
  });
});
