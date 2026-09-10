import { assessRecruitmentOffer, isCandidateShortlisted, weeklyRivalInterest } from './recruitment';
import type { RecruitmentOffer, RecruitmentOfferAssessment } from './recruitment';
import { getStaffAuthorityProfile, staffSeatDefinitions } from './staffOrganization';
import { withJosa } from './koreanGrammar';
import type { CareerRole, GameState, StaffCandidate, StaffMember } from './types';

export interface PersonnelContext {
  game: GameState;
  role: CareerRole;
  reputation: number;
  staff: StaffMember[];
  candidates: StaffCandidate[];
  busy?: boolean;
}

export interface PersonnelAction {
  kind: 'scout' | 'stop-scout' | 'shortlist' | 'approach' | 'recruit';
  candidateId: string;
  offer?: RecruitmentOffer;
}

export interface PersonnelActionResult {
  action: PersonnelAction;
  candidate: StaffCandidate;
  /** Null means this person was appointed and has left the candidate market. */
  updatedCandidate: StaffCandidate | null;
  candidates: StaffCandidate[];
  staff: StaffMember[];
  gameDelta: { politicalPower: number; treasury: number };
  cost: { politicalPower: number; treasury: number };
  requirements: { politicalPower: number; treasury: number };
  recruitment?: {
    assessment: RecruitmentOfferAssessment;
    success: boolean;
    incumbent: StaffMember;
    weeklyPayrollBefore: number;
    weeklyPayrollAfter: number;
  };
  summary: string[];
}

export type PersonnelActionAssessment =
  | { allowed: false; reason: string }
  | { allowed: true; reason: string; result: PersonnelActionResult };

export interface PersonnelReview {
  action: PersonnelAction;
  fingerprint: string;
  contextFingerprint: string;
  basis: Readonly<{ week: number; politicalPower: number; treasury: number }>;
  assessment: Extract<PersonnelActionAssessment, { allowed: true }>;
}

export interface PersonnelReviewGate {
  submitted: Set<string>;
  contextFingerprint?: string;
}

const departments = new Set(staffSeatDefinitions.map((seat) => seat.department));
const statuses = new Set(['unscouted', 'scouting', 'shortlisted', 'signed', 'lost']);
const availability = new Set(['available', 'poachable', 'opposition', 'displaced']);
const nationIds = new Set(['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines']);
const archetypes = new Set(['head-of-state', 'cabinet-minister', 'bureau-director', 'regional-command', 'organizer', 'theater-command', 'service-director', 'field-command', 'unit-command', 'agent', 'resistance']);
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const validNumber = (value: number, maximum = Infinity) => Number.isFinite(value) && value >= 0 && value <= maximum;
const validIdentity = (value: string) => typeof value === 'string' && value.trim().length > 0;
const deny = (reason: string): PersonnelActionAssessment => ({ allowed: false, reason });

/** Releases finished legacy assignments without clearing the independent interest list. */
export function normalizeCandidateScouting(candidate: StaffCandidate): StaffCandidate {
  const shortlisted = isCandidateShortlisted(candidate);
  const status = candidate.status === 'scouting' && candidate.knowledge >= 100
    ? shortlisted ? 'shortlisted' : 'unscouted'
    : candidate.status === 'shortlisted' && !shortlisted ? 'unscouted' : candidate.status;
  return { ...candidate, shortlisted, status };
}

export function normalizeCandidateScoutingRoster(candidates: readonly StaffCandidate[]) {
  return candidates.map(normalizeCandidateScouting);
}

/** One real campaign week: rival bids continue even when the player stops scouting. */
export function advanceCandidateScouting(candidates: readonly StaffCandidate[], personnelDelegated: boolean): StaffCandidate[] {
  return candidates.map((source) => {
    const candidate = normalizeCandidateScouting(source);
    if (candidate.status === 'signed' || candidate.status === 'lost') return candidate;
    const rivalInterest = weeklyRivalInterest(candidate);
    return normalizeCandidateScouting({
      ...candidate,
      rivalInterest,
      status: rivalInterest >= 100 ? 'lost' : candidate.status,
      knowledge: candidate.status === 'scouting'
        ? Math.min(100, candidate.knowledge + 18 + (personnelDelegated ? 5 : 0))
        : candidate.knowledge,
    });
  });
}

