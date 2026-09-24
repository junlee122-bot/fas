import type { StaffDecisionInput } from './staffDecisions';
import { getStaffAuthorityProfile, staffSeatDefinitions } from './staffOrganization';
import type { StaffMember, StaffWorkPriority } from './types';

export interface StaffWorkPriorityOption {
  id: StaffWorkPriority;
  label: string;
  summary: string;
  workloadDelta: number;
  developmentDelta: number;
}

/** These are modifiers to the existing weekly workload/development formula, not production bonuses. */
export const staffWorkPriorities: readonly StaffWorkPriorityOption[] = [
  { id: 'urgent', label: '집중 업무', summary: '매주 기본 변화에 업무량 +5 · 육성 +2. 과부하가 누적될 수 있습니다.', workloadDelta: 5, developmentDelta: 2 },
  { id: 'normal', label: '통상 업무', summary: '현재 위임·집중 육성에 따른 기본 주간 변화만 적용합니다.', workloadDelta: 0, developmentDelta: 0 },
  { id: 'recovery', label: '부담 경감', summary: '매주 기본 변화에 업무량 −7 · 육성 −2. 업무량을 낮추는 대신 성장이 느려집니다.', workloadDelta: -7, developmentDelta: -2 },
];

export function getStaffWorkPriority(member: Pick<StaffMember, 'workPriority'>): StaffWorkPriority {
  return member.workPriority === 'urgent' || member.workPriority === 'recovery' ? member.workPriority : 'normal';
}

const clamp = (value: number, minimum = 0) => Math.max(minimum, Math.min(100, value));

export interface StaffWorkWeekProjection {
  priority: StaffWorkPriority;
  workload: number;
  development: number;
  workloadDelta: number;
  developmentDelta: number;
}

/** Shared by the weekly engine and HQ preview. Other weekly systems may affect morale and loyalty. */
export function projectStaffWorkWeek(member: StaffMember, developmentFocus = false): StaffWorkWeekProjection {
  const priority = getStaffWorkPriority(member);
  const option = staffWorkPriorities.find((item) => item.id === priority)!;
  const workload = clamp(member.workload + (member.delegated ? (member.workload >= 82 ? -7 : 1.5) : -3) + option.workloadDelta, 8);
  const development = clamp(member.development + (member.delegated ? 6 : 3) + (developmentFocus ? 7 : 0)
    - (member.workload >= 85 ? 2 : 0) + option.developmentDelta);
  return { priority, workload, development, workloadDelta: workload - member.workload, developmentDelta: development - member.development };
}

export type StaffWorkPriorityAssessment =
  | { allowed: false; reason: string }
  | { allowed: true; reason: string; memberBefore: StaffMember; memberAfter: StaffMember; staffAfter: StaffMember[]; forecast: StaffWorkWeekProjection };

const validId = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const validStat = (value: number) => Number.isFinite(value) && value >= 0 && value <= 100;
const nations = new Set(['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines']);
const archetypes = new Set(['head-of-state', 'cabinet-minister', 'bureau-director', 'regional-command', 'organizer', 'theater-command', 'service-director', 'field-command', 'unit-command', 'agent', 'resistance']);
const affiliations = new Set(['serving', 'dismissed', 'unattached', 'exile', 'defector', 'double-agent']);

/** Pure authorization + change, keyed by both seat and real person to prevent stale selections. */
export function assessStaffWorkPriority(
  input: StaffDecisionInput,
  staffId: string,
  personId: string,
  priority: StaffWorkPriority,
): StaffWorkPriorityAssessment {
  const deny = (reason: string): StaffWorkPriorityAssessment => ({ allowed: false, reason });
  if (input.busy) return deny('시간 진행 중입니다. 주간 결산이 끝난 뒤 업무 방침을 정하십시오.');
  if (!Number.isSafeInteger(input.game.week) || input.game.week < 0) return deny('현재 주차를 확인할 수 없습니다. 업무 방침을 집행하지 않습니다.');
  if (!staffWorkPriorities.some((option) => option.id === priority)) return deny('알 수 없는 업무 방침입니다. 통상 업무로 대신 집행하지 않습니다.');
  const { role, career, affiliationStatus } = input;
  if (!validId(role.id) || !nations.has(role.nationId) || !archetypes.has(role.archetype)
    || !Number.isInteger(role.tier) || role.tier < 1 || role.tier > 5 || !validStat(role.authority)
    || !['military', 'politics', 'intelligence'].includes(role.branch)) return deny('현재 보직의 인사권을 확인할 수 없습니다.');
  // This module is imported by staffManagement. Keep the office gate local to avoid a staffDecisions cycle.
  if (affiliationStatus !== undefined && !affiliations.has(affiliationStatus)) return deny('현재 소속 상태를 확인할 수 없습니다.');
  if (affiliationStatus === 'dismissed' || affiliationStatus === 'unattached') return deny('공식 보직에서 이탈한 상태입니다. 새 보직에 취임한 뒤 업무 방침을 정할 수 있습니다.');
  if (career && (career.nationId !== role.nationId || career.roleId !== role.id)) return deny('현재 경력과 인사권 보직이 일치하지 않습니다.');
  if (career?.startMode === 'civilian' && !career.civilian?.enteredOfficeRoleId) return deny('일반인 경력에는 국가 참모에게 업무를 지시할 권한이 없습니다.');
  if (!validId(staffId) || !validId(personId)
    || new Set(input.staff.map((member) => member.id)).size !== input.staff.length
    || new Set(input.staff.map((member) => member.personId)).size !== input.staff.length
    || new Set(input.staff.map((member) => member.department)).size !== input.staff.length) return deny('참모의 신원·보직 기록이 중복되거나 올바르지 않습니다.');
  const member = input.staff.find((item) => item.id === staffId && item.personId === personId);
  if (!member) return deny('선택했던 참모가 현재 명부와 다릅니다. 다른 사람에게 대신 지시하지 않습니다.');
  if (!staffSeatDefinitions.some((seat) => seat.department === member.department)
    || ![member.workload, member.development, member.ability, member.potential, member.loyalty, member.influence].every(validStat)
    || typeof member.delegated !== 'boolean') return deny('선택한 참모의 업무·육성 상태를 확인할 수 없습니다.');
  if (!getStaffAuthorityProfile(role).managedDepartments.includes(member.department)) return deny('상급기관의 관할 보직입니다. 이 참모의 업무 방침을 바꿀 인사권이 없습니다.');
  if (getStaffWorkPriority(member) === priority) return deny('이미 적용 중인 업무 방침입니다. 변경 사항이 없습니다.');
  const memberAfter: StaffMember = { ...member, workPriority: priority };
  return {
    allowed: true,
    reason: '업무 방침은 게임 상태에 즉시 반영되며 다음 주간 결산부터 매주 적용됩니다. 생산량·연구 진행도에 직접 보너스를 주지는 않습니다.',
    memberBefore: member,
    memberAfter,
    staffAfter: input.staff.map((item) => item.id === member.id ? memberAfter : item),
    forecast: projectStaffWorkWeek(memberAfter, input.developmentFocusId === member.id),
  };
}

export function changeStaffWorkPriority(input: StaffDecisionInput, staffId: string, personId: string, priority: StaffWorkPriority): StaffMember[] | null {
  const assessment = assessStaffWorkPriority(input, staffId, personId, priority);
  return assessment.allowed ? assessment.staffAfter : null;
}
