import { describe, expect, it } from 'vitest';
import { nations } from './campaign';
import {
  getRecruitableHistoricalExperts,
  getStartingHistoricalExperts,
  historicalExperts,
  historicalExpertCoverage,
  minimumHistoricalExpertsPerNation,
} from './historicalExperts';
import { wartimeHistoricalExperts, wartimeHistoricalExpertCoverage } from './wartimeHistoricalExperts';

describe('historical civilian expert database', () => {
  it('models a broad, unique roster with traceable historical context', () => {
    expect(historicalExperts.length).toBeGreaterThanOrEqual(2600);
    expect(new Set(historicalExperts.map((profile) => profile.id)).size).toBe(historicalExperts.length);
    expect(new Set(historicalExperts.map((profile) => profile.name)).size).toBe(historicalExperts.length);

    historicalExperts.forEach((profile) => {
      expect(profile.accessNations).toContain(profile.primaryNation);
      expect(profile.birthYear).toBeGreaterThanOrEqual(1850);
      expect(profile.birthYear).toBeLessThanOrEqual(1924);
      expect(profile.office1942.length).toBeGreaterThan(5);
      expect(profile.wartimeLocation.length).toBeGreaterThan(2);
      expect(profile.historicalConstraint.length).toBeGreaterThan(10);
      expect(profile.expertise).toHaveLength(3);
      expect(profile.networks).toHaveLength(2);
      expect(profile.sourceLabel.length).toBeGreaterThan(5);
      expect(profile.potential).toBeGreaterThanOrEqual(profile.ability);
    });
  }, 15_000);

  it('gives every playable nation science and economy leadership plus a real talent market', () => {
    expect(Object.keys(historicalExpertCoverage)).toHaveLength(nations.length);
    expect(minimumHistoricalExpertsPerNation).toBeGreaterThanOrEqual(200);
    nations.forEach((nation) => {
      const starting = getStartingHistoricalExperts(nation.id);
      expect(starting.science.department).toBe('science');
      expect(starting.economy.department).toBe('economy');
      expect(starting.science.primaryNation).toBe(nation.id);
      expect(starting.economy.primaryNation).toBe(nation.id);
      expect(historicalExpertCoverage[nation.id], nation.id).toBeGreaterThanOrEqual(200);
      expect(getRecruitableHistoricalExperts(nation.id).length, nation.id).toBeGreaterThanOrEqual(198);
    });
  });

  it('keeps the mass roster tied to unique public historical identifiers', () => {
    const wikidataProfiles = historicalExperts.filter((profile) => profile.id.startsWith('wd-q'));
    expect(wikidataProfiles.length).toBeGreaterThanOrEqual(2500);
    expect(new Set(wikidataProfiles.map((profile) => profile.id)).size).toBe(wikidataProfiles.length);
    expect(wikidataProfiles.every((profile) => profile.sourceUrl?.startsWith('https://www.wikidata.org/wiki/Q'))).toBe(true);
    expect(wikidataProfiles.every((profile) => profile.office1942.includes('정밀조사 필요'))).toBe(true);
    expect(wikidataProfiles.every((profile) => profile.expertise[0] !== '공공 기록 인물')).toBe(true);
    expect(new Set(wikidataProfiles.map((profile) => profile.discipline)).size).toBeGreaterThanOrEqual(8);
  });

  it('covers the full civilian talent-market discipline range', () => {
    const represented = new Set(historicalExperts.map((profile) => profile.discipline));
    const civilianDisciplines = ['science', 'engineering', 'medicine', 'economics', 'industry', 'intelligence', 'diplomacy', 'social-science'] as const;
    civilianDisciplines.forEach((discipline) => expect(represented.has(discipline), discipline).toBe(true));
  });

  it('adds eight deeply modeled 1940s figures for every playable nation', () => {
    expect(wartimeHistoricalExperts).toHaveLength(104);
    expect(new Set(wartimeHistoricalExperts.map((profile) => profile.id)).size).toBe(104);
    expect(new Set(wartimeHistoricalExperts.map((profile) => profile.name)).size).toBe(104);
    nations.forEach((nation) => {
      expect(wartimeHistoricalExpertCoverage[nation.id], nation.id).toBe(8);
      const profiles = wartimeHistoricalExperts.filter((profile) => profile.primaryNation === nation.id);
      expect(profiles).toHaveLength(8);
      profiles.forEach((profile) => {
        expect(profile.office1942.length).toBeGreaterThan(7);
        expect(profile.office1942).not.toContain('정밀조사 필요');
        expect(profile.historicalConstraint.length).toBeGreaterThan(35);
        expect(profile.sourceUrl).toMatch(/^https:\/\//);
        expect(historicalExperts.some((entry) => entry.id === profile.id), profile.id).toBe(true);
      });
    });
  });

  it('does not misrepresent Einstein as a Manhattan Project weapons scientist', () => {
    const einstein = historicalExperts.find((profile) => profile.id === 'us-albert-einstein');
    expect(einstein).toBeDefined();
    expect(einstein?.office1942).toContain('고등연구소');
    expect(einstein?.historicalConstraint).toContain('맨해튼 계획의 구성원이 아니었고');
    expect(einstein?.appointmentEffect).toContain('기초연구');
    expect(einstein?.appointmentEffect).not.toContain('핵무기');
  });
});
