import type { PersonnelDiscipline, StaffCandidate, StaffDepartment, StaffMember } from './types';
import { calculateStaffSuitability, getStaffSeatDefinition, staffSeatDefinitions } from './staffOrganization';

export type StaffCareerStage = 'developing' | 'emerging' | 'peak' | 'experienced';
export type StaffHierarchy = 'leader' | 'core' | 'support';
export type StaffContractRisk = 'secure' | 'review' | 'urgent' | 'expired';
export type RecruitmentPriority = 'top' | 'standard' | 'monitor';

export interface CandidateSeatFit {
  candidate: StaffCandidate;
  score: number;
  label: '최적' | '적합' | '검토' | '부적합';
  uncertainty: number;
}

export interface StaffDynamicRecord {
  member: StaffMember;
  morale: number;
  roleSatisfaction: number;
  buyIn: number;
  hierarchy: StaffHierarchy;
  careerStage: StaffCareerStage;
  contractWeeks: number;
  contractRisk: StaffContractRisk;
}

export interface StaffSeatPlan {
  department: StaffDepartment;
  incumbent: StaffMember | null;
  incumbentFit: number;
  internalDepth: Array<{ member: StaffMember; score: number }>;
  externalDepth: CandidateSeatFit[];
  depthScore: number;
  needScore: number;
  priority: RecruitmentPriority;
  warning: string;
  manageable: boolean;
}

