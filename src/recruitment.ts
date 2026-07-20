import type { StaffCandidate } from './types';

export type TalentMarketSort = 'recommended' | 'chance' | 'ability' | 'potential' | 'influence' | 'age' | 'name';

export type RecruitmentAuthority = 'advisor' | 'executive' | 'autonomous';
export type RecruitmentPromise = 'none' | 'resources' | 'succession' | 'security';
export type RecruitmentTermWeeks = 52 | 104 | 156;
export type RecruitmentMultiplier = 0.9 | 1 | 1.15;

export interface RecruitmentOffer {
  authority: RecruitmentAuthority;
  termWeeks: RecruitmentTermWeeks;
  salaryMultiplier: RecruitmentMultiplier;
  signingMultiplier: RecruitmentMultiplier;
  promise: RecruitmentPromise;
}

export interface RecruitmentOfferAssessment {
  score: number;
  chance: number;
  weeklyCost: number;
  signingCost: number;
  threshold: number;
  factors: Array<{ label: string; points: number }>;
}

export const defaultRecruitmentOffer: RecruitmentOffer = {
  authority: 'executive',
  termWeeks: 104,
  salaryMultiplier: 1,
  signingMultiplier: 1,
  promise: 'none',
};

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

export function assessRecruitmentOffer(
  candidate: StaffCandidate,
  reputation: number,
  offer: RecruitmentOffer = defaultRecruitmentOffer,
): RecruitmentOfferAssessment {
  const baseScore = recruitmentScore(candidate, reputation);
  const authorityPoints = offer.authority === 'autonomous' ? 6 : offer.authority === 'advisor' ? -5 : 0;
  const termPoints = offer.termWeeks === 156 ? 4 : offer.termWeeks === 52 ? -2 : 1;
  const salaryPoints = offer.salaryMultiplier === 1.15 ? 5 : offer.salaryMultiplier === 0.9 ? -5 : 0;
  const signingPoints = offer.signingMultiplier === 1.15 ? 4 : offer.signingMultiplier === 0.9 ? -4 : 0;
  const promisePoints = offer.promise === 'resources'
    ? ['science', 'armaments', 'logistics', 'economy'].includes(candidate.department) ? 4 : 1
    : offer.promise === 'succession'
      ? candidate.potential >= 90 || candidate.influence >= 82 ? 5 : 2
      : offer.promise === 'security'
        ? candidate.availability === 'opposition' || candidate.availability === 'displaced' ? 5 : 1
        : 0;
  const factors = [
    { label: '기존 관계·평판·경쟁', points: baseScore },
    { label: '의사결정 권한', points: authorityPoints },
    { label: '임기 안정성', points: termPoints },
    { label: '주급 조건', points: salaryPoints },
    { label: '계약금 조건', points: signingPoints },
    { label: '보직 약속', points: promisePoints },
  ];
  const score = factors.reduce((total, factor) => total + factor.points, 0);
  const threshold = 72;
  return {
    score,
    chance: Math.max(5, Math.min(95, 50 + (score - threshold) * 3)),
    weeklyCost: Math.max(1, Math.ceil(candidate.weeklyCost * offer.salaryMultiplier)),
    signingCost: Math.max(1, Math.ceil(candidate.signingCost * offer.signingMultiplier)),
    threshold,
    factors,
  };
}

export function isRecruitmentOfferSuccess(candidate: StaffCandidate, reputation: number, offer: RecruitmentOffer) {
  return assessRecruitmentOffer(candidate, reputation, offer).score >= 72;
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
