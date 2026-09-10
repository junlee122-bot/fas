import { describe, expect, it } from 'vitest';
import {
  assessRecruitmentOffer,
  defaultRecruitmentOffer,
  isRecruitmentOfferSuccess,
  isRecruitmentSuccess,
  isCandidateShortlisted,
  recruitmentChance,
  recruitmentScore,
  sortTalentCandidates,
  weeklyRivalInterest,
} from './recruitment';
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

  it('turns authority, term, pay and promises into a transparent negotiated offer', () => {
    const cautious = assessRecruitmentOffer(candidate, 50, {
      authority: 'advisor', termWeeks: 52, salaryMultiplier: 0.9, signingMultiplier: 0.9, promise: 'none',
    });
    const ambitious = assessRecruitmentOffer(candidate, 50, {
      authority: 'autonomous', termWeeks: 156, salaryMultiplier: 1.15, signingMultiplier: 1.15, promise: 'succession',
    });
    expect(ambitious.score).toBeGreaterThan(cautious.score);
    expect(ambitious.weeklyCost).toBeGreaterThan(cautious.weeklyCost);
    expect(ambitious.signingCost).toBeGreaterThan(cautious.signingCost);
    expect(ambitious.factors).toHaveLength(6);
  });

  it('keeps the old success threshold compatible with a standard two-year offer', () => {
    const ready = { ...candidate, interest: 92, relationship: 70, rivalInterest: 5 };
    expect(isRecruitmentSuccess(ready, 70)).toBe(true);
    expect(isRecruitmentOfferSuccess(ready, 70, defaultRecruitmentOffer)).toBe(true);
  });

  it('preserves legacy interest lists while allowing independent live investigations', () => {
    expect(isCandidateShortlisted({ ...candidate, status: 'shortlisted' })).toBe(true);
    expect(isCandidateShortlisted({ ...candidate, status: 'scouting', shortlisted: true })).toBe(true);
    expect(isCandidateShortlisted({ ...candidate, status: 'shortlisted', shortlisted: false })).toBe(false);
  });

  it('applies shortlist persuasion and rival shielding while investigations continue', () => {
    const active = { ...candidate, status: 'scouting' as const, shortlisted: false };
    const tracked = { ...active, shortlisted: true };
    expect(recruitmentScore(tracked, 50) - recruitmentScore(active, 50)).toBe(6);
    expect(weeklyRivalInterest(active) - weeklyRivalInterest(tracked)).toBe(2);
    expect(assessRecruitmentOffer(tracked, 50).score - assessRecruitmentOffer(active, 50).score).toBe(6);
  });

  it('recommended sorting recognizes independent shortlist membership without changing stored order', () => {
    const plain = { ...candidate, id: 'a', name: '가', status: 'scouting' as const, shortlisted: false };
    const tracked = { ...plain, id: 'b', name: '나', shortlisted: true };
    const input = [plain, tracked];
    expect(sortTalentCandidates(input, 'recommended', 50)[0].id).toBe('b');
    expect(input.map((person) => person.id)).toEqual(['a', 'b']);
  });
});
