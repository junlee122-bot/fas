import type { RoleTabMandate } from './roleMandate';
import type { StaffMember } from './types';
import { getStaffMorale, getStaffRoleSatisfaction } from './staffManagement';
import { getStaffNarrativeOptions, resolveStaffNarrativeDecision } from './staffNarrative';
import type { StaffNarrativeCause, StaffNarrativeHistory, StaffNarrativeOption, StaffNarrativeState, StaffStoryline } from './staffNarrative';

/** A read-only projection. No meeting state, costs, or relationship values are persisted here. */
export interface StaffMeetingContext {
  state: StaffNarrativeState;
  staff: readonly StaffMember[];
  week: number;
  politicalPower: number;
  manageableStaffIds: ReadonlySet<string>;
  organizationMandate: RoleTabMandate;
}

export interface StaffMeetingEvidence {
  source: 'verified-event' | 'internal-state';
  label: string;
  evidenceId: string | null;
  week: number | null;
  description: string;
  warning: string | null;
  valid: boolean;
}

export interface StaffMeetingParticipant {
  member: StaffMember;
  manageable: boolean;
  identityNote: string | null;
  opinion: string;
}

export interface StaffMeetingAgenda {
  storylineId: string;
  story: StaffStoryline | null;
  status: 'active' | 'handled' | 'unavailable';
  participants: StaffMeetingParticipant[];
  evidence: StaffMeetingEvidence | null;
  canResolve: boolean;
  reason: string | null;
  options: StaffNarrativeOption[];
}

export function deriveStaffMeetingEvidence(cause: StaffNarrativeCause | undefined, sourceWeek: number, week: number): StaffMeetingEvidence {
  if (!cause || !['verified-event', 'internal-state'].includes(cause.source)) {
    return { source: 'internal-state', label: '자동 내부사정 · 구 기록', evidenceId: null, week: Number.isFinite(sourceWeek) ? sourceWeek : null, description: '기존 저장에는 연결된 플레이 사건의 근거가 없습니다.', warning: '별도의 전투·유출·항의 발언이 확인됐다는 뜻이 아닙니다.', valid: true };
  }
  const validDate = Number.isInteger(cause.week) && cause.week >= 0 && cause.week <= sourceWeek && cause.week <= week;
  const validId = cause.source === 'internal-state' || (typeof cause.evidenceId === 'string' && cause.evidenceId.trim().length > 0);
  const valid = validDate && validId && typeof cause.description === 'string';
  return {
    source: cause.source,
    label: cause.source === 'verified-event' ? '플레이 기록 연결' : '자동 내부사정',
    evidenceId: cause.source === 'verified-event' && validId ? cause.evidenceId : null,
    week: Number.isFinite(cause.week) ? cause.week : null,
    description: typeof cause.description === 'string' ? cause.description : '근거 설명이 없습니다.',
    warning: !valid ? '근거 ID 또는 주차를 확인할 수 없어 현재 결재할 수 없습니다.'
      : cause.source === 'internal-state' ? '현재 관계·업무 상태의 내부 검토입니다. 실제 외부 사건이나 당사자의 발언 기록이 아닙니다.'
        : week - cause.week > 8 ? '과거 사건의 발생 근거입니다. 이번 주의 새 사건이나 현재 성과로 다시 계산하지 않습니다.' : null,
    valid,
  };
}

function participantOpinion(member: StaffMember, cause: StaffMeetingEvidence): string {
  const concern = member.workload >= 80 ? `업무량 ${member.workload}이므로 추가 책임 전에 업무 분담을 검토할 필요가 있습니다.`
    : getStaffMorale(member) < 45 ? `현재 사기 ${getStaffMorale(member)}를 고려해 실행 가능한 지원과 확인 시점을 정할 필요가 있습니다.`
      : `현재 역할 만족 ${getStaffRoleSatisfaction(member)}를 바탕으로 책임 범위와 다음 확인 기준을 분명히 할 필요가 있습니다.`;
  return `${cause.source === 'verified-event' ? '연결된 기록을 검토하는 입장: ' : '현재 내부 상태를 검토하는 입장: '}${concern}`;
}

