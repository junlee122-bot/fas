import type { CareerAffiliationStatus } from './careerMarket';
import type { CampaignPhase } from './nationManagement';
import {
  assessStaffPromise, getStaffContractWeeks, getStaffMorale, getStaffRenewalCost, getStaffRoleSatisfaction,
} from './staffManagement';
import type { StaffPromiseAssessment } from './staffManagement';
import {
  calculateStaffSuitability, getStaffAuthorityProfile, getStaffSeatTitle, reassignStaff, staffSeatDefinitions,
} from './staffOrganization';
import type { StaffSuitability } from './staffOrganization';
import type { CareerRole, CareerState, GameState, NationStatus, StaffDepartment, StaffMember } from './types';

export interface StaffDecisionInput {
  game: GameState;
  /** Effective office permissions, including a legitimately changed governing role. */
  role: CareerRole;
  staff: StaffMember[];
  developmentFocusId: string | null;
  campaignPhase: CampaignPhase;
  nationStatus: NationStatus;
  busy?: boolean;
  career?: CareerState;
  affiliationStatus?: CareerAffiliationStatus;
}

export type StaffDecisionAction =
  | { kind: 'promote'; staffId: string }
  | { kind: 'renew'; staffId: string }
  | { kind: 'assign'; staffId: string; department: StaffDepartment };

export interface StaffDecisionMemberChange {
  before: StaffMember;
  after: StaffMember;
  fitBefore: StaffSuitability;
  fitAfter: StaffSuitability;
  promiseBefore: StaffPromiseAssessment;
  promiseAfter: StaffPromiseAssessment;
}

export interface StaffDecisionResult {
  action: StaffDecisionAction;
  memberBefore: StaffMember;
  memberAfter: StaffMember;
  staffAfter: StaffMember[];
  gameAfter: GameState;
  developmentFocusAfter: string | null;
  cost: { politicalPower: number; treasury: number };
  weeklyPayrollBefore: number;
  weeklyPayrollAfter: number;
  changes: StaffDecisionMemberChange[];
  summary: string[];
  warnings: string[];
  basis: { week: number; roleId: string; nationId: CareerRole['nationId']; campaignPhase: CampaignPhase; nationStatus: NationStatus };
}

export type StaffDecisionAssessment =
  | { allowed: false; reason: string }
  | { allowed: true; reason: string; result: StaffDecisionResult };

export interface StaffDecisionReview {
  readonly action: StaffDecisionAction;
  readonly fingerprint: string;
  readonly contextFingerprint: string;
  readonly basis: Readonly<{ week: number; treasury: number; politicalPower: number }>;
  readonly assessment: Extract<StaffDecisionAssessment, { allowed: true }>;
}

export interface StaffReviewGate {
  submitted: Set<string>;
  contextFingerprint?: string;
}

export interface StaffDecisionReceipt {
  confirmed: boolean;
  status: 'confirmed' | 'pending' | 'changed';
  title: string;
  detail: string;
  checks: { label: string; confirmed: boolean }[];
}

const departments = new Set(staffSeatDefinitions.map((seat) => seat.department));
const nations = new Set(['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines']);
const archetypes = new Set(['head-of-state', 'cabinet-minister', 'bureau-director', 'regional-command', 'organizer', 'theater-command', 'service-director', 'field-command', 'unit-command', 'agent', 'resistance']);
const affiliations = new Set(['serving', 'dismissed', 'unattached', 'exile', 'defector', 'double-agent']);
const nationStatuses = new Set(['sovereign', 'government-in-exile', 'colonized', 'occupied-commonwealth', 'resistance-coalition']);
const gameFields: (keyof GameState)[] = [
  'week', 'manpower', 'politicalPower', 'fuel', 'steel', 'factories', 'stability', 'warSupport',
  'commandPoints', 'treasury', 'victoryScore', 'airPower', 'navalPower', 'intelNetwork', 'enemyPressure',
];
const validNumber = (value: number, maximum = Infinity) => Number.isFinite(value) && value >= 0 && value <= maximum;
const validIdentity = (value: string) => typeof value === 'string' && value.trim().length > 0;
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const deny = (reason: string): StaffDecisionAssessment => ({ allowed: false, reason });
/** Presentation only: weekly calculations retain their full precision in saved state. */
const displayStat = (value: number) => String(Math.round(value * 10) / 10);

