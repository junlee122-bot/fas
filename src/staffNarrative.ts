import type { GameState, StaffMember } from './types';
import {
  assessStaffPromise,
  createStaffRelationships,
  getStaffBuyIn,
  getStaffMorale,
  getStaffRoleSatisfaction,
} from './staffManagement';

export type StaffNarrativeKind =
  | 'policy-feud'
  | 'credit-dispute'
  | 'confidence-crisis'
  | 'resignation-threat'
  | 'leak-suspicion'
  | 'succession-rivalry'
  | 'mentor-bond';

export type StaffNarrativeStage = 'private' | 'cabinet' | 'public';
export type StaffNarrativeTone = 'good' | 'bad' | 'neutral';

export type StaffNarrativeEvidenceKind = 'battle-victory' | 'battle-defeat' | 'personnel-change' | 'mission-failure' | 'broken-promise';

export interface StaffNarrativeEvidence {
  id: string;
  week: number;
  kind: StaffNarrativeEvidenceKind;
  description: string;
  /** Only people demonstrably connected to the source record, never guessed substitutes. */
  staffIds: string[];
}

export interface StaffNarrativeContext {
  evidence: readonly StaffNarrativeEvidence[];
}

export interface StaffNarrativeCause {
  source: 'verified-event' | 'internal-state';
  evidenceId: string | null;
  week: number;
  description: string;
  eventKind?: StaffNarrativeEvidenceKind;
}

export interface StaffNarrativeBond {
  id: string;
  firstStaffId: string;
  secondStaffId: string;
  firstPersonId: string;
  secondPersonId: string;
  affinity: number;
  trend: -1 | 0 | 1;
  reason: string;
  sharedWins: number;
  grievances: number;
  updatedWeek: number;
}

export interface StaffStoryline {
  id: string;
  kind: StaffNarrativeKind;
  stage: StaffNarrativeStage;
  title: string;
  summary: string;
  question: string;
  trigger: string;
  stakes: string;
  firstStaffId: string;
  secondStaffId?: string;
  createdWeek: number;
  deadlineWeek: number;
  publicRisk: number;
  escalationCount: number;
  cause: StaffNarrativeCause;
  firstPersonId?: string;
  secondPersonId?: string;
}

export interface StaffNarrativeHistory {
  id: string;
  storylineId: string;
  week: number;
  title: string;
  decision: string;
  outcome: string;
  tone: StaffNarrativeTone;
  staffIds: string[];
  verificationWeek: number;
  verifiedWeek?: number;
  cause: StaffNarrativeCause;
  /** Immutable identity at the original decision, never inferred from a successor's seat. */
  participants?: Array<{ staffId: string; personId: string; name: string }>;
  verificationStatus?: 'verified' | 'void';
  verificationReason?: string;
  verificationResolvedWeek?: number;
  verificationMeasurements?: Array<{ staffId: string; personId: string; name: string; morale: number; loyalty: number; roleSatisfaction: number; buyIn: number }>;
}

export interface StaffNarrativeState {
  version: 1;
  lastUpdatedWeek: number;
  nextStoryWeek: number;
  bonds: StaffNarrativeBond[];
  activeStorylines: StaffStoryline[];
  history: StaffNarrativeHistory[];
  consumedEvidenceIds: string[];
}

export interface StaffNarrativeOption {
  id: string;
  label: string;
  approach: string;
  forecast: string;
  cost: number;
  verifyAfterWeeks: number;
  firstDelta: Partial<Pick<StaffMember, 'loyalty' | 'workload' | 'morale' | 'roleSatisfaction' | 'contractWeeksRemaining' | 'delegated'>>;
  secondDelta?: Partial<Pick<StaffMember, 'loyalty' | 'workload' | 'morale' | 'roleSatisfaction' | 'contractWeeksRemaining' | 'delegated'>>;
  bondDelta: number;
  gameDelta: Partial<Pick<GameState, 'politicalPower' | 'stability' | 'intelNetwork' | 'commandPoints' | 'warSupport'>>;
  tone: StaffNarrativeTone;
}

export interface StaffNarrativeEvent {
  title: string;
  detail: string;
  tone: StaffNarrativeTone;
  decision: string;
  trigger: string;
  factors: string[];
  effects: Array<{ label: string; value: string; tone: 'positive' | 'negative' | 'neutral' }>;
  ongoing: string[];
  nextActions: string[];
  certainty: 'confirmed' | 'developing';
}

export interface StaffNarrativeAdvanceResult {
  state: StaffNarrativeState;
  staff: StaffMember[];
  events: StaffNarrativeEvent[];
}