export function deriveStaffMeetingAgenda(context: StaffMeetingContext, storylineId: string): StaffMeetingAgenda {
  const { state, staff, week, organizationMandate, manageableStaffIds } = context;
  const empty: StaffMeetingAgenda = { storylineId, story: null, status: 'unavailable', participants: [], evidence: null, canResolve: false, reason: '이 안건은 현재 활성 현안에 없습니다. 결정·후속 기록을 확인하세요.', options: [] };
  // An imported/stale active entry must not resurrect an already handled agenda.
  if (state.history.some((record) => record.storylineId === storylineId)) return { ...empty, status: 'handled', reason: '이미 처리된 안건입니다. 기존 결정과 후속 기록만 열람할 수 있습니다.' };
  const stories = state.activeStorylines.filter((story) => story.id === storylineId);
  if (stories.length !== 1) return empty;
  const story = stories[0];
  const evidence = deriveStaffMeetingEvidence(story.cause, story.createdWeek, week);
  const seats = [{ id: story.firstStaffId, personId: story.firstPersonId }, ...(story.secondStaffId ? [{ id: story.secondStaffId, personId: story.secondPersonId }] : [])];
  const participants: StaffMeetingParticipant[] = [];
  let invalidParticipant = false;
  for (const seat of seats) {
    const matches = staff.filter((member) => member.id === seat.id);
    const member = matches.length === 1 ? matches[0] : undefined;
    if (!member || !seat.personId || member.personId !== seat.personId
      || (member.joinedWeek !== undefined && member.joinedWeek > story.createdWeek)
      || participants.some((participant) => participant.member.id === member.id || participant.member.personId === member.personId)) {
      invalidParticipant = true;
      continue;
    }
    participants.push({ member, manageable: manageableStaffIds.has(member.id), identityNote: seat.personId ? null : '구 안건: 당시 인물 ID 미보존 · 현재 보직 기록 기준', opinion: participantOpinion(member, evidence) });
  }
  const reason = invalidParticipant ? '당시 참가자의 퇴임·교체 또는 중복 식별로 현재 참석자를 확인할 수 없습니다. 이 안건은 결재하지 않습니다.'
    : !Number.isInteger(week) || !Number.isInteger(story.createdWeek) || story.createdWeek > week ? '아직 도착하지 않은 주차의 안건입니다.'
      : !evidence.valid ? evidence.warning
        : organizationMandate.tab !== 'organization' || organizationMandate.mode !== 'direct' ? '조직 업무의 직접 결재권이 없습니다. 기존 권한 상신·보고 경로를 확인하세요.'
          : !participants.some((participant) => participant.manageable) ? '당사자 모두 현재 보직의 직접 인사 관리 범위 밖입니다.' : null;
  return { storylineId, story, status: 'active', participants, evidence, canResolve: reason === null, reason, options: getStaffNarrativeOptions(story) };
}

export interface StaffMeetingEffect {
  label: string;
  before: number | boolean;
  after: number | boolean;
}

export interface StaffMeetingPreview {
  storylineId: string;
  option: StaffNarrativeOption;
  canConfirm: boolean;
  reason: string | null;
  verificationWeek: number;
  politicalPowerBefore: number;
  politicalPowerAfter: number;
  gameDelta: StaffNarrativeOption['gameDelta'];
  people: Array<{ staffId: string; name: string; effects: StaffMeetingEffect[] }>;
  bond: StaffMeetingEffect | null;
  /** UI-only review fingerprint: changing authority, people, PP, week or agenda needs fresh consent. */
  reviewToken: string;
}

