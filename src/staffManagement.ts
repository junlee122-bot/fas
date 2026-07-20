import type { PersonnelDiscipline, StaffCandidate, StaffDepartment, StaffMember } from './types';
import { calculateStaffSuitability, getStaffSeatDefinition, staffSeatDefinitions } from './staffOrganization';

export type StaffCareerStage = 'developing' | 'emerging' | 'peak' | 'experienced';
export type StaffHierarchy = 'leader' | 'core' | 'support';
export type StaffContractRisk = 'secure' | 'review' | 'urgent' | 'expired';
export type RecruitmentPriority = 'top' | 'standard' | 'monitor';
export type StaffPromiseState = 'none' | 'kept' | 'at-risk' | 'broken';
export type StaffMeetingTopic = 'wellbeing' | 'workload' | 'career' | 'standards';

export interface StaffMeetingOption {
  id: StaffMeetingTopic;
  label: string;
  cost: number;
  summary: string;
  forecast: string;
  risk: 'safe' | 'balanced' | 'demanding';
}

export interface StaffMeetingResolution {
  member: StaffMember;
  title: string;
  summary: string;
  tone: 'good' | 'bad' | 'neutral';
  success: boolean;
}

export interface StaffPromiseAssessment {
  state: StaffPromiseState;
  label: string;
  summary: string;
}

export type StaffRelationshipKind = 'trusted' | 'allied' | 'professional' | 'tension' | 'rivalry';

export interface StaffRelationship {
  id: string;
  first: StaffMember;
  second: StaffMember;
  affinity: number;
  kind: StaffRelationshipKind;
  label: string;
  reason: string;
}

export interface StaffInfluenceBloc {
  id: 'command' | 'administration' | 'state';
  label: string;
  members: StaffMember[];
  cohesion: number;
  influence: number;
  status: 'united' | 'stable' | 'divided';
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
  teamCohesion: number;
  activeTensions: number;
  relationships: StaffRelationship[];
  influenceBlocs: StaffInfluenceBloc[];
  topNeed: StaffSeatPlan | null;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const staffMeetingOptions: readonly StaffMeetingOption[] = [
  {
    id: 'wellbeing',
    label: '안부와 신뢰 회복',
    cost: 3,
    summary: '개인의 불안과 조직 내 관계를 듣고 지도부가 직접 신뢰를 확인합니다.',
    forecast: '사기 +9 · 충성 +4 · 역할 만족 +2 · 업무량 -3',
    risk: 'safe',
  },
  {
    id: 'workload',
    label: '업무와 결재선 재조정',
    cost: 3,
    summary: '중복 보고와 실무 부담을 정리해 현재 보직에 집중시킵니다.',
    forecast: '업무량 -18 · 사기 +4 · 역할 만족 +4',
    risk: 'safe',
  },
  {
    id: 'career',
    label: '경력·육성 계획 합의',
    cost: 5,
    summary: '다음 보직과 성장 과제를 명확히 제시하는 대신 추가 책임을 부여합니다.',
    forecast: '역할 만족 +10 · 육성 +8 · 사기 +2 · 업무량 +5',
    risk: 'balanced',
  },
  {
    id: 'standards',
    label: '성과 기준 상향 요구',
    cost: 2,
    summary: '지도부 지지를 바탕으로 더 높은 성과를 요구합니다. 신뢰가 낮으면 역효과가 납니다.',
    forecast: '수용 시 육성 +12 · 거부 시 사기 -7, 역할 만족 -8',
    risk: 'demanding',
  },
] as const;

export function getStaffMeetingOption(topic: StaffMeetingTopic) {
  return staffMeetingOptions.find((option) => option.id === topic) ?? staffMeetingOptions[0];
}

function stableNumber(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash;
}

const relationshipLabels: Record<StaffRelationshipKind, string> = {
  trusted: '강한 신뢰',
  allied: '협력 관계',
  professional: '업무 관계',
  tension: '긴장 관계',
  rivalry: '경쟁·대립',
};

function relationshipReason(first: StaffMember, second: StaffMember, affinity: number) {
  if (first.affiliation === second.affiliation) return `${first.affiliation} 인맥과 조직 경험을 공유합니다.`;
  if (first.discipline && first.discipline === second.discipline) return `같은 ${first.discipline} 전문 영역에서 판단 기준을 공유합니다.`;
  if (getStaffSeatDefinition(first.department).group === getStaffSeatDefinition(second.department).group) return '같은 책임 블록에서 결재와 성과를 함께 부담합니다.';
  if (first.influence >= 75 && second.influence >= 75) return '두 핵심 인사의 영향권과 승계 이해가 충돌합니다.';
  if (Math.abs(first.workload - second.workload) >= 30) return '업무 부담의 격차가 협업에 대한 불만을 키웁니다.';
  return affinity < 44 ? '전문 분야와 조직 기반이 달라 주요 현안에서 자주 충돌합니다.' : '직접적인 동맹이나 갈등 없이 실무 중심으로 협력합니다.';
}

export function createStaffRelationships(staff: readonly StaffMember[]): StaffRelationship[] {
  const relationships: StaffRelationship[] = [];
  for (let firstIndex = 0; firstIndex < staff.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < staff.length; secondIndex += 1) {
      const first = staff[firstIndex];
      const second = staff[secondIndex];
      const sameAffiliation = first.affiliation === second.affiliation ? 16 : 0;
      const sameDiscipline = first.discipline && first.discipline === second.discipline ? 10 : 0;
      const sameGroup = getStaffSeatDefinition(first.department).group === getStaffSeatDefinition(second.department).group ? 8 : 0;
      const sharedResponsibility = first.delegated && second.delegated ? 4 : 0;
      const influenceCompetition = first.influence >= 75 && second.influence >= 75 ? 8 : 0;
      const workloadFriction = Math.abs(first.workload - second.workload) >= 30 ? 5 : 0;
      const personalChemistry = stableNumber([first.personId, second.personId].sort().join(':')) % 17 - 8;
      const affinity = clamp(50 + sameAffiliation + sameDiscipline + sameGroup + sharedResponsibility + personalChemistry - influenceCompetition - workloadFriction, 15, 92);
      const kind: StaffRelationshipKind = affinity >= 76 ? 'trusted' : affinity >= 62 ? 'allied' : affinity >= 44 ? 'professional' : affinity >= 30 ? 'tension' : 'rivalry';
      relationships.push({
        id: [first.id, second.id].sort().join(':'),
        first,
        second,
        affinity,
        kind,
        label: relationshipLabels[kind],
        reason: relationshipReason(first, second, affinity),
      });
    }
  }
  return relationships.sort((left, right) => left.affinity - right.affinity || left.id.localeCompare(right.id));
}

