import type { PersonnelDiscipline, StaffCandidate, StaffDepartment, StaffMember } from './types';
import { calculateStaffSuitability, getStaffSeatDefinition, staffSeatDefinitions } from './staffOrganization';

export type StaffCareerStage = 'developing' | 'emerging' | 'peak' | 'experienced';
export type StaffHierarchy = 'leader' | 'core' | 'support';
export type StaffContractRisk = 'secure' | 'review' | 'urgent' | 'expired';
export type RecruitmentPriority = 'top' | 'standard' | 'monitor';
export type StaffPromiseState = 'none' | 'kept' | 'at-risk' | 'broken';

export interface StaffPromiseAssessment {
  state: StaffPromiseState;
  label: string;
  summary: string;
}

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
  promise: StaffPromiseAssessment;
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
  brokenPromises: number;
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

export function assessStaffPromise(member: StaffMember, developmentFocus = false): StaffPromiseAssessment {
  const hasAppointmentTerms = Boolean(member.appointmentAuthority || (member.appointmentPromise && member.appointmentPromise !== 'none') || member.promisedDepartment);
  if (!hasAppointmentTerms) return { state: 'none', label: '기존 임명', summary: '별도로 기록된 임명 약속이 없습니다.' };

  const broken: string[] = [];
  const risks: string[] = [];
  if (member.promisedDepartment && member.promisedDepartment !== member.department) broken.push('약속한 보직과 현재 배치가 다름');
  if (member.appointmentAuthority === 'autonomous' && !member.delegated) broken.push('독립 책임 권한을 회수함');
  if (member.appointmentAuthority === 'executive' && !member.delegated) risks.push('집행 책임이 직접 결재로 묶임');
  if (member.appointmentPromise === 'resources' && !developmentFocus) risks.push('우선 육성·자원 지원 대상이 아님');
  if (member.appointmentPromise === 'succession' && member.squadStatus !== 'key') broken.push('지도부 승계선에서 제외됨');
  if (member.appointmentPromise === 'security') {
    if (getStaffMorale(member) < 45 || member.loyalty < 45) broken.push('신변·정치적 안전 신뢰가 붕괴함');
    else if (getStaffContractWeeks(member) <= 52) risks.push('안전 보장에 비해 계약 안정성이 낮음');
  }
  if (broken.length) return { state: 'broken', label: '약속 위반', summary: broken.join(' · ') };
  if (risks.length) return { state: 'at-risk', label: '이행 위험', summary: risks.join(' · ') };
  return { state: 'kept', label: '약속 이행', summary: '합의한 보직·권한·지원 조건이 현재 상태와 일치합니다.' };
}

export function getStaffBuyIn(member: StaffMember, developmentFocus = false) {
  const promise = assessStaffPromise(member, developmentFocus);
  const promiseModifier = promise.state === 'broken' ? -10 : promise.state === 'at-risk' ? -4 : promise.state === 'kept' ? 3 : 0;
  return clamp(Math.round(getStaffMorale(member) * 0.34 + getStaffRoleSatisfaction(member) * 0.34 + member.loyalty * 0.24 + (member.delegated ? 8 : 2) + promiseModifier));
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

function seatWarning(fit: number, internalDepth: StaffSeatPlan['internalDepth'], contractRisk: StaffContractRisk | null, workload: number, promiseState: StaffPromiseState) {
  if (contractRisk === 'expired') return '계약이 만료되어 즉시 재계약 또는 후임 임명이 필요합니다.';
  if (promiseState === 'broken') return '임명 협상에서 한 약속이 깨져 이탈·불복 위험이 높습니다.';
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
  developmentFocusId?: string | null,
): StaffManagementOverview {
  const manageable = new Set(managedDepartments);
  const dynamics = staff.map((member): StaffDynamicRecord => {
    const developmentFocus = member.id === developmentFocusId;
    return {
      member,
      morale: getStaffMorale(member),
      roleSatisfaction: getStaffRoleSatisfaction(member),
      buyIn: getStaffBuyIn(member, developmentFocus),
      hierarchy: getStaffHierarchy(member),
      careerStage: getStaffCareerStage(member),
      contractWeeks: getStaffContractWeeks(member),
      contractRisk: getStaffContractRisk(member),
      promise: assessStaffPromise(member, developmentFocus),
    };
  });
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
    const promiseState = incumbent ? assessStaffPromise(incumbent, incumbent.id === developmentFocusId).state : 'none';
    const succession = internalDepth.find((entry) => entry.member.id !== incumbent?.id)?.score ?? 0;
    const contractPenalty = contractRisk === 'expired' ? 24 : contractRisk === 'urgent' ? 15 : contractRisk === 'review' ? 7 : 0;
    const workloadPenalty = Math.max(0, (incumbent?.workload ?? 100) - 72) * 0.35;
    const promisePenalty = promiseState === 'broken' ? 10 : promiseState === 'at-risk' ? 4 : 0;
    const depthScore = clamp(Math.round(incumbentFit * 0.62 + succession * 0.25 + (externalDepth[0]?.score ?? 0) * 0.13 - contractPenalty - workloadPenalty - promisePenalty));
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
      warning: seatWarning(incumbentFit, internalDepth, contractRisk, incumbent?.workload ?? 100, promiseState),
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
    brokenPromises: managedDynamics.filter((record) => record.promise.state === 'broken').length,
    topNeed: [...managedSeats].sort((left, right) => right.needScore - left.needScore)[0] ?? null,
  };
}

export function advanceStaffMemberWeek(member: StaffMember, developmentFocus: boolean): StaffMember {
  const nextWorkload = clamp(member.workload + (member.delegated ? 3 : -2), 8, 100);
  const contractWeeksRemaining = Math.max(0, getStaffContractWeeks(member) - 1);
  const workloadMorale = nextWorkload >= 88 ? -4 : nextWorkload >= 78 ? -2 : nextWorkload <= 45 ? 1 : 0;
  const contractMorale = contractWeeksRemaining === 0 ? -5 : contractWeeksRemaining <= 13 ? -2 : 0;
  const nextMorale = clamp(getStaffMorale(member) + workloadMorale + contractMorale + (member.delegated && nextWorkload < 80 ? 1 : 0));
  const promise = assessStaffPromise(member, developmentFocus);
  const promiseSatisfaction = promise.state === 'broken' ? -4 : promise.state === 'at-risk' ? -2 : promise.state === 'kept' ? 1 : 0;
  const promiseMorale = promise.state === 'broken' ? -2 : promise.state === 'kept' ? 1 : 0;
  const nextSatisfaction = clamp(getStaffRoleSatisfaction(member) + (member.delegated ? 1 : 0) + promiseSatisfaction - (nextWorkload >= 88 ? 3 : 0));
  const finalMorale = clamp(nextMorale + promiseMorale);
  return {
    ...member,
    workload: nextWorkload,
    loyalty: clamp(member.loyalty - (finalMorale < 35 ? 2 : member.delegated && member.workload >= 85 ? 1 : 0) - (promise.state === 'broken' ? 1 : 0), 20, 100),
    development: clamp(member.development + (member.delegated ? 6 : 3) + (developmentFocus ? 7 : 0) - (member.workload >= 85 ? 2 : 0)),
    morale: finalMorale,
    roleSatisfaction: nextSatisfaction,
    contractWeeksRemaining,
    delegated: contractWeeksRemaining === 0 ? false : member.delegated,
  };
}

export function getStaffRenewalCost(member: StaffMember) {
  return Math.max(24, Math.ceil(member.weeklyCost * (8 + member.grade * 2) + member.influence * 0.35));
}