export function deriveStaffMeetingPreview(context: StaffMeetingContext, storylineId: string, optionId: string): StaffMeetingPreview | null {
  const agenda = deriveStaffMeetingAgenda(context, storylineId);
  if (!agenda.story) return null;
  const option = agenda.options.find((candidate) => candidate.id === optionId);
  if (!option) return null;
  const ppValid = Number.isFinite(context.politicalPower) && context.politicalPower >= option.cost;
  const reason = agenda.reason ?? (!ppValid ? `정치력 ${option.cost}가 필요합니다. 현재 정치력으로는 결재할 수 없습니다.` : null);
  // Reuse the authoritative pure resolver so caps and the six-week handover match execution.
  // Its gameDelta already includes the option cost. Never subtract option.cost again.
  const result = agenda.canResolve ? resolveStaffNarrativeDecision(context.state, context.staff, storylineId, optionId, context.week) : null;
  const people = agenda.participants.map(({ member }) => {
    const after = result?.staff.find((candidate) => candidate.id === member.id);
    const effects: StaffMeetingEffect[] = [];
    if (after) {
      const fields: StaffMeetingEffect[] = [
        { label: '사기', before: getStaffMorale(member), after: getStaffMorale(after) },
        { label: '충성', before: member.loyalty, after: after.loyalty },
        { label: '역할 만족', before: getStaffRoleSatisfaction(member), after: getStaffRoleSatisfaction(after) },
        { label: '업무량', before: member.workload, after: after.workload },
        { label: '위임', before: member.delegated, after: after.delegated },
        { label: '잔여 계약(주)', before: member.contractWeeksRemaining ?? 52, after: after.contractWeeksRemaining ?? 52 },
      ];
      effects.push(...fields.filter((field) => field.before !== field.after));
    }
    return { staffId: member.id, name: member.name, effects };
  });
  const bondId = [agenda.story.firstStaffId, agenda.story.secondStaffId].filter(Boolean).sort().join(':');
  const oldBond = context.state.bonds.find((candidate) => candidate.id === bondId);
  const newBond = result?.state.bonds.find((candidate) => candidate.id === bondId);
  const bond = oldBond && newBond && oldBond.firstPersonId === newBond.firstPersonId && oldBond.secondPersonId === newBond.secondPersonId
    ? { label: '기존 두 사람의 관계', before: oldBond.affinity, after: newBond.affinity } : null;
  const gameDelta = result?.gameDelta ?? option.gameDelta;
  return {
    storylineId, option, canConfirm: reason === null && result !== null,
    reason: reason ?? (result ? null : '원본 현안을 현재 상태에서 집행할 수 없습니다.'),
    verificationWeek: result?.state.history.find((record) => record.storylineId === storylineId)?.verificationWeek ?? context.week + option.verifyAfterWeeks,
    politicalPowerBefore: context.politicalPower,
    politicalPowerAfter: context.politicalPower + (gameDelta.politicalPower ?? 0),
    gameDelta, people, bond,
    reviewToken: JSON.stringify([context.week, context.politicalPower, context.organizationMandate.tab, context.organizationMandate.mode, [...context.manageableStaffIds].sort(), agenda.story, agenda.participants.map(({ member }) => member), context.state.bonds, option]),
  };
}

export interface StaffMeetingHistoryView {
  record: StaffNarrativeHistory;
  status: 'waiting' | 'due' | 'verified' | 'void' | 'invalid';
  statusLabel: string;
  evidence: StaffMeetingEvidence;
  participantNote: string;
}

export function deriveStaffMeetingHistory(record: StaffNarrativeHistory, staff: readonly StaffMember[], week: number): StaffMeetingHistoryView {
  const validDate = Number.isInteger(record.week) && record.week >= 0 && record.week <= week
    && Number.isInteger(record.verificationWeek) && record.verificationWeek >= record.week;
  const identified = Boolean(record.participants?.length && record.participants.length === record.staffIds.length
    && record.staffIds.every((id) => record.participants!.some((person) => person.staffId === id && person.personId && person.name)));
  const present = identified && record.participants!.every((person) => staff.some((member) => member.id === person.staffId && member.personId === person.personId && (member.joinedWeek === undefined || member.joinedWeek <= record.week)));
  const verified = identified && record.verificationStatus !== 'void' && record.verifiedWeek !== undefined && Number.isInteger(record.verifiedWeek)
    && record.verifiedWeek >= record.verificationWeek && record.verifiedWeek <= week;
  const status = record.verificationStatus === 'void' || !identified || (!present && !verified) ? 'void'
    : !validDate || (record.verifiedWeek !== undefined && !verified) ? 'invalid' : verified ? 'verified' : week >= record.verificationWeek ? 'due' : 'waiting';
  const missingSeats = record.staffIds.filter((id) => !staff.some((member) => member.id === id)).length;
  return {
    record, status,
    statusLabel: status === 'verified' ? `제${record.verifiedWeek! + 1}주 후속 확인 기록 있음`
      : status === 'void' ? '검증 불가 · 후임자에게 책임을 넘기지 않음'
      : status === 'due' ? `제${record.verificationWeek + 1}주 확인 예정 · 주간 처리 기록 대기`
        : status === 'waiting' ? `제${record.verificationWeek + 1}주 후속 확인 예정` : '저장된 확인 주차를 검증할 수 없음',
    evidence: deriveStaffMeetingEvidence(record.cause, record.week, week),
    participantNote: identified ? `당시 당사자: ${record.participants!.map((person) => person.name).join(' · ')}. ${record.verificationReason ?? (present ? '현재 동일 인물 재직 확인.' : '현재 명단과 별개로 당시 인물의 기록을 보존합니다.')}`
      : `${missingSeats ? `현재 명단에 없는 당시 보직 ${missingSeats}개. ` : ''}당시 인물 ID가 기록에 없어 현재 보직자에게 과거 결정의 책임이나 성과를 다시 귀속하지 않습니다.`,
  };
}