export interface StaffManagementOverview {
  seats: StaffSeatPlan[];
  dynamics: StaffDynamicRecord[];
  atmosphere: number;
  leadershipSupport: number;
  roleCoverage: number;
  expiringContracts: number;
  overloadedStaff: number;
  topNeed: StaffSeatPlan | null;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function stableNumber(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash;
}

export function getDefaultStaffContractWeeks(member: StaffMember) {
  return 18 + stableNumber(member.personId || member.id) % 139;
}

export function getStaffContractWeeks(member: StaffMember) {
  return Math.max(0, member.contractWeeksRemaining ?? getDefaultStaffContractWeeks(member));
}

export function getStaffContractRisk(member: StaffMember): StaffContractRisk {
  const weeks = getStaffContractWeeks(member);
  if (weeks <= 0) return 'expired';
  if (weeks <= 13) return 'urgent';
  if (weeks <= 52) return 'review';
  return 'secure';
}

export function getStaffCareerStage(member: StaffMember): StaffCareerStage {
  const growth = member.potential - member.ability;
  if (growth >= 18 || (member.grade === 1 && member.ability < 68)) return 'developing';
  if (growth >= 8 || member.grade === 1) return 'emerging';
  if (member.grade === 3 || growth <= 3) return 'experienced';
  return 'peak';
}

export function getStaffHierarchy(member: StaffMember): StaffHierarchy {
  const score = member.influence * 0.48 + member.ability * 0.34 + member.grade * 6;
  if (score >= 82) return 'leader';
  if (score >= 65) return 'core';
  return 'support';
}

export function getStaffMorale(member: StaffMember) {
  if (typeof member.morale === 'number') return clamp(Math.round(member.morale));
  return clamp(Math.round(42 + member.loyalty * 0.42 + (member.delegated ? 5 : 0) - Math.max(0, member.workload - 65) * 0.45));
}

export function getStaffRoleSatisfaction(member: StaffMember) {
  if (typeof member.roleSatisfaction === 'number') return clamp(Math.round(member.roleSatisfaction));
  const fit = calculateStaffSuitability(member, member.department).score;
  const promisedFit = !member.promisedDepartment || member.promisedDepartment === member.department ? 6 : -18;
  const statusFit = member.squadStatus === 'key' && !member.delegated ? -8 : member.delegated ? 6 : 0;
  return clamp(Math.round(fit * 0.62 + member.loyalty * 0.18 + promisedFit + statusFit - Math.max(0, member.workload - 78) * 0.5));
}

export function getStaffBuyIn(member: StaffMember) {
  return clamp(Math.round(getStaffMorale(member) * 0.34 + getStaffRoleSatisfaction(member) * 0.34 + member.loyalty * 0.24 + (member.delegated ? 8 : 2)));
}

function disciplineFit(discipline: PersonnelDiscipline | undefined, department: StaffDepartment) {
  if (!discipline) return 0;
  return getStaffSeatDefinition(department).preferredDisciplines.includes(discipline) ? 12 : 0;
}

export function calculateCandidateSeatFit(candidate: StaffCandidate, department: StaffDepartment): CandidateSeatFit {
  const uncertainty = Math.max(0, Math.round((65 - candidate.knowledge) * 0.18));
  const matchingDiscipline = disciplineFit(candidate.discipline, department);
  const raw = candidate.ability * 0.52
    + candidate.influence * 0.16
    + candidate.loyalty * 0.11
    + matchingDiscipline
    + (candidate.department === department ? 6 : -8)
    - (candidate.discipline && !matchingDiscipline ? 5 : 0)
    - uncertainty;
  const score = clamp(Math.round(raw), 20, 99);
  const label: CandidateSeatFit['label'] = score >= 82 ? '최적' : score >= 68 ? '적합' : score >= 55 ? '검토' : '부적합';
  return { candidate, score, label, uncertainty };
}

function seatWarning(fit: number, internalDepth: StaffSeatPlan['internalDepth'], contractRisk: StaffContractRisk | null, workload: number) {
  if (contractRisk === 'expired') return '계약이 만료되어 즉시 재계약 또는 후임 임명이 필요합니다.';
  if (fit < 55) return '현 보직자의 적합도가 낮아 운영 손실 위험이 큽니다.';
  if (workload >= 85) return '업무 과부하가 사기와 충성도를 훼손하고 있습니다.';
  if (contractRisk === 'urgent') return '13주 안에 계약이 끝납니다. 승계안을 확정하십시오.';
  if ((internalDepth[1]?.score ?? 0) < 60) return '내부 대체자가 부족합니다. 외부 후보 조사를 시작하십시오.';
  if (contractRisk === 'review') return '이번 시즌 안에 계약 검토가 필요합니다.';
  return '현 보직과 승계선이 안정적입니다.';
}

export function createStaffManagementOverview(
  staff: readonly StaffMember[],
  candidates: readonly StaffCandidate[],
  managedDepartments: readonly StaffDepartment[],
): StaffManagementOverview {
  const manageable = new Set(managedDepartments);
  const dynamics = staff.map((member): StaffDynamicRecord => ({
    member,
    morale: getStaffMorale(member),
    roleSatisfaction: getStaffRoleSatisfaction(member),
    buyIn: getStaffBuyIn(member),
    hierarchy: getStaffHierarchy(member),
    careerStage: getStaffCareerStage(member),
    contractWeeks: getStaffContractWeeks(member),
    contractRisk: getStaffContractRisk(member),
  }));
  const seats = staffSeatDefinitions.map((seat): StaffSeatPlan => {
    const incumbent = staff.find((member) => member.department === seat.department) ?? null;
    const incumbentFit = incumbent ? calculateStaffSuitability(incumbent, seat.department).score : 0;
    const internalDepth = staff
      .map((member) => ({ member, score: calculateStaffSuitability(member, seat.department).score }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
    const externalDepth = candidates
      .filter((candidate) => candidate.status !== 'signed' && candidate.status !== 'lost')
      .map((candidate) => calculateCandidateSeatFit(candidate, seat.department))
      .filter((candidate) => candidate.score >= 55)
      .sort((left, right) => right.score - left.score || right.candidate.knowledge - left.candidate.knowledge)
      .slice(0, 3);
    const contractRisk = incumbent ? getStaffContractRisk(incumbent) : null;
    const succession = internalDepth.find((entry) => entry.member.id !== incumbent?.id)?.score ?? 0;
    const contractPenalty = contractRisk === 'expired' ? 24 : contractRisk === 'urgent' ? 15 : contractRisk === 'review' ? 7 : 0;
    const workloadPenalty = Math.max(0, (incumbent?.workload ?? 100) - 72) * 0.35;
    const depthScore = clamp(Math.round(incumbentFit * 0.62 + succession * 0.25 + (externalDepth[0]?.score ?? 0) * 0.13 - contractPenalty - workloadPenalty));
    const needScore = 100 - depthScore;
    const priority: RecruitmentPriority = needScore >= 48 ? 'top' : needScore >= 30 ? 'standard' : 'monitor';
    return {
      department: seat.department,
      incumbent,
      incumbentFit,
      internalDepth,
      externalDepth,
      depthScore,
      needScore,
      priority,
      warning: seatWarning(incumbentFit, internalDepth, contractRisk, incumbent?.workload ?? 100),
      manageable: manageable.has(seat.department),
    };
  });
  const managedSeats = seats.filter((seat) => seat.manageable);
  const managedDynamics = dynamics.filter((record) => manageable.has(record.member.department));
  const average = (values: number[]) => values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;
  return {
    seats,
    dynamics,
    atmosphere: average(managedDynamics.map((record) => record.morale)),
    leadershipSupport: average(managedDynamics.filter((record) => record.hierarchy !== 'support').map((record) => record.buyIn)),
    roleCoverage: average(managedSeats.map((seat) => seat.depthScore)),
    expiringContracts: managedDynamics.filter((record) => record.contractRisk === 'urgent' || record.contractRisk === 'expired').length,
    overloadedStaff: managedDynamics.filter((record) => record.member.workload >= 80).length,
    topNeed: [...managedSeats].sort((left, right) => right.needScore - left.needScore)[0] ?? null,
  };
}

export function advanceStaffMemberWeek(member: StaffMember, developmentFocus: boolean): StaffMember {
  const nextWorkload = clamp(member.workload + (member.delegated ? 3 : -2), 8, 100);
  const contractWeeksRemaining = Math.max(0, getStaffContractWeeks(member) - 1);
  const workloadMorale = nextWorkload >= 88 ? -4 : nextWorkload >= 78 ? -2 : nextWorkload <= 45 ? 1 : 0;
  const contractMorale = contractWeeksRemaining === 0 ? -5 : contractWeeksRemaining <= 13 ? -2 : 0;
  const nextMorale = clamp(getStaffMorale(member) + workloadMorale + contractMorale + (member.delegated && nextWorkload < 80 ? 1 : 0));
  const promisePenalty = member.promisedDepartment && member.promisedDepartment !== member.department ? 3 : 0;
  const nextSatisfaction = clamp(getStaffRoleSatisfaction(member) + (member.delegated ? 1 : 0) - promisePenalty - (nextWorkload >= 88 ? 3 : 0));
  return {
    ...member,
    workload: nextWorkload,
    loyalty: clamp(member.loyalty - (nextMorale < 35 ? 2 : member.delegated && member.workload >= 85 ? 1 : 0), 20, 100),
    development: clamp(member.development + (member.delegated ? 6 : 3) + (developmentFocus ? 7 : 0) - (member.workload >= 85 ? 2 : 0)),
    morale: nextMorale,
    roleSatisfaction: nextSatisfaction,
    contractWeeksRemaining,
    delegated: contractWeeksRemaining === 0 ? false : member.delegated,
  };
}

export function getStaffRenewalCost(member: StaffMember) {
  return Math.max(24, Math.ceil(member.weeklyCost * (8 + member.grade * 2) + member.influence * 0.35));
}