export interface StaffNarrativeResolution {
  state: StaffNarrativeState;
  staff: StaffMember[];
  gameDelta: StaffNarrativeOption['gameDelta'];
  event: StaffNarrativeEvent;
  option: StaffNarrativeOption;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

function stableNumber(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function relationshipKind(affinity: number) {
  if (affinity >= 76) return '강한 신뢰';
  if (affinity >= 62) return '협력 관계';
  if (affinity >= 44) return '업무 관계';
  if (affinity >= 30) return '긴장 관계';
  return '공개적 경쟁';
}

function createBonds(staff: readonly StaffMember[], week: number): StaffNarrativeBond[] {
  return createStaffRelationships(staff).map((relationship) => ({
    id: relationship.id,
    firstStaffId: relationship.first.id,
    secondStaffId: relationship.second.id,
    firstPersonId: relationship.first.personId,
    secondPersonId: relationship.second.personId,
    affinity: relationship.affinity,
    trend: 0,
    reason: relationship.reason,
    sharedWins: 0,
    grievances: relationship.kind === 'tension' || relationship.kind === 'rivalry' ? 1 : 0,
    updatedWeek: week,
  }));
}

export function createStaffNarrativeState(staff: readonly StaffMember[], week = 0): StaffNarrativeState {
  return {
    version: 1,
    lastUpdatedWeek: week,
    nextStoryWeek: week + 3,
    bonds: createBonds(staff, week),
    activeStorylines: [],
    history: [],
    consumedEvidenceIds: [],
  };
}

function isNarrativeState(value: unknown): value is StaffNarrativeState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StaffNarrativeState>;
  return candidate.version === 1
    && typeof candidate.lastUpdatedWeek === 'number'
    && typeof candidate.nextStoryWeek === 'number'
    && Array.isArray(candidate.bonds)
    && Array.isArray(candidate.activeStorylines)
    && Array.isArray(candidate.history);
}

function synchronizeBonds(state: StaffNarrativeState, staff: readonly StaffMember[], week: number) {
  const members = new Map(staff.map((member) => [member.id, member]));
  const previous = new Map(state.bonds.map((bond) => [bond.id, bond]));
  return createStaffRelationships(staff).map((relationship): StaffNarrativeBond => {
    const saved = previous.get(relationship.id);
    if (!saved) {
      return {
        id: relationship.id,
        firstStaffId: relationship.first.id,
        secondStaffId: relationship.second.id,
        firstPersonId: relationship.first.personId,
        secondPersonId: relationship.second.personId,
        affinity: relationship.affinity,
        trend: 0,
        reason: relationship.reason,
        sharedWins: 0,
        grievances: relationship.affinity < 44 ? 1 : 0,
        updatedWeek: week,
      };
    }
    const first = members.get(saved.firstStaffId);
    const second = members.get(saved.secondStaffId);
    if (!first || !second) return saved;
    if ((saved.firstPersonId && saved.firstPersonId !== first.personId) || (saved.secondPersonId && saved.secondPersonId !== second.personId)) {
      return {
        id: relationship.id,
        firstStaffId: first.id,
        secondStaffId: second.id,
        firstPersonId: first.personId,
        secondPersonId: second.personId,
        affinity: relationship.affinity,
        trend: 0,
        reason: '새 보직자 사이에서 업무 관계를 처음부터 형성하고 있습니다.',
        sharedWins: 0,
        grievances: 0,
        updatedWeek: week,
      };
    }
    const pressure = saved.updatedWeek < week ? (first.workload >= 84 ? -1 : 0)
      + (second.workload >= 84 ? -1 : 0)
      + (getStaffMorale(first) < 45 ? -1 : 0)
      + (getStaffMorale(second) < 45 ? -1 : 0) : 0;
    const cooperation = saved.updatedWeek < week && first.delegated && second.delegated && first.workload < 78 && second.workload < 78 ? 1 : 0;
    const movement = clamp(pressure + cooperation, -2, 1);
    return {
      ...saved,
      firstPersonId: first.personId,
      secondPersonId: second.personId,
      affinity: clamp(saved.affinity + movement, 10, 95),
      trend: movement > 0 ? 1 : movement < 0 ? -1 : 0,
      reason: pressure < 0
        ? '과부하와 낮은 사기가 공동 업무의 책임 공방을 키우고 있습니다.'
        : cooperation > 0
          ? '함께 위임받은 업무를 처리하며 실무 신뢰가 쌓이고 있습니다.'
          : saved.reason,
      grievances: clamp(saved.grievances + (movement < 0 ? 1 : movement > 0 ? -1 : 0), 0, 20),
      sharedWins: clamp(saved.sharedWins + (movement > 0 ? 1 : 0), 0, 20),
      updatedWeek: week,
    };
  });
}

export function normalizeStaffNarrativeState(value: unknown, staff: readonly StaffMember[], week: number): StaffNarrativeState {
  const fallback = createStaffNarrativeState(staff, week);
  if (!isNarrativeState(value)) return fallback;
  const members = new Map(staff.map((member) => [member.id, member]));
  const history = value.history.slice(0, 24).map((record): StaffNarrativeHistory => {
    const cause = normalizeCause(record.cause, record.week, '기존 저장에는 연결된 플레이 사건의 근거가 없습니다.');
    if (record.verificationStatus === 'void') return { ...record, verifiedWeek: undefined, cause };
    const identityReason = historyIdentityProblem(record, staff);
    // A genuinely measured result remains historical even if that person leaves later.
    if (record.verificationStatus === 'verified' && record.verifiedWeek !== undefined && hasHistoryIdentities(record)) return { ...record, cause };
    if (identityReason) return { ...record, cause, verifiedWeek: undefined, verificationStatus: 'void', verificationResolvedWeek: week, verificationReason: identityReason, verificationMeasurements: undefined };
    return { ...record, cause };
  });
  const handledIds = new Set(history.map((record) => record.storylineId));
  const activeStorylines: StaffStoryline[] = [];
  for (const story of value.activeStorylines.slice(0, 3)) {
    if (handledIds.has(story.id) || activeStorylines.some((active) => active.id === story.id)) continue;
    const cause = normalizeCause(story.cause, story.createdWeek, story.trigger);
    const first = members.get(story.firstStaffId);
    const second = story.secondStaffId ? members.get(story.secondStaffId) : undefined;
    const validPerson = (member: StaffMember | undefined, personId: string | undefined) => Boolean(member && personId && member.personId === personId && staff.filter((candidate) => candidate.id === member.id).length === 1 && (member.joinedWeek === undefined || member.joinedWeek <= story.createdWeek));
    const validIdentity = validPerson(first, story.firstPersonId)
      && (!story.secondStaffId || (validPerson(second, story.secondPersonId) && first?.personId !== second?.personId));
    const invalidEvidence = story.cause?.source === 'verified-event' && (!story.cause.evidenceId?.trim()
      || !Number.isInteger(story.cause.week) || story.cause.week < 0 || story.cause.week > story.createdWeek || story.cause.week > week);
    if (!validIdentity || invalidEvidence || story.createdWeek > week) {
      history.unshift({ id: `${story.id}-unavailable`, storylineId: story.id, week, title: story.title,
        decision: '검토 종료 · 집행 없음', outcome: '원래 현안의 인물 또는 사건 근거를 현재 상태에서 확인할 수 없어 어떠한 선택 효과도 적용하지 않았습니다.',
        tone: 'neutral', staffIds: [story.firstStaffId, story.secondStaffId].filter(Boolean) as string[],
        verificationWeek: week, verificationStatus: 'void', verificationResolvedWeek: week,
        verificationReason: invalidEvidence ? '연결된 사건의 ID·발생 주차를 검증할 수 없습니다.' : '원래 참가자가 퇴임·교체되었거나 당시 인물 ID가 저장되지 않았습니다.', cause,
      });
      handledIds.add(story.id);
      continue;
    }
    activeStorylines.push({ ...story, cause });
  }
  const consumedEvidenceIds = [...new Set([
    ...(Array.isArray(value.consumedEvidenceIds) ? value.consumedEvidenceIds.filter((id) => typeof id === 'string' && id.length > 0) : []),
    ...[...activeStorylines, ...history].flatMap((record) => record.cause.source === 'verified-event' && record.cause.evidenceId ? [record.cause.evidenceId] : []),
  ])].slice(-256);
  const normalized: StaffNarrativeState = {
    ...value,
    lastUpdatedWeek: Math.min(week, value.lastUpdatedWeek),
    nextStoryWeek: Math.max(value.nextStoryWeek, value.lastUpdatedWeek),
    activeStorylines,
    history: history.slice(0, 24),
    consumedEvidenceIds,
  };
  return { ...normalized, bonds: synchronizeBonds(normalized, staff, week) };
}

function hasHistoryIdentities(record: StaffNarrativeHistory): boolean {
  const participants = record.participants;
  return Boolean(participants?.length && participants.length === record.staffIds.length
    && new Set(participants.map((participant) => participant.staffId)).size === participants.length
    && new Set(participants.map((participant) => participant.personId)).size === participants.length
    && record.staffIds.every((id) => participants.some((participant) => participant.staffId === id && Boolean(participant.personId) && Boolean(participant.name))));
}

function historyIdentityProblem(record: StaffNarrativeHistory, staff: readonly StaffMember[]): string | null {
  if (!hasHistoryIdentities(record)) return '당시 인물 식별 정보가 없는 구 기록입니다. 후임자의 수치로 소급 검증하지 않습니다.';
  const allPresent = record.participants!.every((participant) => {
    const matches = staff.filter((member) => member.id === participant.staffId);
    return matches.length === 1 && matches[0].personId === participant.personId && (matches[0].joinedWeek === undefined || matches[0].joinedWeek <= record.week);
  });
  return allPresent ? null : '당시 참가자가 퇴임·교체되었습니다. 후임자에게 책임을 넘기지 않고 후속 검증을 종료합니다.';
}

function snapshotParticipants(story: StaffStoryline, staff: readonly StaffMember[]): NonNullable<StaffNarrativeHistory['participants']> {
  return [story.firstStaffId, story.secondStaffId].flatMap((id) => {
    const member = id ? staff.find((candidate) => candidate.id === id) : undefined;
    return member ? [{ staffId: member.id, personId: member.personId, name: member.name }] : [];
  });
}

function normalizeCause(value: StaffNarrativeCause | undefined, week: number, description: string): StaffNarrativeCause {
  if (value && ['verified-event', 'internal-state'].includes(value.source)
    && Number.isFinite(value.week) && typeof value.description === 'string'
    && (value.source === 'internal-state' || (typeof value.evidenceId === 'string' && value.evidenceId.length > 0))) return value;
  return { source: 'internal-state', evidenceId: null, week, description: `자동 내부사정 · ${description}` };
}

const storylineCopy: Record<StaffNarrativeKind, Pick<StaffStoryline, 'question' | 'stakes'>> = {
  'policy-feud': {
    question: '업무 접점과 책임 분담을 어떤 원칙으로 조정하겠습니까?',
    stakes: '방치하면 부처 간 결재가 늦어지고 패배의 책임을 서로에게 돌리기 시작합니다.',
  },
  'credit-dispute': {
    question: '성과의 공로를 어떻게 배분하고 다음 책임자는 누구로 세우겠습니까?',
    stakes: '공로 배분은 충성도뿐 아니라 다음 위기에서 누가 지도부 편에 설지를 결정합니다.',
  },
  'confidence-crisis': {
    question: '현재 임명 조건과 지도부 신뢰를 어떻게 점검하고 조정하겠습니까?',
    stakes: '이 인사의 잔류와 지도부 신뢰, 같은 블록의 결속이 함께 걸려 있습니다.',
  },
  'resignation-threat': {
    question: '잔류 위험을 낮추도록 업무를 조정할지, 승계 준비를 시작할지 결정하십시오.',
    stakes: '결정을 미루면 보직 공백과 언론 추측이 동시에 커집니다.',
  },
  'leak-suspicion': {
    question: '정보 유출 의혹을 독립 조사할지, 내부에서 조용히 봉합할지 결정하십시오.',
    stakes: '잘못된 지목은 조직을 갈라놓고, 실제 유출을 놓치면 국가 기밀이 훼손됩니다.',
  },
  'succession-rivalry': {
    question: '역할·승계 배분의 기준을 공개할지, 한 사람에게 힘을 실을지 결정하십시오.',
    stakes: '승계 구도는 장기 충성도를 만들 수도, 지도부 안의 대항 세력을 만들 수도 있습니다.',
  },
  'mentor-bond': {
    question: '두 사람의 협력을 공동 과제로 키울지, 권력 집중을 경계해 분리할지 결정하십시오.',
    stakes: '좋은 관계도 방치하면 독자적인 인맥과 영향 블록으로 성장합니다.',
  },
};

function makeStory(kind: StaffNarrativeKind, first: StaffMember, second: StaffMember | undefined, week: number, trigger: string): StaffStoryline {
  const names = second ? `${first.name}–${second.name}` : first.name;
  const titles: Record<StaffNarrativeKind, string> = {
    'policy-feud': `${names} 노선 조정 점검`,
    'credit-dispute': `${names} 공로 배분 검토`,
    'confidence-crisis': `${first.name} 지도부 신임 점검`,
    'resignation-threat': `${first.name} 잔류 위험 점검`,
    'leak-suspicion': `${names} 유출 방지 점검`,
    'succession-rivalry': `${names} 역할·승계 배분 점검`,
    'mentor-bond': `${names} 공동 업무 검토`,
  };
  const summaries: Record<StaffNarrativeKind, string> = {
    'policy-feud': `${names}의 현재 관계와 업무 접점에서 조정이 필요한 긴장이 감지됐습니다. 외부 사건이나 공개 충돌이 확인된 것은 아닙니다.`,
    'credit-dispute': `${names}의 공로와 책임 배분 기준을 점검하는 내부 검토입니다. 별도의 성과 기록이나 당사자의 요구가 확인된 것은 아닙니다.`,
    'confidence-crisis': `${first.name}의 현재 임명 조건과 지도부 신뢰를 점검할 필요가 있습니다. 당사자의 항의 발언을 기록한 것은 아닙니다.`,
    'resignation-threat': `${first.name}의 업무량·사기·역할 만족 수치상 잔류 위험을 점검할 필요가 있습니다. 실제 사표나 사임 발언이 확인된 것은 아닙니다.`,
    'leak-suspicion': `${names}의 정보 공유 절차를 점검하는 내부 현안입니다. 실제 기밀 유출이나 범인이 확인된 것은 아닙니다.`,
    'succession-rivalry': `${names}의 현재 영향력과 보직 관계를 바탕으로 향후 역할 배분을 검토합니다. 별도 후계 조직이 확인된 것은 아닙니다.`,
    'mentor-bond': `${names} 사이의 높은 관계 신뢰를 공동 업무로 이어갈 방법을 검토합니다. 별도 작전이나 정책 성과를 주장하는 것은 아닙니다.`,
  };
  return {
    id: `staff-story-${week}-${stableNumber(`${kind}:${first.id}:${second?.id ?? 'solo'}:${week}`)}`,
    kind,
    stage: 'private',
    title: titles[kind],
    summary: summaries[kind],
    ...storylineCopy[kind],
    trigger,
    firstStaffId: first.id,
    secondStaffId: second?.id,
    createdWeek: week,
    deadlineWeek: week + 2,
    publicRisk: kind === 'mentor-bond' ? 12 : kind === 'leak-suspicion' ? 58 : 32,
    escalationCount: 0,
    cause: { source: 'internal-state', evidenceId: null, week, description: `자동 내부사정 · ${trigger}` },
    firstPersonId: first.personId,
    secondPersonId: second?.personId,
  };
}

function chooseStory(staff: readonly StaffMember[], bonds: readonly StaffNarrativeBond[], week: number, manageableStaffIds?: ReadonlySet<string>): StaffStoryline | null {
  if (!staff.length) return null;
  if (manageableStaffIds && manageableStaffIds.size === 0) return null;
  const inScope = (member: StaffMember) => !manageableStaffIds || manageableStaffIds.has(member.id);
  const scopedStaff = staff.filter(inScope);
  const brokenPromise = scopedStaff.find((member) => assessStaffPromise(member).state === 'broken');
  if (brokenPromise) return makeStory('confidence-crisis', brokenPromise, undefined, week, assessStaffPromise(brokenPromise).summary);
  const resignationCandidate = [...scopedStaff]
    .filter((member) => member.workload >= 82 || getStaffMorale(member) < 43 || getStaffRoleSatisfaction(member) < 40)
    .sort((left, right) => (getStaffBuyIn(left) - getStaffBuyIn(right)) || right.influence - left.influence)[0];
  if (resignationCandidate) {
    return makeStory('resignation-threat', resignationCandidate, undefined, week, `사기 ${getStaffMorale(resignationCandidate)} · 업무량 ${resignationCandidate.workload}% · 지도부 수용 ${getStaffBuyIn(resignationCandidate)}`);
  }
  const scopedBonds = bonds.filter((bond) => !manageableStaffIds || (manageableStaffIds.has(bond.firstStaffId) && manageableStaffIds.has(bond.secondStaffId)));
  const sorted = [...scopedBonds].sort((left, right) => left.affinity - right.affinity || right.grievances - left.grievances);
  const tense = sorted[0];
  const supportive = [...scopedBonds].sort((left, right) => right.affinity - left.affinity || right.sharedWins - left.sharedWins)[0];
  const pair = tense && tense.affinity < 55 ? tense : supportive;
  if (!pair) return makeStory('confidence-crisis', scopedStaff[0] ?? staff[0], undefined, week, '지도부와의 정례 신뢰 점검이 필요합니다.');
  const first = staff.find((member) => member.id === pair.firstStaffId);
  const second = staff.find((member) => member.id === pair.secondStaffId);
  if (!first || !second) return null;
  const kind: StaffNarrativeKind = pair.affinity >= 68
    ? 'mentor-bond'
    : first.influence >= 75 && second.influence >= 75 ? 'succession-rivalry' : 'policy-feud';
  return makeStory(kind, first, second, week, `${relationshipKind(pair.affinity)} ${pair.affinity} · ${pair.reason}`);
}

function chooseEvidenceStory(state: StaffNarrativeState, staff: readonly StaffMember[], week: number, manageableStaffIds: ReadonlySet<string> | undefined, context: StaffNarrativeContext | undefined): StaffStoryline | null {
  const kinds: StaffNarrativeEvidenceKind[] = ['battle-victory', 'battle-defeat', 'personnel-change', 'mission-failure', 'broken-promise'];
  const candidates = (context?.evidence ?? []).filter((evidence) => evidence && typeof evidence.id === 'string'
    && evidence.id.trim().length > 0 && !state.consumedEvidenceIds.includes(evidence.id)
    && Number.isInteger(evidence.week) && evidence.week >= 0 && evidence.week <= week && week - evidence.week <= 8
    && kinds.includes(evidence.kind) && typeof evidence.description === 'string' && evidence.description.trim().length > 0
    && Array.isArray(evidence.staffIds))
    .sort((left, right) => right.week - left.week || left.id.localeCompare(right.id));
  for (const evidence of candidates) {
    const participants = [...new Set(evidence.staffIds)].flatMap((id) => {
      const member = staff.find((candidate) => candidate.id === id);
      return member && (!manageableStaffIds || manageableStaffIds.has(id)) ? [member] : [];
    });
    const first = evidence.kind === 'broken-promise'
      ? participants.find((member) => assessStaffPromise(member).state === 'broken') : participants[0];
    if (!first) continue;
    const second = evidence.kind === 'broken-promise' ? undefined : participants.find((member) => member.id !== first.id);
    const names = second ? `${first.name}–${second.name}` : first.name;
    const kind: StaffNarrativeKind = evidence.kind === 'battle-victory' ? 'credit-dispute'
      : evidence.kind === 'personnel-change' ? 'succession-rivalry'
        : evidence.kind === 'broken-promise' ? 'confidence-crisis' : 'policy-feud';
    const label = evidence.kind === 'battle-victory' ? '전투 성과·공로 검토'
      : evidence.kind === 'battle-defeat' ? '전투 패배 후 책임 검토'
        : evidence.kind === 'mission-failure' ? '임무 실패 후 방침 검토'
          : evidence.kind === 'personnel-change' ? '임명 후 역할 확인' : '임명 약속 위반 점검';
    const question = evidence.kind === 'battle-victory' ? '기록된 성과를 바탕으로 공로와 다음 책임을 어떻게 배분하겠습니까?'
      : evidence.kind === 'personnel-change' ? '확인된 인사 변경 이후 권한과 책임 기준을 어떻게 정리하겠습니까?'
        : evidence.kind === 'broken-promise' ? '현재 임명 조건에서 확인된 약속 위반을 어떻게 바로잡겠습니까?'
          : '기록된 실패 이후 책임을 검토하고 다음 업무 방침을 어떻게 조정하겠습니까?';
    return {
      ...makeStory(kind, first, second, week, `${evidence.week}주차 플레이 기록 · ${evidence.description}`),
      id: `staff-story-event:${evidence.id}`,
      title: `${names} ${label}`,
      summary: `${evidence.description} 이 기록에 연결된 ${names}의 ${label} 현안입니다. 기록되지 않은 비난·사임·유출 발언을 뜻하지 않습니다.`,
      question,
      cause: { source: 'verified-event', evidenceId: evidence.id, week: evidence.week, description: evidence.description, eventKind: evidence.kind },
    };
  }
  return null;
}

function applyMemberDelta(member: StaffMember, delta: StaffNarrativeOption['firstDelta']): StaffMember {
  return {
    ...member,
    loyalty: delta.loyalty === undefined ? member.loyalty : clamp(member.loyalty + delta.loyalty),
    workload: delta.workload === undefined ? member.workload : clamp(member.workload + delta.workload, 5),
    morale: delta.morale === undefined ? getStaffMorale(member) : clamp(getStaffMorale(member) + delta.morale),
    roleSatisfaction: delta.roleSatisfaction === undefined ? getStaffRoleSatisfaction(member) : clamp(getStaffRoleSatisfaction(member) + delta.roleSatisfaction),
    contractWeeksRemaining: delta.contractWeeksRemaining === undefined
      ? member.contractWeeksRemaining
      : Math.max(0, (member.contractWeeksRemaining ?? 52) + delta.contractWeeksRemaining),
    delegated: delta.delegated === undefined ? member.delegated : delta.delegated,
  };
}

function autoEscalationDelta(member: StaffMember) {
  return applyMemberDelta(member, { morale: -3, loyalty: -2, roleSatisfaction: -3, workload: 2 });
}

export function advanceStaffNarrativeWeek(
  value: unknown,
  staff: readonly StaffMember[],
  week: number,
  manageableStaffIds?: ReadonlySet<string>,
  context?: StaffNarrativeContext,
): StaffNarrativeAdvanceResult {
  let state = normalizeStaffNarrativeState(value, staff, week);
  let nextStaff = [...staff];
  const events: StaffNarrativeEvent[] = [];
  const activeStorylines: StaffStoryline[] = [];
  const autoResolved: StaffNarrativeHistory[] = [];

  for (const story of state.activeStorylines) {
    if (week <= story.deadlineWeek) {
      activeStorylines.push(story);
      continue;
    }
    if (story.stage !== 'public') {
      const nextStage: StaffNarrativeStage = story.stage === 'private' ? 'cabinet' : 'public';
      const escalated = {
        ...story,
        stage: nextStage,
        deadlineWeek: week + (nextStage === 'public' ? 1 : 2),
        publicRisk: clamp(story.publicRisk + (nextStage === 'public' ? 26 : 14)),
        escalationCount: story.escalationCount + 1,
      };
      activeStorylines.push(escalated);
      nextStaff = nextStaff.map((member) => story.firstStaffId === member.id || story.secondStaffId === member.id ? autoEscalationDelta(member) : member);
      const internalOnly = story.cause.source === 'internal-state';
      events.push({
        title: `${nextStage === 'public' ? internalOnly ? '언론 노출 위험' : '언론 노출' : '각료회의 확산'} — ${story.title}`,
        detail: internalOnly
          ? `${story.summary} 대응 기한 경과로 내부 갈등의 ${nextStage === 'public' ? '공개 위험' : '각료회의 조정 필요'} 단계가 높아졌습니다. 별도 언론 보도나 실제 유출 기록이 확인된 것은 아닙니다.`
          : `${story.summary} 결정을 미룬 사이 문제가 ${nextStage === 'public' ? '신문사와 외부 정치권에 알려졌습니다.' : '소속 부처와 각료회의 의제로 번졌습니다.'}`,
        tone: 'bad',
        decision: '기한 안에 조직 갈등을 중재하지 않았습니다.',
        trigger: `${story.deadlineWeek}주차 대응 기한 경과`,
        factors: [`공개 위험 ${story.publicRisk} → ${escalated.publicRisk}`, `당사자 사기·충성·역할 만족 하락`],
        effects: [{ label: '갈등 단계', value: `${story.stage} → ${nextStage}`, tone: 'negative' }],
        ongoing: ['조직 운영의 인물·갈등 화면에서 아직 직접 개입할 수 있습니다.'],
        nextActions: ['다음 기한 전에 대응 방식을 선택하십시오.'],
        certainty: 'developing',
      });
      continue;
    }
    nextStaff = nextStaff.map((member) => story.firstStaffId === member.id || story.secondStaffId === member.id
      ? applyMemberDelta(member, { morale: -8, loyalty: -6, roleSatisfaction: -8, workload: 5, delegated: false })
      : member);
    autoResolved.push({
      id: `${story.id}-ignored-${week}`,
      storylineId: story.id,
      week,
      title: story.title,
      decision: '개입하지 않음',
      outcome: story.cause.source === 'internal-state'
        ? '내부 현안의 최종 대응 기한을 넘겨 당사자의 위임 회수와 사기·신뢰 하락이 적용됐습니다.'
        : '갈등이 공개적으로 폭발해 당사자의 위임 권한과 지도부 신뢰가 훼손됐습니다.',
      tone: 'bad',
      staffIds: [story.firstStaffId, story.secondStaffId].filter(Boolean) as string[],
      participants: snapshotParticipants(story, nextStaff),
      verificationWeek: week,
      cause: story.cause,
    });
    events.push({
      title: `조직 갈등 폭발 — ${story.title}`,
      detail: story.cause.source === 'internal-state'
        ? '내부 현안을 끝내 조정하지 않아 당사자의 위임을 회수하고 사기·충성·역할 만족을 낮췄습니다. 실제 언론 폭로를 확인한 기록은 아닙니다.'
        : '공개된 갈등을 끝내 중재하지 못했습니다. 당사자들은 책임에서 물러났고 지도부와의 관계가 장기 기록에 남습니다.',
      tone: 'bad',
      decision: '공개 갈등에도 개입하지 않았습니다.',
      trigger: '최종 대응 기한 경과',
      factors: [`공개 위험 ${story.publicRisk}`, `갈등 누적 ${story.escalationCount + 1}단계`],
      effects: [{ label: '당사자 위임', value: '회수', tone: 'negative' }, { label: '사기·충성', value: '큰 폭 하락', tone: 'negative' }],
      ongoing: ['이 결과는 인물 관계 기록과 향후 승계·사임 사건의 배경으로 남습니다.'],
      nextActions: ['참모 명단에서 업무와 권한을 재배치하십시오.', '후보 시장에서 승계 후보를 조사하십시오.'],
      certainty: 'confirmed',
    });
  }

  state = {
    ...state,
    lastUpdatedWeek: week,
    bonds: synchronizeBonds({ ...state, activeStorylines }, nextStaff, week),
    activeStorylines,
    history: [...autoResolved, ...state.history].slice(0, 24),
  };

  const dueReviews = state.history.filter((record) => record.verifiedWeek === undefined && record.verificationStatus !== 'void' && record.verificationWeek <= week);
  if (dueReviews.length) {
    const dueIds = new Set(dueReviews.map((record) => record.id));
    state = {
      ...state,
      history: state.history.map((record) => {
        if (!dueIds.has(record.id)) return record;
        const reason = historyIdentityProblem(record, nextStaff);
        if (reason) return { ...record, verificationStatus: 'void' as const, verificationResolvedWeek: week, verificationReason: reason };
        const verificationMeasurements = record.participants!.map((participant) => {
          const member = nextStaff.find((candidate) => candidate.id === participant.staffId && candidate.personId === participant.personId)!;
          return { ...participant, morale: getStaffMorale(member), loyalty: member.loyalty, roleSatisfaction: getStaffRoleSatisfaction(member), buyIn: getStaffBuyIn(member) };
        });
        return { ...record, verifiedWeek: week, verificationStatus: 'verified' as const, verificationResolvedWeek: week, verificationMeasurements };
      }),
    };
    dueReviews.slice(0, 2).forEach((record) => {
      if (historyIdentityProblem(record, nextStaff)) return;
      const involved = nextStaff.filter((member) => record.participants!.some((participant) => participant.staffId === member.id && participant.personId === member.personId));
      const averageMorale = involved.length
        ? Math.round(involved.reduce((total, member) => total + getStaffMorale(member), 0) / involved.length)
        : 50;
      const averageBuyIn = involved.length
        ? Math.round(involved.reduce((total, member) => total + getStaffBuyIn(member), 0) / involved.length)
        : 50;
      const tone: StaffNarrativeTone = averageMorale >= 62 && averageBuyIn >= 58 ? 'good' : averageMorale < 42 || averageBuyIn < 42 ? 'bad' : 'neutral';
      events.push({
        title: `후속 검증 — ${record.title}`,
        detail: `${record.decision} 이후 약속한 확인 시점이 왔습니다. 당사자 평균 사기 ${averageMorale}, 지도부 수용 ${averageBuyIn}으로 측정됐습니다.`,
        tone,
        decision: record.decision,
        trigger: `${record.verificationWeek}주차 후속 확인 약속`,
        factors: involved.map((member) => `${member.name}: 사기 ${getStaffMorale(member)} · 충성 ${member.loyalty} · 역할 만족 ${getStaffRoleSatisfaction(member)}`),
        effects: [{ label: '검증 결과', value: tone === 'good' ? '관계 안정' : tone === 'bad' ? '추가 개입 필요' : '효과 관찰 중', tone: tone === 'good' ? 'positive' : tone === 'bad' ? 'negative' : 'neutral' }],
        ongoing: [record.outcome],
        nextActions: tone === 'bad' ? ['당사자 면담과 업무 재조정을 진행하십시오.'] : ['인물 기록에서 결정과 후속 수치를 비교할 수 있습니다.'],
        certainty: 'confirmed',
      });
    });
  }

  if (week >= state.nextStoryWeek && state.activeStorylines.length === 0) {
    const story = chooseEvidenceStory(state, nextStaff, week, manageableStaffIds, context)
      ?? chooseStory(nextStaff, state.bonds, week, manageableStaffIds);
    if (story) {
      state = {
        ...state,
        activeStorylines: [story],
        nextStoryWeek: week + 4 + stableNumber(story.id) % 4,
        consumedEvidenceIds: story.cause.source === 'verified-event' && story.cause.evidenceId
          ? [...state.consumedEvidenceIds, story.cause.evidenceId].slice(-256) : state.consumedEvidenceIds,
      };
      events.push({
        title: `참모진 현안 — ${story.title}`,
        detail: `${story.summary} ${story.deadlineWeek}주차까지 대응하지 않으면 각료회의와 언론으로 번질 수 있습니다.`,
        tone: story.kind === 'mentor-bond' ? 'neutral' : 'bad',
        decision: '새로운 참모진 현안이 보고됐습니다.',
        trigger: story.trigger,
        factors: [`발생 근거 ${story.cause.source === 'verified-event' ? `플레이 기록 ${story.cause.evidenceId}` : '자동 내부사정'} · ${story.cause.week}주차 · ${story.cause.description}`, `현재 단계 비공개`, `공개 위험 ${story.publicRisk}`, `결정 기한 ${story.deadlineWeek}주차`],
        effects: [{ label: '조직 의제', value: story.title, tone: story.kind === 'mentor-bond' ? 'positive' : 'negative' }],
        ongoing: [story.stakes],
        nextActions: ['조직 운영 → 인물·분위기의 인물·갈등 브리핑에서 대응하십시오.'],
        certainty: 'developing',
      });
    }
  }

  return { state, staff: nextStaff, events };
}

const sharedOptions = {
  mediate: (story: StaffStoryline): StaffNarrativeOption => ({
    id: 'mediate', label: story.secondStaffId ? '비공개 중재 회의' : '비공개 책임 면담', approach: '당사자의 의견을 듣고 책임·공로·결재선을 문서로 합의합니다.',
    forecast: `당사자 사기 +5 · 역할 만족 +4${story.secondStaffId ? ' · 관계 +10' : ''} · 2주 뒤 검증`, cost: 3, verifyAfterWeeks: 2,
    firstDelta: { morale: 5, roleSatisfaction: 4, workload: -2 }, secondDelta: { morale: 5, roleSatisfaction: 4, workload: -2 },
    bondDelta: story.secondStaffId ? (story.kind === 'mentor-bond' ? 5 : 10) : 0, gameDelta: { politicalPower: -3 }, tone: 'good',
  }),
  backFirst: (story: StaffStoryline): StaffNarrativeOption => ({
    id: 'back-first', label: story.secondStaffId ? '첫 번째 인사 지지' : '당사자 책임·공로 인정', approach: '빠른 결론을 위해 해당 인사에게 책임과 공로를 집중합니다.',
    forecast: `당사자 충성 +8${story.secondStaffId ? ' · 상대 사기 -9 · 관계 -13' : ''} · 1주 뒤 확인`, cost: 0, verifyAfterWeeks: 1,
    firstDelta: { loyalty: 8, morale: 5, roleSatisfaction: 6 }, secondDelta: { loyalty: -6, morale: -9, roleSatisfaction: -8 },
    bondDelta: story.secondStaffId ? -13 : 0, gameDelta: { politicalPower: 1 }, tone: 'neutral',
  }),
  publicStandards: (story: StaffStoryline): StaffNarrativeOption => ({
    id: 'public-standards', label: '기준과 책임 공개', approach: '결정 기준과 지도부 책임을 공개해 소문 대신 검증 가능한 절차를 세웁니다.',
    forecast: `안정 +2 · 당사자 충성 +3 · 업무량 +3${story.secondStaffId ? ' · 관계 +5' : ''} · 3주 뒤 검증`, cost: 4, verifyAfterWeeks: 3,
    firstDelta: { loyalty: 3, morale: 2, workload: 3 }, secondDelta: { loyalty: 3, morale: 2, workload: 3 },
    bondDelta: story.secondStaffId ? 5 : 0, gameDelta: { politicalPower: -4, stability: 2 }, tone: 'good',
  }),
};

export function getStaffNarrativeOptions(story: StaffStoryline): StaffNarrativeOption[] {
  if (story.kind === 'confidence-crisis') return [
    {
      id: 'restore-mandate', label: '약속한 권한 복원', approach: '임명 당시 약속한 책임 범위를 즉시 되돌려 줍니다.',
      forecast: '사기 +12 · 충성 +8 · 역할 만족 +14 · 위임 복원 · 2주 뒤 검증', cost: 5, verifyAfterWeeks: 2,
      firstDelta: { morale: 12, loyalty: 8, roleSatisfaction: 14, delegated: true }, bondDelta: 0,
      gameDelta: { politicalPower: -5 }, tone: 'good',
    },
    {
      id: 'renegotiate', label: '조건 재협상', approach: '권한 대신 임기·업무량·경력 경로를 새로 합의합니다.',
      forecast: '사기 +7 · 역할 만족 +8 · 업무량 -10 · 계약 +26주 · 3주 뒤 검증', cost: 3, verifyAfterWeeks: 3,
      firstDelta: { morale: 7, loyalty: 4, roleSatisfaction: 8, workload: -10, contractWeeksRemaining: 26 }, bondDelta: 0,
      gameDelta: { politicalPower: -3 }, tone: 'good',
    },
    {
      id: 'demand-loyalty', label: '공직 기강 요구', approach: '전시·위기 상황을 들어 약속보다 조직 충성을 우선하라고 요구합니다.',
      forecast: '정치력 +2 · 사기 -9 · 역할 만족 -12 · 즉시 확인', cost: 0, verifyAfterWeeks: 1,
      firstDelta: { morale: -9, loyalty: -4, roleSatisfaction: -12 }, bondDelta: 0,
      gameDelta: { politicalPower: 2 }, tone: 'bad',
    },
  ];
  if (story.kind === 'resignation-threat') return [
    {
      id: 'retain', label: '직접 설득해 잔류', approach: '업무를 덜어주고 지도부의 공개 신임과 다음 경력 경로를 약속합니다.',
      forecast: '사기 +15 · 충성 +8 · 업무량 -14 · 역할 만족 +12 · 2주 뒤 검증', cost: 5, verifyAfterWeeks: 2,
      firstDelta: { morale: 15, loyalty: 8, roleSatisfaction: 12, workload: -14, contractWeeksRemaining: 13 }, bondDelta: 0,
      gameDelta: { politicalPower: -5 }, tone: 'good',
    },
    {
      id: 'handover', label: '승계·인수인계 착수', approach: '6주 인수인계 기간을 두고 위임을 회수한 뒤 후보 시장을 엽니다.',
      forecast: '위임 회수 · 계약 6주로 조정 · 충성 -4 · 후임 조사 필요', cost: 2, verifyAfterWeeks: 1,
      firstDelta: { morale: -3, loyalty: -4, roleSatisfaction: -8, delegated: false, contractWeeksRemaining: -999 }, bondDelta: 0,
      gameDelta: { politicalPower: -2, stability: -1 }, tone: 'neutral',
    },
    {
      id: 'call-bluff', label: '사임 압박 거부', approach: '추가 양보 없이 기존 계약과 책임을 이행하라고 통보합니다.',
      forecast: '정치력 +2 · 사기 -12 · 충성 -8 · 공개 위험 잔존', cost: 0, verifyAfterWeeks: 1,
      firstDelta: { morale: -12, loyalty: -8, roleSatisfaction: -10 }, bondDelta: 0,
      gameDelta: { politicalPower: 2 }, tone: 'bad',
    },
  ];
  if (story.kind === 'leak-suspicion') return [
    {
      id: 'independent-inquiry', label: '독립 보안 조사', approach: '당사자 지휘계통 밖 조사팀이 접근 기록과 동기를 검증합니다.',
      forecast: '정보망 +4 · 두 사람 업무량 +4 · 관계 +3 · 3주 뒤 결과', cost: 4, verifyAfterWeeks: 3,
      firstDelta: { workload: 4 }, secondDelta: { workload: 4 }, bondDelta: 3,
      gameDelta: { politicalPower: -4, intelNetwork: 4 }, tone: 'good',
    },
    {
      id: 'quiet-containment', label: '내부 봉합', approach: '문건 회수와 비공개 경고로 언론 노출을 막고 조직을 우선 보호합니다.',
      forecast: '사기 +3 · 관계 +5 · 정보망 -2 · 2주 뒤 재발 확인', cost: 2, verifyAfterWeeks: 2,
      firstDelta: { morale: 3 }, secondDelta: { morale: 3 }, bondDelta: 5,
      gameDelta: { politicalPower: -2, intelNetwork: -2 }, tone: 'neutral',
    },
    {
      id: 'security-purge', label: '강제 보안 심문', approach: '양측 참모진을 직무에서 떼어내고 강도 높은 심문과 통신 통제를 실시합니다.',
      forecast: '정보망 +7 · 위임 회수 · 사기 -10 · 관계 -14 · 안정 -2', cost: 3, verifyAfterWeeks: 1,
      firstDelta: { morale: -10, loyalty: -5, delegated: false }, secondDelta: { morale: -10, loyalty: -5, delegated: false }, bondDelta: -14,
      gameDelta: { politicalPower: -3, intelNetwork: 7, stability: -2 }, tone: 'bad',
    },
  ];
  if (story.kind === 'mentor-bond') return [
    {
      id: 'joint-project', label: '공동 특별과제', approach: '두 사람에게 같은 성과 목표와 공동 책임을 부여합니다.',
      forecast: '관계 +9 · 사기 +5 · 업무량 +7 · 지휘점수 +3 · 3주 뒤 검증', cost: 3, verifyAfterWeeks: 3,
      firstDelta: { morale: 5, workload: 7 }, secondDelta: { morale: 5, workload: 7 }, bondDelta: 9,
      gameDelta: { politicalPower: -3, commandPoints: 3 }, tone: 'good',
    },
    sharedOptions.publicStandards(story),
    {
      id: 'separate-duties', label: '권한 분산', approach: '독자적인 파벌이 되지 않도록 보고선과 담당 현안을 분리합니다.',
      forecast: '관계 -6 · 업무량 -5 · 지도부 통제력 +2', cost: 0, verifyAfterWeeks: 2,
      firstDelta: { workload: -5 }, secondDelta: { workload: -5 }, bondDelta: -6,
      gameDelta: { politicalPower: 1 }, tone: 'neutral',
    },
  ];
  return [sharedOptions.mediate(story), sharedOptions.backFirst(story), sharedOptions.publicStandards(story)];
}

function deltaSummary(delta: StaffNarrativeOption['firstDelta']) {
  const labels: Array<[keyof typeof delta, string]> = [
    ['morale', '사기'], ['loyalty', '충성'], ['roleSatisfaction', '역할 만족'], ['workload', '업무량'], ['contractWeeksRemaining', '계약'],
  ];
  return labels.flatMap(([key, label]) => typeof delta[key] === 'number' ? [`${label} ${(delta[key] as number) > 0 ? '+' : ''}${delta[key]}`] : []);
}

export function resolveStaffNarrativeDecision(
  value: unknown,
  staff: readonly StaffMember[],
  storylineId: string,
  optionId: string,
  week: number,
): StaffNarrativeResolution | null {
  const state = normalizeStaffNarrativeState(value, staff, week);
  const story = state.activeStorylines.find((candidate) => candidate.id === storylineId);
  if (!story) return null;
  const option = getStaffNarrativeOptions(story).find((candidate) => candidate.id === optionId);
  if (!option) return null;
  const first = staff.find((member) => member.id === story.firstStaffId);
  const second = story.secondStaffId ? staff.find((member) => member.id === story.secondStaffId) : undefined;
  if (!first) return null;
  let nextStaff = staff.map((member) => {
    if (member.id === story.firstStaffId) {
      const changed = applyMemberDelta(member, option.firstDelta);
      if (option.id === 'handover') return { ...changed, contractWeeksRemaining: 6 };
      return changed;
    }
    if (member.id === story.secondStaffId && option.secondDelta) return applyMemberDelta(member, option.secondDelta);
    return member;
  });
  const nextBonds = state.bonds.map((bond) => {
    if (!story.secondStaffId || bond.id !== [story.firstStaffId, story.secondStaffId].sort().join(':')) return bond;
    return {
      ...bond,
      affinity: clamp(bond.affinity + option.bondDelta, 10, 95),
      trend: option.bondDelta > 0 ? 1 as const : option.bondDelta < 0 ? -1 as const : 0 as const,
      sharedWins: clamp(bond.sharedWins + (option.bondDelta > 0 ? 1 : 0), 0, 20),
      grievances: clamp(bond.grievances + (option.bondDelta < 0 ? 1 : option.bondDelta > 0 ? -1 : 0), 0, 20),
      updatedWeek: week,
    };
  });
  nextStaff = nextStaff.map((member) => member);
  const names = [first.name, second?.name].filter(Boolean).join('·');
  const history: StaffNarrativeHistory = {
    id: `${story.id}-${option.id}-${week}`,
    storylineId: story.id,
    week,
    title: story.title,
    decision: option.label,
    outcome: `${names} 관련 현안에 ‘${option.label}’ 원칙을 적용했습니다. ${option.forecast}`,
    tone: option.tone,
    staffIds: [story.firstStaffId, story.secondStaffId].filter(Boolean) as string[],
    participants: snapshotParticipants(story, staff),
    verificationWeek: week + option.verifyAfterWeeks,
    cause: story.cause,
  };
  const staffEffects = [...deltaSummary(option.firstDelta), ...(option.secondDelta ? deltaSummary(option.secondDelta) : [])];
  const relationEffect = story.secondStaffId && option.bondDelta !== 0 ? `관계 ${option.bondDelta > 0 ? '+' : ''}${option.bondDelta}` : null;
  const event: StaffNarrativeEvent = {
    title: `참모진 결정 — ${story.title}`,
    detail: `${option.approach} ${week + option.verifyAfterWeeks}주차에 약속 이행과 관계 변화를 다시 검증합니다.`,
    tone: option.tone,
    decision: option.label,
    trigger: `${story.trigger} · ${story.stage === 'public' ? '이미 언론에 노출된 현안' : story.stage === 'cabinet' ? '각료회의까지 확산된 현안' : '비공개 내부 현안'}`,
    factors: [`당사자 ${names}`, `공개 위험 ${story.publicRisk}`, `사용 정치력 ${option.cost}`],
    effects: [
      { label: '당사자 변화', value: staffEffects.join(' · ') || '수치 변화 없음', tone: option.tone === 'bad' ? 'negative' : 'positive' },
      ...(relationEffect ? [{ label: '관계', value: relationEffect, tone: option.bondDelta > 0 ? 'positive' as const : 'negative' as const }] : []),
    ],
    ongoing: [story.stakes, `결정은 ${history.verificationWeek}주차 검증 기록에 남습니다.`],
    nextActions: ['인물·분위기 화면에서 당사자의 사기·충성·역할 만족을 확인하십시오.', '주간 브리핑과 세계 주보에서 공개 파장을 확인하십시오.'],
    certainty: 'confirmed',
  };
  return {
    state: {
      ...state,
      lastUpdatedWeek: week,
      bonds: nextBonds,
      activeStorylines: state.activeStorylines.filter((candidate) => candidate.id !== storylineId),
      history: [history, ...state.history].slice(0, 24),
      nextStoryWeek: Math.max(state.nextStoryWeek, week + 3),
    },
    staff: nextStaff,
    gameDelta: option.gameDelta,
    event,
    option,
  };
}

export function getStaffNarrativeAtmosphere(state: StaffNarrativeState) {
  if (!state.bonds.length) return { score: 50, label: '관계 형성 중', summary: '공동 업무가 쌓이면 참모 관계가 형성됩니다.' };
  const average = state.bonds.reduce((total, bond) => total + bond.affinity, 0) / state.bonds.length;
  const pressure = state.activeStorylines.reduce((total, story) => total + (story.stage === 'public' ? 10 : story.stage === 'cabinet' ? 5 : 2), 0);
  const score = clamp(average - pressure);
  return score >= 70
    ? { score, label: '한 팀', summary: '참모들이 서로 정보를 공유하고 공동 책임을 받아들이고 있습니다.' }
    : score >= 52
      ? { score, label: '실무적 안정', summary: '업무 관계는 유지되지만 인사·성과 판단에서 균열이 생길 수 있습니다.' }
      : score >= 38
        ? { score, label: '긴장된 내각', summary: '관계 갈등이 결재와 책임 배분에 영향을 주기 시작했습니다.' }
        : { score, label: '분열 직전', summary: '파벌과 공개 갈등이 지도부의 통제력을 위협하고 있습니다.' };
}