export function getPersonnelScoutingSummary(context: PersonnelContext) {
  const delegated = context.staff.some((member) => member.department === 'personnel' && member.delegated);
  const capacity = delegated ? 3 : 2;
  const active = context.candidates.filter((candidate) => candidate.status === 'scouting' && candidate.knowledge < 100).length;
  return { capacity, active, weeklyGain: delegated ? 23 : 18, available: Math.max(0, capacity - active) };
}

export function getCandidateScoutingPlan(candidate: StaffCandidate, personnelDelegated: boolean) {
  const weeklyGain = personnelDelegated ? 23 : 18;
  const complete = candidate.knowledge >= 100;
  const active = candidate.status === 'scouting' && !complete;
  const milestones = [
    { knowledge: 30, label: '비밀 접촉' },
    { knowledge: 35, label: '관심 명단' },
    { knowledge: 45, label: '임명 효과' },
    { knowledge: 55, label: '조건 협상' },
    { knowledge: 60, label: '경력 평가' },
    { knowledge: 65, label: '능력·위험 검증' },
    { knowledge: 85, label: '잠재력 확인' },
    { knowledge: 100, label: '조사 완료·슬롯 반환' },
  ].map((milestone) => ({
    ...milestone,
    weeks: candidate.knowledge >= milestone.knowledge ? 0 : active ? Math.ceil((milestone.knowledge - candidate.knowledge) / weeklyGain) : null,
  }));
  return { active, complete, weeklyGain, weeksToComplete: complete ? 0 : active ? Math.ceil((100 - candidate.knowledge) / weeklyGain) : null, milestones };
}

function validOffer(offer: RecruitmentOffer | undefined): offer is RecruitmentOffer {
  return Boolean(offer
    && ['advisor', 'executive', 'autonomous'].includes(offer.authority)
    && [52, 104, 156].includes(offer.termWeeks)
    && [0.9, 1, 1.15].includes(offer.salaryMultiplier)
    && [0.9, 1, 1.15].includes(offer.signingMultiplier)
    && ['none', 'resources', 'succession', 'security'].includes(offer.promise));
}

function contextProblem(context: PersonnelContext, candidate: StaffCandidate) {
  if (!Number.isSafeInteger(context.game.week) || context.game.week < 0
    || !validNumber(context.game.politicalPower) || !validNumber(context.game.treasury)
    || !validNumber(context.game.intelNetwork, 100) || !validNumber(context.reputation, 100)) return '현재 주차·자원·평판을 확인할 수 없습니다. 저장 상태를 확인하십시오.';
  if (!validIdentity(context.role.id) || !nationIds.has(context.role.nationId) || !archetypes.has(context.role.archetype)
    || !Number.isInteger(context.role.tier) || context.role.tier < 1 || context.role.tier > 5
    || !['military', 'politics', 'intelligence'].includes(context.role.branch)) return '현재 보직과 인사권을 확인할 수 없습니다.';
  if (!validIdentity(candidate.personId) || !validIdentity(candidate.id) || !departments.has(candidate.department)
    || !statuses.has(candidate.status) || !availability.has(candidate.availability)
    || ![candidate.knowledge, candidate.ability, candidate.potential, candidate.loyalty, candidate.influence, candidate.interest, candidate.relationship, candidate.rivalInterest].every((value) => validNumber(value, 100))
    || !validNumber(candidate.weeklyCost) || !validNumber(candidate.signingCost)
    || (candidate.shortlisted !== undefined && typeof candidate.shortlisted !== 'boolean')
    || (candidate.lastApproachWeek !== null && (!Number.isSafeInteger(candidate.lastApproachWeek) || candidate.lastApproachWeek < 0 || candidate.lastApproachWeek > context.game.week))) return '후보의 신원·조사·접촉 기록이 올바르지 않습니다. 다른 인물로 대신 집행하지 않습니다.';
  if (context.candidates.filter((item) => item.id === candidate.id).length !== 1
    || context.candidates.filter((item) => item.personId === candidate.personId).length !== 1) return '같은 신원에 중복된 후보 기록이 있습니다. 후보를 먼저 확인하십시오.';
  if (context.staff.some((member) => !validIdentity(member.id) || !validIdentity(member.personId) || !departments.has(member.department)
    || !validNumber(member.weeklyCost) || ![member.ability, member.potential, member.loyalty, member.influence].every((value) => validNumber(value, 100)))
    || new Set(context.staff.map((member) => member.id)).size !== context.staff.length
    || new Set(context.staff.map((member) => member.personId)).size !== context.staff.length) return '현직 참모의 신원·보수 기록을 확인할 수 없습니다.';
  return null;
}