/** Shared serving-office gate for interviews, delegation, development and candidate-market commands too.
 * Department permissions and action-specific costs remain the caller's responsibility.
 */
export function getStaffOfficeProblem(input: Pick<StaffDecisionInput, 'role' | 'career' | 'affiliationStatus'>): string | null {
  if (input.affiliationStatus !== undefined && !affiliations.has(input.affiliationStatus)) return '현재 소속 상태를 확인할 수 없습니다.';
  if (input.affiliationStatus === 'dismissed' || input.affiliationStatus === 'unattached') return '현재 공식 보직에서 이탈한 상태입니다. 새 보직에 취임한 뒤 참모 인사권을 행사할 수 있습니다.';
  if (input.career) {
    if (input.career.nationId !== input.role.nationId || input.career.roleId !== input.role.id) return '현재 경력과 인사권 보직이 일치하지 않습니다. 소속과 보직을 다시 확인하십시오.';
    if (input.career.startMode === 'civilian' && !input.career.civilian?.enteredOfficeRoleId) return '일반인 경력에는 국가 참모의 승급·재계약·보직 임명권이 없습니다. 공식 보직에 취임한 뒤 사용할 수 있습니다.';
  }
  return null;
}

function contextProblem(input: StaffDecisionInput): string | null {
  if (input.busy) return '시간 진행 중입니다. 결산이 끝난 뒤 최신 참모 명부로 다시 검토하십시오.';
  if (!Number.isSafeInteger(input.game.week) || gameFields.some((field) => !validNumber(input.game[field]))) {
    return '현재 주차와 국가 자원을 확인할 수 없습니다. 비용을 집행하지 않습니다.';
  }
  const role = input.role;
  if (!validIdentity(role.id) || !nations.has(role.nationId) || !archetypes.has(role.archetype)
    || !Number.isInteger(role.tier) || role.tier < 1 || role.tier > 5
    || !['military', 'politics', 'intelligence'].includes(role.branch)
    || !validNumber(role.authority, 100) || !['war', 'nation'].includes(input.campaignPhase)
    || !nationStatuses.has(input.nationStatus)) return '현재 보직과 지휘계통의 인사권을 확인할 수 없습니다.';
  const officeProblem = getStaffOfficeProblem(input);
  if (officeProblem) return officeProblem;
  const invalidMember = input.staff.some((member) =>
    !validIdentity(member.id) || !validIdentity(member.personId) || !validIdentity(member.name) || !departments.has(member.department)
    || ![member.ability, member.potential, member.loyalty, member.workload, member.influence, member.development].every((value) => validNumber(value, 100))
    || !validNumber(member.weeklyCost) || ![1, 2, 3].includes(member.grade) || typeof member.delegated !== 'boolean'
    || (member.morale !== undefined && !validNumber(member.morale, 100))
    || (member.roleSatisfaction !== undefined && !validNumber(member.roleSatisfaction, 100))
    || [member.contractWeeksRemaining, member.contractTermWeeks, member.joinedWeek, member.lastMeetingWeek]
      .some((value) => value !== undefined && (!Number.isSafeInteger(value) || value < 0))
    || (member.promisedDepartment !== undefined && !departments.has(member.promisedDepartment))
    || (member.appointmentAuthority !== undefined && !['advisor', 'executive', 'autonomous'].includes(member.appointmentAuthority))
    || (member.appointmentPromise !== undefined && !['none', 'resources', 'succession', 'security'].includes(member.appointmentPromise))
    || (member.squadStatus !== undefined && !['key', 'regular', 'rotation', 'development'].includes(member.squadStatus)));
  if (invalidMember || new Set(input.staff.map((member) => member.id)).size !== input.staff.length
    || new Set(input.staff.map((member) => member.personId)).size !== input.staff.length
    || new Set(input.staff.map((member) => member.department)).size !== input.staff.length) {
    return '참모의 신원·보직·계약 기록이 중복되거나 올바르지 않습니다. 다른 인물로 대신 집행하지 않습니다.';
  }
  if (input.developmentFocusId !== null && !input.staff.some((member) => member.id === input.developmentFocusId)) return '집중 육성 대상이 현재 참모 명부에 없습니다. 육성 대상을 다시 확인하십시오.';
  return null;
}

