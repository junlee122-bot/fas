import { describe, expect, it } from 'vitest';
import { isRecruitmentSuccess, recruitmentChance, recruitmentScore, sortTalentCandidates, weeklyRivalInterest } from './recruitment';
import type { StaffCandidate } from './types';

const candidate: StaffCandidate = {
  id: 'candidate', personId: 'person', name: '후보', role: '작전참모장', historicalOffice: '현직', affiliation: '조직', summary: '요약',
  department: 'operations', ability: 88, potential: 94, loyalty: 75, weeklyCost: 8, signingCost: 150, interest: 65, knowledge: 70,
  status: 'unscouted', specialty: '작전', influence: 84, relationship: 20, rivalInterest: 30, availability: 'available', lastApproachWeek: null,
};

describe('historical personnel market', () => {
  it('rewards relationships and shortlists while rival bids reduce leverage', () => {
    const baseline = recruitmentScore(candidate, 50);
    const cultivated = recruitmentScore({ ...candidate, relationship: 70, status: 'shortlisted', rivalInterest: 10 }, 50);
    expect(cultivated).toBeGreaterThan(baseline);
    expect(recruitmentChance({ ...candidate, relationship: 70 }, 50)).toBeGreaterThan(recruitmentChance(candidate, 50));
  });

  it('makes opposition figures harder to recruit', () => {
    expect(recruitmentScore({ ...candidate, availability: 'opposition' }, 50)).toBeLessThan(recruitmentScore(candidate, 50));
  });

  it('lets rival organizations compete each week', () => {
    expect(weeklyRivalInterest(candidate)).toBeGreaterThan(candidate.rivalInterest);
    expect(weeklyRivalInterest({ ...candidate, status: 'shortlisted', relationship: 60 })).toBeLessThan(weeklyRivalInterest(candidate));
  });

  it('uses a transparent score threshold for completed recruitment', () => {
    expect(isRecruitmentSuccess({ ...candidate, interest: 92, relationship: 70, rivalInterest: 5 }, 70)).toBe(true);
    expect(isRecruitmentSuccess({ ...candidate, interest: 20, relationship: 0, rivalInterest: 90 }, 20)).toBe(false);
  });

  it('sorts the market without mutating the saved candidate order', () => {
    const original = [candidate, { ...candidate, id: 'elite', name: '정예 후보', ability: 96, potential: 98, influence: 92 }];
    const sorted = sortTalentCandidates(original, 'ability', 50);
    expect(sorted.map((item) => item.id)).toEqual(['elite', 'candidate']);
    expect(original.map((item) => item.id)).toEqual(['candidate', 'elite']);
  });

  it('does not reveal unscouted ratings through ability sorting', () => {
    const unknownStar = { ...candidate, id: 'unknown', name: '미확인', ability: 99, knowledge: 20 };
    const verified = { ...candidate, id: 'verified', name: '검증됨', ability: 78, knowledge: 70 };
    expect(sortTalentCandidates([unknownStar, verified], 'ability', 50)[0].id).toBe('verified');
  });
});