function appointedMember(incumbent: StaffMember, candidate: StaffCandidate, offer: RecruitmentOffer, assessment: RecruitmentOfferAssessment, week: number): StaffMember {
  return {
    ...incumbent,
    personId: candidate.personId, name: candidate.name, role: candidate.role, candidateName: incumbent.name,
    historicalOffice: candidate.historicalOffice, affiliation: candidate.affiliation, summary: candidate.summary,
    ability: candidate.ability, potential: candidate.potential, loyalty: candidate.loyalty, workload: 18,
    weeklyCost: assessment.weeklyCost, specialty: candidate.specialty, influence: candidate.influence,
    delegated: false, grade: 1, development: 0,
    morale: Math.min(100, 68 + (offer.salaryMultiplier > 1 ? 5 : offer.salaryMultiplier < 1 ? -5 : 0) + (offer.promise !== 'none' ? 4 : 0)),
    roleSatisfaction: offer.authority === 'autonomous' ? 84 : offer.authority === 'executive' ? 74 : 62,
    contractWeeksRemaining: offer.termWeeks, contractTermWeeks: offer.termWeeks, joinedWeek: week,
    promisedDepartment: candidate.department,
    squadStatus: offer.authority === 'autonomous' ? 'key' : offer.authority === 'executive' ? 'regular' : 'rotation',
    appointmentAuthority: offer.authority, appointmentPromise: offer.promise,
    // The slot persists, but a new person must not inherit the predecessor's meeting cooldown.
    lastMeetingWeek: undefined,
    discipline: candidate.discipline, birthYear: candidate.birthYear, nationality: candidate.nationality,
    wartimeLocation: candidate.wartimeLocation, historicalConstraint: candidate.historicalConstraint,
    expertise: candidate.expertise, networks: candidate.networks, friction: candidate.friction,
    appointmentEffect: candidate.appointmentEffect, sourceLabel: candidate.sourceLabel, sourceUrl: candidate.sourceUrl,
  };
}

function displacedCandidate(incumbent: StaffMember, context: PersonnelContext): StaffCandidate {
  return {
    id: `${context.role.nationId}-candidate-displaced-${incumbent.personId}-${context.game.week}`,
    personId: incumbent.personId, name: incumbent.name, role: `전임 ${incumbent.role}`,
    historicalOffice: incumbent.historicalOffice, affiliation: incumbent.affiliation, summary: incumbent.summary,
    department: incumbent.department, ability: incumbent.ability, potential: incumbent.potential, loyalty: incumbent.loyalty,
    weeklyCost: incumbent.weeklyCost, signingCost: 42 + incumbent.ability + Math.round(incumbent.influence * 0.4),
    interest: Math.max(12, Math.round(58 - incumbent.loyalty * 0.35)), knowledge: 100,
    status: 'unscouted', shortlisted: false, specialty: incumbent.specialty, influence: incumbent.influence,
    relationship: 3, rivalInterest: 18, availability: 'displaced', lastApproachWeek: null,
    discipline: incumbent.discipline, birthYear: incumbent.birthYear, nationality: incumbent.nationality,
    wartimeLocation: incumbent.wartimeLocation, historicalConstraint: incumbent.historicalConstraint,
    expertise: incumbent.expertise, networks: incumbent.networks, friction: incumbent.friction,
    appointmentEffect: incumbent.appointmentEffect, sourceLabel: incumbent.sourceLabel, sourceUrl: incumbent.sourceUrl,
  };
}