/** One deterministic projection is shared by preview, approval and the state commit. */
export function assessStaffDecision(input: StaffDecisionInput, action: StaffDecisionAction): StaffDecisionAssessment {
  const problem = contextProblem(input);
  if (problem) return deny(problem);
  if (!['promote', 'renew', 'assign'].includes(action.kind)) return deny('지원하지 않는 참모 인사 조치입니다.');
  const member = input.staff.find((item) => item.id === action.staffId);
  if (!member) return deny('선택한 참모가 현재 명부에 없습니다. 다른 인물로 대신 집행하지 않습니다.');
  const managed = getStaffAuthorityProfile(input.role).managedDepartments;
  if (!managed.includes(member.department)) return deny('현재 보직에는 이 참모의 승급·계약·배치를 결정할 인사권이 없습니다. 상급기관의 관할 보직입니다.');

  const result: StaffDecisionResult = {
    action: { ...action }, memberBefore: member, memberAfter: member, staffAfter: input.staff,
    gameAfter: input.game, developmentFocusAfter: input.developmentFocusId,
    cost: { politicalPower: 0, treasury: 0 },
    weeklyPayrollBefore: input.staff.reduce((sum, item) => sum + item.weeklyCost, 0),
    weeklyPayrollAfter: 0, changes: [], summary: [], warnings: [],
    basis: { week: input.game.week, roleId: input.role.id, nationId: input.role.nationId,
      campaignPhase: input.campaignPhase, nationStatus: input.nationStatus },
  };
  const title = (department: StaffDepartment) => getStaffSeatTitle(department, input.campaignPhase, input.nationStatus);
  let changedIds = [member.id];
  if (action.kind === 'promote') {
    if (member.grade >= 3) return deny('이 참모는 최고 전문 등급 3입니다. 사용자 보직의 5성 직급과 참모의 3단계 전문 등급은 서로 다른 체계입니다.');
    if (member.development < 100) return deny(`승급에는 육성 100이 필요합니다. 현재 ${displayStat(member.development)}이며 주간 업무나 집중 육성으로 성장시킬 수 있습니다.`);
    result.cost = { politicalPower: 8, treasury: 50 };
    result.memberAfter = {
      ...member, grade: (member.grade + 1) as 2 | 3, development: 0,
      // A legacy over-cap ability or potential must never decrease through a promotion.
      ability: Math.max(member.ability, Math.min(member.potential, member.ability + 4)),
      potential: Math.max(member.potential, Math.min(99, member.potential + 1)),
      loyalty: clamp(member.loyalty + 5), workload: clamp(member.workload + 8), weeklyCost: member.weeklyCost + 1,
    };
    result.staffAfter = input.staff.map((item) => item.id === member.id ? result.memberAfter : item);
    result.summary = [
      `전문 등급 ${member.grade} → ${result.memberAfter.grade} · 육성 ${displayStat(member.development)} → 0`,
      `능력 ${displayStat(member.ability)} → ${displayStat(result.memberAfter.ability)} · 잠재력 ${displayStat(member.potential)} → ${displayStat(result.memberAfter.potential)}`,
      `충성도 ${displayStat(member.loyalty)} → ${displayStat(result.memberAfter.loyalty)} · 업무량 ${displayStat(member.workload)} → ${displayStat(result.memberAfter.workload)}`,
      '보직·영향력·계약 기간·위임과 집중 육성 지정은 유지합니다. 사용자 직급이나 인사권이 상승하는 조치는 아닙니다.',
      '승급 효과는 승인 즉시, 인상된 주급의 지출은 다음 주간 결산부터 반영됩니다.',
    ];
    if (result.memberAfter.workload > 75) result.warnings.push(`승급 뒤 업무량 ${displayStat(result.memberAfter.workload)}: 과부하를 면담이나 책임 조정으로 관리하십시오.`);
  } else if (action.kind === 'renew') {
    const remaining = getStaffContractWeeks(member);
    if (remaining > 52) return deny(`남은 계약이 ${remaining}주입니다. 52주 이하가 되면 재계약할 수 있으며 반복 보너스로 사기와 충성도를 올릴 수 없습니다.`);
    result.cost = { politicalPower: 4, treasury: getStaffRenewalCost(member) };
    result.memberAfter = {
      ...member, contractWeeksRemaining: remaining + 104, contractTermWeeks: 104,
      weeklyCost: Math.ceil(member.weeklyCost * 1.08), morale: clamp(getStaffMorale(member) + 10),
      roleSatisfaction: clamp(getStaffRoleSatisfaction(member) + 6), loyalty: clamp(member.loyalty + 5),
    };
    result.staffAfter = input.staff.map((item) => item.id === member.id ? result.memberAfter : item);
    result.summary = [
      `남은 임기 ${remaining} → ${result.memberAfter.contractWeeksRemaining}주: 기존 잔여 기간에 104주를 더합니다.`,
      `사기 ${displayStat(getStaffMorale(member))} → ${displayStat(getStaffMorale(result.memberAfter))} · 역할 만족 ${displayStat(getStaffRoleSatisfaction(member))} → ${displayStat(getStaffRoleSatisfaction(result.memberAfter))}`,
      `충성도 ${displayStat(member.loyalty)} → ${displayStat(result.memberAfter.loyalty)} · 새 주급은 기존 주급의 108%를 올림한 값입니다.`,
      '갱신 보너스와 정치력은 승인 즉시 지출하고, 인상된 주급은 다음 주간 결산부터 매주 지출합니다.',
      '기존 보직·권한·임명 약속은 유지됩니다. 위임 회수나 보직 약속 위반이 재계약만으로 해결되지는 않습니다.',
    ];
  } else {
    if (!departments.has(action.department)) return deny('선택한 배치 보직을 확인할 수 없습니다. 기본 보직으로 대신 이동하지 않습니다.');
    if (member.department === action.department) return deny('이미 해당 보직에 재직 중입니다. 배치나 비용을 다시 집행하지 않습니다.');
    if (!managed.includes(action.department)) return deny('선택한 두 보직을 모두 임명할 권한이 없습니다. 잠긴 보직은 상급기관이 관리합니다.');
    const target = input.staff.find((item) => item.department === action.department);
    if (!target) return deny('교환할 보직의 현직자를 확인할 수 없습니다. 다른 사람이나 빈 보직으로 대신 집행하지 않습니다.');
    changedIds = [member.id, target.id];
    result.staffAfter = reassignStaff(input.staff, member.id, action.department);
    result.memberAfter = result.staffAfter.find((item) => item.id === member.id)!;
    if (input.developmentFocusId && changedIds.includes(input.developmentFocusId)) result.developmentFocusAfter = null;
    result.summary = [
      `${member.name}: ${title(member.department)} → ${title(action.department)}`,
      `${target.name}: ${title(target.department)} → ${title(member.department)}`,
      '두 사람을 서로 교환하며 해임하거나 다른 인물을 영입하지 않습니다. 일시 비용과 전체 주간 인건비는 변하지 않습니다.',
      '두 보직의 기존 책임 위임을 회수해 직접 결재로 전환합니다. 새 보직 기준으로 위임을 다시 지정하십시오.',
      result.developmentFocusAfter !== input.developmentFocusId
        ? '이동한 참모의 집중 육성 지정이 해제됩니다. 육성 진행도 자체는 유지합니다.'
        : '기존 집중 육성 지정과 모든 참모의 육성 진행도는 유지합니다.',
      '능력·등급·계약·약속은 유지하며, 새 보직과 약속의 차이는 다음 주간 사기·역할 만족·충성 계산에 영향을 줍니다.',
      '해당 참모가 담당하던 진행 중 납품 약속이 있으면 보직 변경으로 종료되며, 상대 참모에게 자동 승계되지 않습니다.',
    ];
  }
  if (!validNumber(result.cost.treasury) || !Number.isFinite(result.weeklyPayrollBefore)
    || result.staffAfter.some((item) => !validNumber(item.weeklyCost))) return deny('계약 비용이 계산 가능한 범위를 벗어났습니다. 비용을 집행하지 않습니다.');
  if (input.game.politicalPower < result.cost.politicalPower) return deny(`정치력 ${displayStat(result.cost.politicalPower)}이 필요합니다. 현재 ${displayStat(input.game.politicalPower)}이며 비용을 집행하지 않습니다.`);
  if (input.game.treasury < result.cost.treasury) return deny('승인에 필요한 국고가 부족합니다. 승급 비용 또는 갱신 보너스를 확보한 뒤 다시 검토하십시오.');
  result.gameAfter = { ...input.game, politicalPower: input.game.politicalPower - result.cost.politicalPower, treasury: input.game.treasury - result.cost.treasury };
  result.weeklyPayrollAfter = result.staffAfter.reduce((sum, item) => sum + item.weeklyCost, 0);
  if (!Number.isFinite(result.weeklyPayrollAfter)) return deny('전체 주간 인건비를 계산할 수 없습니다. 비용을 집행하지 않습니다.');
  result.changes = changedIds.map((id) => {
    const before = input.staff.find((item) => item.id === id)!;
    const after = result.staffAfter.find((item) => item.id === id)!;
    const promiseBefore = assessStaffPromise(before, input.developmentFocusId === id);
    const promiseAfter = assessStaffPromise(after, result.developmentFocusAfter === id);
    if (promiseAfter.state === 'at-risk' || promiseAfter.state === 'broken') result.warnings.push(`${after.name} · ${promiseAfter.label}: ${promiseAfter.summary}`);
    const fitAfter = calculateStaffSuitability(after, after.department);
    if (action.kind === 'assign' && fitAfter.score < 68) result.warnings.push(`${after.name} · 새 보직 적합도 ${fitAfter.score} (${fitAfter.label}): ${fitAfter.reasons.join(' · ')}`);
    return { before, after, fitBefore: calculateStaffSuitability(before, before.department), fitAfter, promiseBefore, promiseAfter };
  });
  return { allowed: true, reason: '현재 인사권·자원·명부에 따라 집행할 수 있습니다. 승인 전 두 사람의 변화와 지속 비용을 확인하십시오.', result };
}