export function createStaffInfluenceBlocs(staff: readonly StaffMember[], relationships = createStaffRelationships(staff)): StaffInfluenceBloc[] {
  const definitions: Array<Pick<StaffInfluenceBloc, 'id' | 'label'>> = [
    { id: 'command', label: '작전·군수 블록' },
    { id: 'administration', label: '인사·정무 블록' },
    { id: 'state', label: '과학·경제 블록' },
  ];
  return definitions.map((definition) => {
    const members = staff.filter((member) => getStaffSeatDefinition(member.department).group === definition.id);
    const memberIds = new Set(members.map((member) => member.id));
    const internalRelationships = relationships.filter((relationship) => memberIds.has(relationship.first.id) && memberIds.has(relationship.second.id));
    const cohesion = internalRelationships.length
      ? Math.round(internalRelationships.reduce((total, relationship) => total + relationship.affinity, 0) / internalRelationships.length)
      : members[0] ? getStaffBuyIn(members[0]) : 0;
    const influence = members.length ? Math.round(members.reduce((total, member) => total + member.influence, 0) / members.length) : 0;
    const status: StaffInfluenceBloc['status'] = cohesion >= 68 ? 'united' : cohesion >= 46 ? 'stable' : 'divided';
    const summary = status === 'united'
      ? '공동 의제가 분명해 결재와 정책 집행이 빠릅니다.'
      : status === 'stable'
        ? '실무 협력은 유지되지만 위기 시 입장이 갈릴 수 있습니다.'
        : '내부 대립이 사기와 정책 집행을 매주 훼손할 위험이 큽니다.';
    return { ...definition, members, cohesion, influence, status, summary };
  });
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

export function resolveStaffMeeting(member: StaffMember, topic: StaffMeetingTopic, week: number, developmentFocus = false): StaffMeetingResolution {
  const option = getStaffMeetingOption(topic);
  const morale = getStaffMorale(member);
  const satisfaction = getStaffRoleSatisfaction(member);
  const common = { ...member, lastMeetingWeek: week };

  if (topic === 'wellbeing') {
    return {
      member: {
        ...common,
        morale: clamp(morale + 9),
        loyalty: clamp(member.loyalty + 4),
        roleSatisfaction: clamp(satisfaction + 2),
        workload: clamp(member.workload - 3, 5),
      },
      title: `참모 면담 — ${member.name}`,
      summary: `${option.label}을 진행했습니다. 개인의 우려를 확인해 사기와 충성도가 회복됐습니다.`,
      tone: 'good',
      success: true,
    };
  }

  if (topic === 'workload') {
    return {
      member: {
        ...common,
        morale: clamp(morale + 4),
        roleSatisfaction: clamp(satisfaction + 4),
        workload: clamp(member.workload - 18, 5),
      },
      title: `업무 재조정 — ${member.name}`,
      summary: `${option.label}을 마쳤습니다. 중복 보고와 실무 부담을 줄여 현재 보직에 집중할 여유를 만들었습니다.`,
      tone: 'good',
      success: true,
    };
  }

  if (topic === 'career') {
    const growthBonus = member.squadStatus === 'development' || member.potential - member.ability >= 8 ? 3 : 0;
    return {
      member: {
        ...common,
        morale: clamp(morale + 2),
        loyalty: clamp(member.loyalty + 2),
        roleSatisfaction: clamp(satisfaction + 10 + growthBonus),
        development: clamp(member.development + 8),
        workload: clamp(member.workload + 5, 5),
      },
      title: `경력 계획 합의 — ${member.name}`,
      summary: `${option.label}을 합의했습니다. 성장 경로가 선명해진 대신 새 과제로 업무 부담이 조금 늘었습니다.`,
      tone: 'good',
      success: true,
    };
  }

  const buyIn = getStaffBuyIn(member, developmentFocus);
  const success = buyIn >= 58;
  if (success) {
    return {
      member: {
        ...common,
        loyalty: clamp(member.loyalty + 2),
        roleSatisfaction: clamp(satisfaction + 2),
        development: clamp(member.development + 12),
        workload: clamp(member.workload + 8, 5),
      },
      title: `성과 기준 수용 — ${member.name}`,
      summary: `지도부 수용도 ${buyIn}을 바탕으로 더 높은 성과 기준을 받아들였습니다. 성장 속도와 업무 부담이 함께 상승합니다.`,
      tone: 'good',
      success: true,
    };
  }
  return {
    member: {
      ...common,
      morale: clamp(morale - 7),
      loyalty: clamp(member.loyalty - 3),
      roleSatisfaction: clamp(satisfaction - 8),
    },
    title: `성과 면담 결렬 — ${member.name}`,
    summary: `지도부 수용도 ${buyIn} 상태에서 일방적으로 성과를 압박했습니다. 신뢰와 역할 만족도가 하락했습니다.`,
    tone: 'bad',
    success: false,
  };
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
  const managedStaff = staff.filter((member) => manageable.has(member.department));
  const relationships = createStaffRelationships(managedStaff);
  const influenceBlocs = createStaffInfluenceBlocs(managedStaff, relationships);
  const average = (values: number[]) => values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;
  const teamCohesion = relationships.length ? average(relationships.map((relationship) => relationship.affinity)) : managedDynamics[0]?.buyIn ?? 0;
  return {
    seats,
    dynamics,
    atmosphere: average(managedDynamics.map((record) => record.morale)),
    leadershipSupport: average(managedDynamics.filter((record) => record.hierarchy !== 'support').map((record) => record.buyIn)),
    roleCoverage: average(managedSeats.map((seat) => seat.depthScore)),
    expiringContracts: managedDynamics.filter((record) => record.contractRisk === 'urgent' || record.contractRisk === 'expired').length,
    overloadedStaff: managedDynamics.filter((record) => record.member.workload >= 80).length,
    brokenPromises: managedDynamics.filter((record) => record.promise.state === 'broken').length,
    teamCohesion,
    activeTensions: relationships.filter((relationship) => relationship.kind === 'tension' || relationship.kind === 'rivalry').length,
    relationships,
    influenceBlocs,
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

export function advanceStaffRosterWeek(staff: readonly StaffMember[], developmentFocusId?: string | null): StaffMember[] {
  const relationships = createStaffRelationships(staff);
  return staff.map((member) => {
    const base = advanceStaffMemberWeek(member, member.id === developmentFocusId);
    const colleagueRelationships = relationships.filter((relationship) => relationship.first.id === member.id || relationship.second.id === member.id);
    if (!colleagueRelationships.length) return base;
    const cohesion = Math.round(colleagueRelationships.reduce((total, relationship) => total + relationship.affinity, 0) / colleagueRelationships.length);
    if (cohesion >= 65) return {
      ...base,
      morale: clamp(getStaffMorale(base) + 1),
      roleSatisfaction: clamp(getStaffRoleSatisfaction(base) + 1),
    };
    if (cohesion <= 40) return {
      ...base,
      morale: clamp(getStaffMorale(base) - 2),
      roleSatisfaction: clamp(getStaffRoleSatisfaction(base) - 2),
      loyalty: clamp(base.loyalty - 1, 20),
    };
    return base;
  });
}

export function getStaffRenewalCost(member: StaffMember) {
  return Math.max(24, Math.ceil(member.weeklyCost * (8 + member.grade * 2) + member.influence * 0.35));
}