/** Preview and execution use this same pure result, including deterministic failed negotiations. */
export function assessPersonnelAction(context: PersonnelContext, action: PersonnelAction): PersonnelActionAssessment {
  if (context.busy) return deny('주간 진행 중입니다. 결산이 끝난 뒤 현재 인사 기록으로 다시 검토하십시오.');
  const source = context.candidates.find((item) => item.id === action.candidateId);
  if (!source) return deny('선택한 후보가 현재 시장에 없습니다. 다른 인물로 대신 집행하지 않습니다.');
  const problem = contextProblem(context, source);
  if (problem) return deny(problem);
  if (source.status === 'signed' || source.status === 'lost') return deny(source.status === 'signed' ? '이미 임명된 후보입니다. 참모 명단을 확인하십시오.' : '경쟁 기관으로 이동한 후보입니다. 현재 시장에서 조치할 수 없습니다.');
  const candidate = normalizeCandidateScouting(source);
  const roster = normalizeCandidateScoutingRoster(context.candidates);
  const result: PersonnelActionResult = {
    action, candidate, updatedCandidate: candidate, candidates: roster, staff: context.staff,
    gameDelta: { politicalPower: 0, treasury: 0 }, cost: { politicalPower: 0, treasury: 0 },
    requirements: { politicalPower: 0, treasury: 0 }, summary: [],
  };
  let updated = candidate;
  if (action.kind === 'scout') {
    if (candidate.knowledge >= 100) return deny('정보 검증이 100% 완료됐습니다. 추가 비용이나 조사 슬롯이 필요하지 않습니다.');
    if (candidate.status === 'scouting') return deny('이미 자동 조사 중입니다. 다음 주에 정보가 무료로 갱신되며, 재착수 비용을 받지 않습니다.');
    const scouting = getPersonnelScoutingSummary(context);
    if (scouting.available === 0) return deny(`조사 슬롯 ${scouting.active}/${scouting.capacity}개가 사용 중입니다. 기존 조사를 중단하거나 완료를 기다리십시오.`);
    result.requirements.politicalPower = result.cost.politicalPower = 2;
    updated = normalizeCandidateScouting({ ...candidate, status: 'scouting', knowledge: Math.min(100, candidate.knowledge + 8) });
    result.summary = [`정치력 2를 지출하고 정보가 ${candidate.knowledge}% → ${updated.knowledge}%로 바뀝니다.`, updated.knowledge === 100 ? '즉시 검증 완료: 조사 슬롯을 점유하지 않습니다.' : `이후 실제 주간 진행마다 정보 +${scouting.weeklyGain}; 자동 조사에는 추가 정치력을 사용하지 않습니다.`, '관심 명단 여부는 변경하지 않습니다.'];
  } else if (action.kind === 'stop-scout') {
    if (source.status !== 'scouting') return deny('현재 진행 중인 조사가 없습니다.');
    updated = { ...candidate, status: isCandidateShortlisted(candidate) ? 'shortlisted' : 'unscouted' };
    result.summary = [`조사를 중단하고 슬롯을 반환합니다. 정보 ${candidate.knowledge}%와 관심 명단은 보존됩니다.`, '추가 비용은 없으며 이후 주간 조사 정보는 증가하지 않습니다. 재개할 때는 신규 조사와 같은 정치력 2가 필요합니다.', '경쟁 기관의 주간 제안은 조사 중단과 무관하게 계속됩니다.'];
  } else if (action.kind === 'shortlist') {
    if (candidate.knowledge < 35) return deny('관심 명단에는 정보 35% 이상을 확보한 후보를 등록할 수 있습니다.');
    const shortlisted = !isCandidateShortlisted(candidate);
    updated = { ...candidate, shortlisted, status: candidate.status === 'scouting' ? 'scouting' : shortlisted ? 'shortlisted' : 'unscouted' };
    result.summary = [shortlisted ? '관심 명단에 등록합니다. 기존 조사 진행을 중단하지 않습니다.' : '관심 명단에서 제외합니다. 기존 조사 진행은 유지됩니다.', '비용은 없습니다. 관심 명단은 설득 점수와 경쟁 기관 제안의 주간 압력에 반영됩니다.'];
  } else if (action.kind === 'approach') {
    if (candidate.knowledge < 30) return deny('비밀 접촉에는 정보 30% 이상이 필요합니다.');
    if (candidate.lastApproachWeek === context.game.week) return deny('이번 주에 이미 접촉한 인물입니다. 다음 주부터 다시 접촉할 수 있습니다.');
    if (context.game.intelNetwork < 25) return deny(`비밀 접촉에는 정보망 25 이상이 필요합니다. 현재 ${context.game.intelNetwork}입니다.`);
    result.requirements.politicalPower = result.cost.politicalPower = 4;
    const bonus = context.role.branch === 'intelligence' ? 5 : context.game.intelNetwork >= 70 ? 3 : 0;
    updated = normalizeCandidateScouting({
      ...candidate, relationship: clamp(candidate.relationship + 14 + bonus), interest: clamp(candidate.interest + 6),
      rivalInterest: clamp(candidate.rivalInterest - 8), knowledge: clamp(candidate.knowledge + 6), lastApproachWeek: context.game.week,
    });
    result.summary = [
      `정치력 4를 사용합니다. 정보망은 자격 조건이며 소모하지 않습니다.`,
      `관계 ${candidate.relationship} → ${updated.relationship} · 관심 ${candidate.interest} → ${updated.interest}`,
      `경쟁 제안 ${candidate.rivalInterest} → ${updated.rivalInterest} · 정보 ${candidate.knowledge}% → ${updated.knowledge}%`,
      '동일 인물과의 다음 접촉은 다음 주부터 가능합니다.',
    ];
  } else if (action.kind === 'recruit') {
    if (!validOffer(action.offer)) return deny('임명 제안의 권한·임기·보수·약속 조건을 다시 선택하십시오.');
    if (candidate.knowledge < 55) return deny('정식 임명 제안에는 정보 55% 이상이 필요합니다.');
    if (!getStaffAuthorityProfile(context.role).managedDepartments.includes(candidate.department)) return deny('현재 보직에는 이 부서의 임명권이 없습니다. 후보 조사와 접촉은 계속할 수 있습니다.');
    if (context.staff.some((member) => member.personId === candidate.personId)) return deny('이미 현재 참모진에 재직 중인 인물입니다. 중복 임명하지 않습니다.');
    const incumbents = context.staff.filter((member) => member.department === candidate.department);
    if (incumbents.length !== 1) return deny('교체 대상 보직의 현직자를 한 명으로 확인할 수 없습니다. 비용을 지출하지 않습니다.');
    const incumbent = incumbents[0];
    const assessment = assessRecruitmentOffer(candidate, context.reputation, action.offer);
    const success = assessment.score >= assessment.threshold;
    result.requirements = { politicalPower: 6, treasury: assessment.signingCost };
    result.cost = { politicalPower: success ? 6 : 3, treasury: success ? assessment.signingCost : 0 };
    const weeklyPayrollBefore = context.staff.reduce((total, member) => total + member.weeklyCost, 0);
    result.recruitment = {
      assessment, success, incumbent, weeklyPayrollBefore,
      weeklyPayrollAfter: success ? weeklyPayrollBefore - incumbent.weeklyCost + assessment.weeklyCost : weeklyPayrollBefore,
    };
    if (success) {
      result.staff = context.staff.map((member) => member.id === incumbent.id ? appointedMember(incumbent, candidate, action.offer!, assessment, context.game.week) : member);
      // Some legacy markets already listed the incumbent. Keep one current displaced record, not two identities.
      result.candidates = roster.filter((item) => item.personId !== incumbent.personId)
        .map((item) => item.id === candidate.id ? displacedCandidate(incumbent, context) : item);
      result.updatedCandidate = null;
      result.summary = [
        `설득 점수 ${assessment.score}/${assessment.threshold}: 현재 조건에서는 합의입니다. 확률 추첨을 하지 않습니다.`,
        `${withJosa(incumbent.name, '을/를')} 교체하고 ${withJosa(candidate.name, '을/를')} 같은 보직에 즉시 임명합니다. 전임자는 교체된 인물로 후보 시장에 남습니다.`,
        `정치력 6과 계약금 ${assessment.signingCost}를 사용합니다. 새 임기는 ${action.offer.termWeeks}주입니다.`,
        '기존 책임 위임과 인물별 면담 기록은 승계하지 않습니다. 새 권한·보직 약속은 이후 주간 만족도에 반영됩니다.',
      ];
    } else {
      updated = { ...candidate, interest: clamp(candidate.interest + 7), relationship: clamp(candidate.relationship + 4), rivalInterest: clamp(candidate.rivalInterest + 6), signingCost: candidate.signingCost + 12 };
      result.summary = [
        `설득 점수 ${assessment.score}/${assessment.threshold}: 현재 조건으로 제안하면 결렬됩니다. 확률 추첨을 하지 않습니다.`,
        '제안 자격에는 정치력 6과 전체 계약금이 필요하지만, 실제 결렬 비용은 정치력 3이며 계약금은 지출하지 않습니다.',
        `관심 ${candidate.interest} → ${updated.interest} · 관계 ${candidate.relationship} → ${updated.relationship} · 경쟁 제안 ${candidate.rivalInterest} → ${updated.rivalInterest}`,
        `다음 요구 기본 계약금 ${candidate.signingCost} → ${updated.signingCost}; 현직 참모와 주간 인건비는 그대로입니다.`,
      ];
    }
  } else return deny('지원하지 않는 인재 조치입니다.');

  if (context.game.politicalPower < result.requirements.politicalPower) return deny(`이 조치에는 정치력 ${result.requirements.politicalPower}가 필요합니다. 현재 ${context.game.politicalPower}입니다.`);
  if (context.game.treasury < result.requirements.treasury) return deny(`제안 가능한 국고가 부족합니다. 계약금 ${result.requirements.treasury}를 확보한 뒤 다시 검토하십시오.`);
  result.gameDelta = { politicalPower: -result.cost.politicalPower, treasury: -result.cost.treasury };
  if (!result.recruitment?.success) {
    result.updatedCandidate = updated;
    result.candidates = roster.map((item) => item.id === candidate.id ? updated : item);
  }
  return { allowed: true, reason: '검토만으로는 집행되지 않습니다. 현재 기록을 확인한 뒤 승인하십시오.', result };
}