function contextFingerprint(input: StaffDecisionInput): string {
  return JSON.stringify(input);
}

function fingerprint(input: StaffDecisionInput, action: StaffDecisionAction): string {
  return JSON.stringify({ context: contextFingerprint(input), action });
}

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

export function createStaffReview(input: StaffDecisionInput, action: StaffDecisionAction): StaffDecisionReview | null {
  const immutableAction = { ...action };
  const assessment = assessStaffDecision(input, immutableAction);
  if (!assessment.allowed) return null;
  return freezeDeep(structuredClone({
    action: immutableAction, fingerprint: fingerprint(input, immutableAction), contextFingerprint: contextFingerprint(input),
    basis: { week: input.game.week, treasury: input.game.treasury, politicalPower: input.game.politicalPower }, assessment,
  }));
}

export function assessStaffReview(review: StaffDecisionReview, input: StaffDecisionInput): StaffDecisionAssessment {
  if (review.fingerprint !== fingerprint(input, review.action)) return deny('검토 뒤 주차·자원·보직·명부·계약 또는 육성 대상이 바뀌었습니다. 최신 상태로 다시 검토하십시오.');
  return assessStaffDecision(input, review.action);
}

export function createStaffReviewGate(): StaffReviewGate {
  return { submitted: new Set<string>() };
}

