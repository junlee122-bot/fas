import type { StaffCandidate } from './types';

export type TalentMarketSort = 'recommended' | 'chance' | 'ability' | 'potential' | 'influence' | 'age' | 'name';

const availabilityPenalty: Record<StaffCandidate['availability'], number> = {
  available: 0,
  poachable: 5,
  displaced: 9,
  opposition: 18,
};

export function recruitmentScore(candidate: StaffCandidate, reputation: number) {
  return Math.round(
    candidate.interest
    + candidate.relationship * 0.35
    + reputation * 0.2
    + (candidate.status === 'shortlisted' ? 6 : 0)
    - candidate.rivalInterest * 0.25
    - availabilityPenalty[candidate.availability],
  );
}

export function recruitmentChance(candidate: StaffCandidate, reputation: number) {
  return Math.max(5, Math.min(95, 50 + (recruitmentScore(candidate, reputation) - 72) * 3));
}

export function weeklyRivalInterest(candidate: StaffCandidate) {
  if (candidate.status === 'signed' || candidate.status === 'lost') return candidate.rivalInterest;
  const shortlistShield = candidate.status === 'shortlisted' ? 2 : 0;
  const relationshipShield = candidate.relationship >= 55 ? 2 : candidate.relationship >= 30 ? 1 : 0;
  const marketPressure = Math.max(2, Math.round(candidate.influence / 24));
  return Math.max(0, Math.min(100, candidate.rivalInterest + marketPressure - shortlistShield - relationshipShield));
}

export function isRecruitmentSuccess(candidate: StaffCandidate, reputation: number) {
  return recruitmentScore(candidate, reputation) >= 72;
}

function knownValue(candidate: StaffCandidate, field: 'ability' | 'potential' | 'influence') {
  const threshold = field === 'potential' ? 85 : field === 'ability' ? 65 : 45;
  return candidate.knowledge >= threshold ? candidate[field] : -1;
}

export function sortTalentCandidates(candidates: readonly StaffCandidate[], sort: TalentMarketSort, reputation: number) {
  const recommended = (candidate: StaffCandidate) => (
    recruitmentChance(candidate, reputation) * 2
    + candidate.knowledge
    + candidate.relationship
    + (candidate.status === 'shortlisted' ? 30 : 0)
    - (candidate.status === 'signed' || candidate.status === 'lost' ? 300 : 0)
  );
  return [...candidates].sort((left, right) => {
    if (sort === 'name') return left.name.localeCompare(right.name, 'ko');
    if (sort === 'age') return (right.birthYear ?? 0) - (left.birthYear ?? 0) || recommended(right) - recommended(left);
    if (sort === 'chance') return recruitmentChance(right, reputation) - recruitmentChance(left, reputation) || recommended(right) - recommended(left);
    if (sort === 'ability' || sort === 'potential' || sort === 'influence') {
      return knownValue(right, sort) - knownValue(left, sort) || recommended(right) - recommended(left);
    }
    return recommended(right) - recommended(left) || left.name.localeCompare(right.name, 'ko');
  });
}