function fingerprint(context: PersonnelContext, action: PersonnelAction) {
  return JSON.stringify({ game: context.game, role: context.role, reputation: context.reputation, staff: context.staff, candidates: context.candidates, busy: Boolean(context.busy), action });
}

export function createPersonnelReview(context: PersonnelContext, action: PersonnelAction): PersonnelReview | null {
  const immutableAction = { ...action, ...(action.offer ? { offer: { ...action.offer } } : {}) };
  const assessment = assessPersonnelAction(context, immutableAction);
  return assessment.allowed ? {
    action: immutableAction, fingerprint: fingerprint(context, immutableAction), assessment,
    contextFingerprint: fingerprint(context, { kind: 'scout', candidateId: '' }),
    basis: { week: context.game.week, politicalPower: context.game.politicalPower, treasury: context.game.treasury },
  } : null;
}

export function assessPersonnelReview(review: PersonnelReview, context: PersonnelContext): PersonnelActionAssessment {
  if (review.fingerprint !== fingerprint(context, review.action)) return deny('검토 뒤 주차·보직·신원·자원 또는 후보 상태가 바뀌었습니다. 최신 조건으로 다시 검토하십시오.');
  return assessPersonnelAction(context, review.action);
}

export function createPersonnelReviewGate(): PersonnelReviewGate {
  return { submitted: new Set<string>() };
}