export function isStaffReviewSubmitted(review: StaffDecisionReview, gate: StaffReviewGate): boolean {
  return gate.contextFingerprint === review.contextFingerprint && gate.submitted.has(JSON.stringify(review.action));
}

export function confirmStaffReview(
  review: StaffDecisionReview,
  input: StaffDecisionInput,
  submit: (result: StaffDecisionResult) => boolean | void,
  gate: StaffReviewGate,
): { ok: boolean; reason: string } {
  const assessment = assessStaffReview(review, input);
  if (!assessment.allowed) return { ok: false, reason: assessment.reason };
  const currentFingerprint = contextFingerprint(input);
  if (gate.contextFingerprint !== currentFingerprint) {
    gate.contextFingerprint = currentFingerprint;
    gate.submitted.clear();
  }
  const key = JSON.stringify(review.action);
  if (gate.submitted.has(key)) return { ok: false, reason: '이미 승인 요청을 전달했습니다. 실제 참모·자원 기록을 먼저 확인하십시오.' };
  if (gate.submitted.size > 0) return { ok: false, reason: '현재 명부에 다른 인사 조치를 전달했습니다. 결과가 반영된 뒤 다시 검토하십시오.' };
  // Keep only one submission for the current state epoch; mark before user code to block reentry.
  gate.submitted.add(key);
  try {
    if (submit(assessment.result) === false) return { ok: false, reason: '집행이 확인되지 않았습니다. 실제 기록을 확인하십시오. 중복 승인은 차단됐습니다.' };
    return { ok: true, reason: '승인 요청을 전달했습니다. 실제 참모·계약·자원에 반영됐는지 확인합니다.' };
  } catch {
    return { ok: false, reason: '집행 결과를 확인할 수 없습니다. 실제 기록을 확인하기 전 같은 요청을 반복하지 않습니다.' };
  }
}

/** Callback acknowledgement alone is not proof that the three live state branches were saved. */
export function getStaffDecisionReceipt(result: StaffDecisionResult, input: StaffDecisionInput): StaffDecisionReceipt {
  const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
  const sameOffice = result.basis.roleId === input.role.id && result.basis.nationId === input.role.nationId
    && result.basis.campaignPhase === input.campaignPhase && result.basis.nationStatus === input.nationStatus;
  const checks = [
    { label: '참모·보직·계약·위임 기록', confirmed: same(input.staff, result.staffAfter) },
    { label: '국고·정치력과 국가 자원', confirmed: same(input.game, result.gameAfter) },
    { label: '집중 육성 지정', confirmed: input.developmentFocusId === result.developmentFocusAfter },
    { label: '소속·보직·조직 체계', confirmed: sameOffice && !['dismissed', 'unattached'].includes(input.affiliationStatus ?? '') },
  ];
  const confirmed = checks.every((check) => check.confirmed);
  const changed = input.game.week !== result.basis.week || !sameOffice;
  const label = result.action.kind === 'promote' ? '승급' : result.action.kind === 'renew' ? '재계약' : '보직 교환';
  return {
    confirmed, status: confirmed ? 'confirmed' : changed ? 'changed' : 'pending',
    title: confirmed ? `${result.memberAfter.name} · ${label} 반영 확인`
      : changed ? '승인 이후 상태가 변경되었습니다' : '실제 반영 확인 중',
    detail: confirmed ? '현재 참모 명부·국가 자원·집중 육성 기록이 승인한 결과와 일치합니다.'
      : changed ? '시간 또는 소속·보직이 바뀌어 승인 직후 상태와 다릅니다. 인사 기록에서 해당 조치를 확인하십시오.'
        : '예상 결과와 실제 저장 상태가 아직 모두 일치하지 않습니다. 성공으로 표시하지 않으며 중복 승인하지 않습니다.',
    checks,
  };
}