/** Public dispatch status: consumers must not depend on the gate's compact key format. */
export function isPersonnelReviewSubmitted(review: PersonnelReview, gate: PersonnelReviewGate) {
  return gate.contextFingerprint === review.contextFingerprint && gate.submitted.has(JSON.stringify(review.action));
}

export function confirmPersonnelReview(review: PersonnelReview, context: PersonnelContext, submit: (result: PersonnelActionResult) => void | boolean, gate: PersonnelReviewGate): { ok: boolean; reason: string } {
  const assessment = assessPersonnelReview(review, context);
  if (!assessment.allowed) return { ok: false, reason: assessment.reason };
  // Old reviews cannot pass the full snapshot check. Retain only the current state epoch,
  // rather than every large candidate roster snapshot across a century-long campaign.
  const contextFingerprint = fingerprint(context, { kind: 'scout', candidateId: '' });
  if (gate.contextFingerprint !== contextFingerprint) {
    gate.contextFingerprint = contextFingerprint;
    gate.submitted.clear();
  }
  const actionKey = JSON.stringify(review.action);
  if (gate.submitted.has(actionKey)) return { ok: false, reason: '이미 승인 요청을 전달한 검토안입니다. 처리 결과를 먼저 확인하십시오.' };
  if (gate.submitted.size > 0) return { ok: false, reason: '현재 명부에 다른 인사 조치를 전달했습니다. 결과가 반영된 최신 명부로 다시 검토하십시오.' };
  gate.submitted.add(actionKey);
  try {
    if (submit(assessment.result) === false) return { ok: false, reason: '집행이 확인되지 않았습니다. 현재 기록을 확인하십시오. 중복 승인은 차단됐습니다.' };
    return { ok: true, reason: '승인 요청을 전달했습니다. 실제 인사·후보 기록에서 결과를 확인하십시오.' };
  } catch {
    return { ok: false, reason: '집행 결과를 확인할 수 없습니다. 인사 기록을 확인하기 전 같은 요청을 반복하지 않습니다.' };
  }
}
