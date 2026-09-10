import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, Gavel, ScrollText } from 'lucide-react';
import {
  activateConstitutionalFounding, canNominateJudicialOffice, constitutionAxisLabels, constitutionClauses,
  getConstitutionContradictions, getConstitutionDraftProgress, getVacantJudicialOffices,
  isJudicialOfficeConstitutionallyEnabled, judicialOffices, nominateJudicialCandidate, ratificationMethods,
  ratifyConstitution, resolveJudicialNomination, selectConstitutionClause,
  type ConstitutionAxis, type ConstitutionalActionResult, type ConstitutionalContext,
  type ConstitutionalJudiciaryState, type JudicialOfficeId, type NominationDecisionId, type RatificationMethodId,
} from './constitutionalJudiciary';
import './ConstitutionalJudiciaryBoard.css';

export type ConstitutionalJudiciaryView = 'draft' | 'appointments' | 'procedure' | 'records';
export interface ConstitutionalJudiciaryBoardProps {
  compact?: boolean; state: ConstitutionalJudiciaryState; context: ConstitutionalContext;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onActivate: () => void; onClauseSelect: (clauseId: string) => void;
  onRatify: (methodId: RatificationMethodId) => void;
  onNominate: (officeId: JudicialOfficeId, candidateId: string) => void;
  onNominationDecision: (decisionId: NominationDecisionId) => void;
  busy?: boolean; initialView?: ConstitutionalJudiciaryView;
  nationalIndicators?: { unrest: number; justiceIndependence: number; justiceIntegrity: number };
}
export type ConstitutionalOrder = { kind: 'activate' } | { kind: 'clause'; id: string }
  | { kind: 'ratify'; id: RatificationMethodId }
  | { kind: 'nominate'; officeId: JudicialOfficeId; candidateId: string }
  | { kind: 'decision'; id: NominationDecisionId };
export type ConstitutionalReviewInput = Pick<ConstitutionalJudiciaryBoardProps, 'state' | 'context' | 'busy' | 'nationalIndicators'>;
export interface ConstitutionalApprovalGate { lastFingerprint: string | null; lastNominationKey?: string | null }
type ConstitutionalCallbacks = Pick<ConstitutionalJudiciaryBoardProps, 'onActivate' | 'onClauseSelect' | 'onRatify' | 'onNominate' | 'onNominationDecision'>;
export interface ConstitutionalReview {
  order: ConstitutionalOrder; fingerprint: string; title: string; timing: string;
  politicalCost: number; treasuryCost: number; politicalPowerAfter: number; treasuryAfter: number;
  nextReviewWeek: number | null; result: ConstitutionalActionResult;
  changes: { label: string; before: number; after: number }[];
  contributions: { label: string; value: number; before?: number; after?: number }[];
}
const axes = Object.keys(constitutionAxisLabels) as ConstitutionAxis[];
const metrics = [['courtIndependence', '법원 독립'], ['prosecutorialAutonomy', '검찰 자율'], ['judicialCapacity', '사법 역량'], ['rightsProtection', '기본권 보호'], ['executiveConstraint', '행정부 견제']] as const;
const contributionFields = [['stabilityDelta', '안정도'], ['legitimacyDelta', '정통성'], ['unrestDelta', '사회 불안'], ['institutionalCapacityDelta', '제도 역량'], ['publicConfidenceDelta', '공공 신뢰'], ['justiceIndependenceDelta', '국정 사법 독립'], ['justiceIntegrityDelta', '국정 사법 청렴']] as const;
const decisions: { id: NominationDecisionId; name: string; detail: string }[] = [
  { id: 'confirm', name: '인준·임명', detail: '청문 지지도 50 이상 · 정치력 2 · 승인 즉시 임기 시작' },
  { id: 'return-vetting', name: '보강검증', detail: '정치력 3 · 국고 4 · 검증 2주 후 청문 1주가 다시 필요' },
  { id: 'withdraw', name: '지명 철회', detail: '추가 지출 없음 · 공석 유지 · 지지도에 따른 신뢰·정통성 변화' },
  { id: 'force-through', name: '임명 강행', detail: '1급 권한 · 정치력 8 · 지지도 문턱 없이 즉시 임명, 불안·독립성 위험' },
];
const philosophyLabels = { 'rights-oriented': '권리·적법절차', institutionalist: '법적 안정성', 'security-oriented': '국가안보', 'social-justice': '사회권·평등', 'executive-loyalist': '행정 효율', 'anti-corruption': '반부패·공직윤리' };
const numberFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });
const amount = (value: number) => Number.isFinite(value) ? numberFormat.format(value) : '확인 필요';
const signed = (value: number) => `${value >= 0 ? '+' : ''}${amount(value)}`;
const fingerprint = (input: ConstitutionalReviewInput, order: ConstitutionalOrder) => JSON.stringify([input.state, input.context, input.nationalIndicators, order]);
const finiteNumbers = (value: unknown): boolean => typeof value === 'number' ? Number.isFinite(value) : value !== null && typeof value === 'object' ? Object.values(value).every(finiteNumbers) : true;

/** A valid explicit selection remains selected after approval; fallback only covers a missing item. */
export function resolveConstitutionClauseChoice(state: ConstitutionalJudiciaryState, axis: ConstitutionAxis, selectedId?: string) {
  return constitutionClauses.find((item) => item.axis === axis && item.id === selectedId)
    ?? constitutionClauses.find((item) => item.axis === axis && item.id === (state.enacted?.clauses[axis] ?? state.draft[axis]))
    ?? constitutionClauses.find((item) => item.axis === axis)!;
}
export function resolveJudicialCandidateChoice(state: ConstitutionalJudiciaryState, selectedId?: string) {
  return state.candidates.find((candidate) => candidate.id === selectedId) ?? state.candidates[0];
}
export function resolveJudicialOfficeChoice(state: ConstitutionalJudiciaryState, week: number, selectedId?: JudicialOfficeId) {
  return judicialOffices.find((office) => office.id === selectedId) ?? getVacantJudicialOffices(state, week)[0] ?? judicialOffices[0];
}

/** Uses the existing action engine as a read-only quote. No state or resource writes occur here. */
export function createConstitutionalReview(input: ConstitutionalReviewInput, order: ConstitutionalOrder): { review: ConstitutionalReview | null; reason: string } {
  const { state, context } = input;
  const blocked = (reason: string) => ({ review: null, reason });
  if (input.busy) return blocked('주간 진행 중입니다. 결산이 끝난 뒤 검토하세요.');
  if (!context.role || !Number.isInteger(context.role.tier) || context.role.tier < 1 || context.role.tier > 5) return blocked('현재 보직의 직급을 확인할 수 없습니다. 1–5급의 유효한 보직 정보가 필요합니다.');
  if (!finiteNumbers([state, context, input.nationalIndicators]) || !Number.isSafeInteger(context.week) || context.week < 0) return blocked('현재 주차·자원·헌정 정보를 확인할 수 없습니다.');
  if (state.nationId !== context.nationId || context.role.nationId !== context.nationId) return blocked('현재 국가와 헌정·보직 정보가 일치하지 않습니다. 최신 상태를 확인하세요.');
  if (axes.some((axis) => state.draft[axis] && !constitutionClauses.some((clause) => clause.axis === axis && clause.id === state.draft[axis]))) return blocked('초안에 확인할 수 없는 조항이 있습니다. 저장된 헌정 정보를 확인하세요.');
  let result: ConstitutionalActionResult | null = null;
  let title = ''; let timing = '';
  if (order.kind === 'activate') {
    if (state.status !== 'awaiting-authority') return blocked('이미 제헌 초안 작성이 열려 있습니다.');
    if (context.role.tier !== 1) return blocked('제헌권에는 국가 최고위 1급 보직이 필요합니다.');
    result = activateConstitutionalFounding(state, context);
    title = '제헌 초안 작성 개시'; timing = '추가 비용 없이 즉시 초안 작성이 열립니다. 최고위 보직 도달 시에도 자동으로 개시됩니다.';
  } else if (order.kind === 'clause') {
    const clause = constitutionClauses.find((item) => item.id === order.id);
    if (!clause) return blocked('등록된 헌법 조항을 선택하세요.');
    if (state.status !== 'drafting') return blocked(state.status === 'enacted' ? '이미 공포된 헌법입니다. 현재 화면에서는 개헌을 집행하지 않습니다.' : '아직 제헌 초안 작성이 열리지 않았습니다.');
    if (context.role.tier !== 1) return blocked('초안 채택·수정에는 국가 최고위 1급 권한이 필요합니다.');
    if (state.draft[clause.axis] === clause.id) return blocked('이미 초안에 채택한 조항입니다. 다시 비용을 지출하지 않습니다.');
    if (context.politicalPower < 1) return blocked('조항 채택·수정에는 정치력 1이 필요합니다.');
    result = selectConstitutionClause(state, clause.id, context);
    title = `${clause.name} 초안 채택`; timing = '정치력 1을 지출하고 해당 장의 초안을 즉시 바꿉니다. 조항의 제도·권리 계수는 헌법 비준 시 함께 계산되며 지금 지표를 올리지 않습니다.';
  } else if (order.kind === 'ratify') {
    const method = ratificationMethods.find((item) => item.id === order.id);
    if (!method) return blocked('등록된 비준 방식을 선택하세요.');
    if (state.status !== 'drafting') return blocked('작성 중인 초안만 비준할 수 있습니다.');
    if (context.role.tier !== 1) return blocked('헌법 비준에는 국가 최고위 1급 권한이 필요합니다.');
    if (getConstitutionDraftProgress(state) !== axes.length) return blocked(`일곱 장의 초안을 모두 작성해야 합니다. 현재 ${getConstitutionDraftProgress(state)}/7장입니다.`);
    if (method.id === 'royal-assent' && state.draft.government !== 'constitutional-crown') return blocked('왕실·의회 공동 선서는 헌법상 군주 조항이 필요합니다.');
    if (method.id === 'party-congress' && !['peoples-congress', 'council-directorate'].includes(state.draft.government ?? '')) return blocked('대표대회 승인은 인민대표대회 또는 평의회 권력구조가 필요합니다.');
    if (context.politicalPower < method.politicalCost || context.treasury < method.treasuryCost) return blocked('선택한 비준 방식에 필요한 정치력 또는 국고가 부족합니다.');
    result = ratifyConstitution(state, method.id, context);
    title = `${method.name} · 헌법 비준`; timing = '승인 즉시 헌법 공포·정부형태·헌정 지표를 반영합니다. 별도 투표 대기 주차나 지지도 통과 문턱은 없습니다. 조항 충돌은 비준을 막지 않지만 결과에 반영됩니다.';
  } else if (order.kind === 'nominate') {
    const office = judicialOffices.find((item) => item.id === order.officeId);
    const candidate = state.candidates.find((item) => item.id === order.candidateId);
    if (!office || !candidate || candidate.nationId !== context.nationId) return blocked('현재 국가의 등록된 보직과 후보를 선택하세요.');
    if (state.activeNomination) return blocked('진행 중인 인사 절차가 있습니다. 절차 진행에서 먼저 처리하세요.');
    if (!isJudicialOfficeConstitutionallyEnabled(state, office.id)) return blocked('현재 헌법에 이 기관이 설치되어 있지 않습니다.');
    if (!getVacantJudicialOffices(state, context.week).some((item) => item.id === office.id)) return blocked('현직의 임기가 남아 있습니다. 임기 종료 뒤 후임 지명이 열립니다.');
    const authority = canNominateJudicialOffice(office, context);
    if (!authority.allowed) return blocked(authority.reason);
    result = nominateJudicialCandidate(state, office.id, candidate.id, context);
    title = `${office.name} 후보 지명 · ${candidate.name}`; timing = `승인 시 지명 비용을 한 번 지출합니다. 제 ${context.week + 3}주에 검증 공개, 이어서 한 주 뒤 청문을 마치고 인준을 기다립니다. 지명은 즉시 임명이 아닙니다.`;
  } else {
    if (!decisions.some((item) => item.id === order.id)) return blocked('등록된 인사 결정을 선택하세요.');
    const nomination = state.activeNomination;
    if (!nomination || nomination.stage !== 'confirmation') return blocked('검증과 공개 청문을 마친 인준 대기 단계에서 결정할 수 있습니다.');
    const office = judicialOffices.find((item) => item.id === nomination.officeId);
    const candidate = state.candidates.find((item) => item.id === nomination.candidateId);
    if (!office || !candidate || candidate.nationId !== context.nationId) return blocked('진행 중인 보직·후보 정보를 확인할 수 없습니다.');
    if (context.role.tier > office.minimumTier) return blocked(`${office.minimumTier}급 이내 인준 권한이 필요합니다.`);
    if (order.id === 'confirm' && nomination.hearingSupport < 50) return blocked('일반 인준에는 청문 지지도 50 이상이 필요합니다.');
    if (order.id === 'force-through' && context.role.tier !== 1) return blocked('임명 강행에는 국가 최고위 1급 권한이 필요합니다.');
    result = resolveJudicialNomination(state, order.id, context);
    title = `${candidate.name} · ${decisions.find((item) => item.id === order.id)!.name}`;
    timing = order.id === 'return-vetting' ? `승인 즉시 보강검증으로 돌아갑니다. 제 ${context.week + 3}주에 다시 검증을 공개하며, 청문 1주를 더 거친 뒤 인준합니다.`
      : order.id === 'withdraw' ? '승인 즉시 지명을 철회하고 공석을 유지합니다. 이전 지명 비용은 환급되지 않습니다.'
        : `승인 즉시 임명되며 ${office.termWeeks}주 임기가 시작됩니다. 다음 주를 기다리지 않습니다.`;
  }
  if (!result) return blocked('현재 권한·자원·절차 조건을 충족하지 않습니다. 필요한 비용과 단계를 확인하세요.');
  const politicalCost = Math.max(0, -result.politicalPowerDelta);
  const treasuryCost = Math.max(0, -result.treasuryDelta);
  if (context.politicalPower < politicalCost || context.treasury < treasuryCost) return blocked(`승인에는 정치력 ${politicalCost}와 선택한 작업의 국고 비용이 필요합니다. 현재 잔액이 부족합니다.`);
  const indicatorValues: Partial<Record<(typeof contributionFields)[number][0], number>> = {
    stabilityDelta: context.stability, legitimacyDelta: context.legitimacy,
    institutionalCapacityDelta: context.institutionalCapacity, publicConfidenceDelta: context.publicConfidence,
    ...(input.nationalIndicators ? { unrestDelta: input.nationalIndicators.unrest, justiceIndependenceDelta: input.nationalIndicators.justiceIndependence, justiceIntegrityDelta: input.nationalIndicators.justiceIntegrity } : {}),
  };
  return { review: {
    order: { ...order }, fingerprint: fingerprint(input, order), title, timing, politicalCost, treasuryCost,
    politicalPowerAfter: context.politicalPower + result.politicalPowerDelta, treasuryAfter: context.treasury + result.treasuryDelta,
    nextReviewWeek: result.state.activeNomination?.nextReviewWeek ?? null, result,
    changes: metrics.map(([key, label]) => ({ label, before: state[key], after: result.state[key] })).filter((change) => change.before !== change.after),
    contributions: contributionFields.map(([key, label]) => {
      const before = indicatorValues[key];
      return { label, value: result[key], ...(before === undefined ? {} : { before, after: Math.max(0, Math.min(100, before + result[key])) }) };
    }).filter((change) => change.value !== 0),
  }, reason: '아직 승인하지 않았습니다. 비용·결과·확인 시점을 검토하세요.' };
}

export function confirmConstitutionalReview(review: ConstitutionalReview, input: ConstitutionalReviewInput, callbacks: ConstitutionalCallbacks, gate: ConstitutionalApprovalGate): { status: 'sent' | 'stale' | 'blocked' | 'uncertain'; reason: string } {
  if (input.busy) return { status: 'blocked', reason: '주간 진행 중입니다. 결산이 끝난 뒤 승인하세요.' };
  if (review.fingerprint !== fingerprint(input, review.order)) return { status: 'stale', reason: '검토 후 주차·국가·권한·자원 또는 헌정 상태가 바뀌었습니다. 최신 조건으로 다시 검토하세요.' };
  if (gate.lastFingerprint === review.fingerprint) return { status: 'blocked', reason: '같은 검토안의 요청을 이미 전달했습니다. 실제 기록에서 반영 결과를 확인하세요.' };
  const current = createConstitutionalReview(input, review.order);
  if (!current.review) return { status: 'blocked', reason: current.reason };
  // All alternatives consume the same nomination decision round. Resource-only changes do not
  // reopen it; actual re-vetting/next-review progression creates a new round for the same id.
  const nominationKey = review.order.kind === 'decision'
    ? JSON.stringify([input.context.nationId, input.state.activeNomination?.id, input.state.activeNomination]) : null;
  if (nominationKey && gate.lastNominationKey === nominationKey) return { status: 'blocked', reason: '이 인사안의 결정을 이미 전달했습니다. 다른 결정도 실제 절차 기록이 갱신된 뒤 검토하세요.' };
  gate.lastFingerprint = review.fingerprint;
  if (nominationKey) gate.lastNominationKey = nominationKey;
  try {
    switch (review.order.kind) {
      case 'activate': callbacks.onActivate(); break;
      case 'clause': callbacks.onClauseSelect(review.order.id); break;
      case 'ratify': callbacks.onRatify(review.order.id); break;
      case 'nominate': callbacks.onNominate(review.order.officeId, review.order.candidateId); break;
      case 'decision': callbacks.onNominationDecision(review.order.id); break;
    }
  } catch {
    return { status: 'uncertain', reason: '요청 전달 중 문제가 발생했습니다. 중복 승인하지 말고 실제 초안·인사 기록과 잔액을 확인하세요.' };
  }
  return { status: 'sent', reason: '요청을 전달했습니다. 실제 초안·헌법·인사 기록과 잔액에서 반영 결과를 확인하세요.' };
}

function Costs({ politicalCost, treasuryCost, context, formatMoney }: { politicalCost: number; treasuryCost: number; context: ConstitutionalContext; formatMoney: ConstitutionalJudiciaryBoardProps['formatMoney'] }) {
  return <dl className="cj-kpis"><div><dt>승인 시 국고 지출</dt><dd>{formatMoney(treasuryCost, { exact: true })}</dd><small>현재 {formatMoney(context.treasury, { exact: true })} · 지출 후 {formatMoney(context.treasury - treasuryCost, { exact: true })}</small></div><div><dt>승인 시 정치력</dt><dd>{politicalCost}</dd><small>현재 {amount(context.politicalPower)} · 지출 후 {amount(context.politicalPower - politicalCost)}</small></div></dl>;
}

export function ConstitutionalJudiciaryBoard({ compact = false, state, context, formatMoney, onActivate, onClauseSelect, onRatify, onNominate, onNominationDecision, busy = false, initialView = 'draft', nationalIndicators }: ConstitutionalJudiciaryBoardProps) {
  const [view, setView] = useState<ConstitutionalJudiciaryView>(initialView);
  const [axis, setAxis] = useState<ConstitutionAxis>('government');
  const [clauseChoices, setClauseChoices] = useState(() => Object.fromEntries(axes.map((item) => [item, resolveConstitutionClauseChoice(state, item).id])) as Record<ConstitutionAxis, string>);
  const [officeId, setOfficeId] = useState<JudicialOfficeId>(() => resolveJudicialOfficeChoice(state, context.week).id);
  const [candidateId, setCandidateId] = useState(() => resolveJudicialCandidateChoice(state)?.id ?? '');
  const [methodId, setMethodId] = useState<RatificationMethodId>('constituent-assembly');
  const [decisionId, setDecisionId] = useState<NominationDecisionId>('confirm');
  const [procedureChoice, setProcedureChoice] = useState<'nomination' | 'ratification'>(() => state.activeNomination ? 'nomination' : 'ratification');
  const [recordId, setRecordId] = useState(() => state.history[0]?.id ?? '');
  const [review, setReview] = useState<ConstitutionalReview | null>(null);
  const [message, setMessage] = useState('');
  const gate = useRef<ConstitutionalApprovalGate>({ lastFingerprint: null });
  const reviewRef = useRef<HTMLElement | null>(null);
  const statusRef = useRef<HTMLParagraphElement | null>(null);
  const focusStatus = useRef(false);
  const contentId = useId();
  useEffect(() => {
    if (review) reviewRef.current?.focus();
    else if (focusStatus.current) { focusStatus.current = false; statusRef.current?.focus(); }
  }, [review]);
  const clause = resolveConstitutionClauseChoice(state, axis, clauseChoices[axis]);
  const office = resolveJudicialOfficeChoice(state, context.week, officeId);
  const candidate = resolveJudicialCandidateChoice(state, candidateId);
  const incumbent = state.appointments.find((item) => item.officeId === office.id && item.termEndWeek > context.week);
  const method = ratificationMethods.find((item) => item.id === methodId)!;
  const decision = decisions.find((item) => item.id === decisionId)!;
  const progress = getConstitutionDraftProgress(state);
  const contradictions = getConstitutionContradictions(state.draft);
  const nomination = state.activeNomination;
  const nominationCandidate = state.candidates.find((item) => item.id === nomination?.candidateId);
  const nominationOffice = judicialOffices.find((item) => item.id === nomination?.officeId);
  const record = state.history.find((item) => item.id === recordId) ?? state.history[0];
  const input = { state, context, busy, nationalIndicators };
  const showNomination = Boolean(nomination && (procedureChoice === 'nomination' || state.status !== 'drafting'));
  const clauseOrder: ConstitutionalOrder = { kind: 'clause', id: clause.id };
  const nominationOrder: ConstitutionalOrder | null = candidate ? { kind: 'nominate', officeId: office.id, candidateId: candidate.id } : null;
  const activeOrder: ConstitutionalOrder | null = view === 'draft' ? state.status === 'awaiting-authority' ? { kind: 'activate' } : clauseOrder
    : view === 'appointments' ? nominationOrder : view === 'procedure' ? showNomination ? { kind: 'decision', id: decisionId } : { kind: 'ratify', id: methodId } : null;
  const proposed = activeOrder ? createConstitutionalReview(input, activeOrder) : null;
  const stale = Boolean(review && review.fingerprint !== fingerprint(input, review.order));
  const clearReview = () => { setReview(null); setMessage(''); };
  const changeView = (next: ConstitutionalJudiciaryView) => { setView(next); clearReview(); };
  const openProcedure = (choice: 'nomination' | 'ratification') => { setProcedureChoice(choice); changeView('procedure'); };
  const requestReview = (order: ConstitutionalOrder) => { const next = createConstitutionalReview(input, order); setReview(next.review); setMessage(next.reason); };
  const approve = () => {
    if (!review) return;
    const outcome = confirmConstitutionalReview(review, input, { onActivate, onClauseSelect, onRatify, onNominate, onNominationDecision }, gate.current);
    setMessage(`${review.title} · ${outcome.reason}`);
    if (outcome.status === 'sent' || outcome.status === 'uncertain') {
      if (review.order.kind === 'nominate') setProcedureChoice('nomination');
      focusStatus.current = true; setReview(null);
    }
  };
  const reviewButton = (label: string) => <><p className={proposed?.review ? 'cj-meta' : 'cj-warning'}>{proposed?.reason}</p><div className="cj-actions"><button type="button" className="cj-primary" disabled={!proposed?.review || busy} onClick={() => activeOrder && requestReview(activeOrder)}>{label}</button></div></>;

  return <section className={`nation-surface constitutional-judiciary-board ce5-constitution ${compact ? 'compact' : ''}`}>
    <header className="cj-heading"><div><span className="cj-eyebrow"><ScrollText size={18} /> CONSTITUTION & JUDICIARY</span><h3>헌정·사법 집무실</h3><p>초안과 후보를 살펴보고, 비용과 절차를 검토한 뒤 승인하세요. 목록 선택만으로는 정치력이나 국고를 쓰지 않습니다.</p></div><div className="cj-status"><strong>{state.status === 'enacted' ? '헌법 시행 중' : state.status === 'drafting' ? `초안 ${progress}/7장` : '제헌권 대기'}</strong><small>제 {context.week + 1}주 · {context.role.title} · {context.role.tier}급</small><small>{formatMoney(context.treasury)} · 정치력 {amount(context.politicalPower)}</small></div></header>
    {nomination ? <div className="cj-callout"><strong>{nominationOffice?.name ?? '인사 절차'} · {nominationCandidate?.name ?? '후보 정보 확인 필요'}</strong><p>{nomination.stage === 'confirmation' ? '청문을 마쳤습니다. 인준·재검증·철회 중 다음 결정을 검토하세요.' : `진행 단계: ${nomination.stage === 'vetting' ? '신원·재산 검증' : '공개 청문'} · 제 ${nomination.nextReviewWeek + 1}주 주간 결산에서 다음 단계 확인`}</p>{view !== 'procedure' ? <div className="cj-actions"><button type="button" onClick={() => openProcedure('nomination')}>진행 중인 절차 보기 <ArrowRight size={16} /></button></div> : null}</div> : null}
    <nav className="cj-workviews" aria-label="헌정·사법 작업보기">{([['draft', '헌법 초안'], ['appointments', '사법 인사'], ['procedure', '절차 진행'], ['records', '기록']] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={view === id} aria-controls={contentId} onClick={() => changeView(id)}>{label}</button>)}</nav>
    {busy ? <p className="cj-warning" role="status">주간 진행 중 · 열람은 가능하며 검토·승인은 결산 뒤 다시 열립니다.</p> : null}
    {message ? <p className="cj-result" role="status" ref={statusRef} tabIndex={-1}>{message}</p> : null}
    {review ? <section className="cj-review" aria-label="헌정·사법 승인 검토" tabIndex={-1} ref={reviewRef}><span className="cj-eyebrow">REVIEW / 미집행 검토안</span><h4>{review.title}</h4><Costs politicalCost={review.politicalCost} treasuryCost={review.treasuryCost} context={{ ...context, politicalPower: review.politicalPowerAfter + review.politicalCost, treasury: review.treasuryAfter + review.treasuryCost }} formatMoney={formatMoney} /><p>{review.timing}</p>
      {review.changes.length ? <><h5>승인 시 헌정 지표 예상</h5><ul className="cj-changes">{review.changes.map((change) => <li key={change.label}>{change.label} {amount(change.before)} → {amount(change.after)}</li>)}</ul></> : <p className="cj-meta">이 승인은 현재 헌정 지표를 직접 바꾸지 않습니다.</p>}
      {review.contributions.length ? <><h5>승인 시 국정 지표 예상</h5><p className="cj-meta">전후값에는 0–100 경계값을 적용했습니다. 다른 주간 변화는 포함하지 않습니다.{review.contributions.some((change) => change.before === undefined) ? ' 현재 값이 없는 항목은 상한 적용 전 명목 기여분만 표시합니다.' : ''}</p><ul className="cj-changes">{review.contributions.map((change) => <li key={change.label}>{change.label} {change.before !== undefined && change.after !== undefined ? <>{amount(change.before)} → {amount(change.after)} · 실제 변화 {signed(change.after - change.before)}<small> · 명목 기여 {signed(change.value)}</small></> : <>명목 {signed(change.value)} · 최종 경계값 적용 전</>}</li>)}</ul></> : null}
      {review.order.kind === 'ratify' && review.result.state.enacted ? <p>공포 시 예상 지지 {review.result.state.enacted.publicSupport}/100 · 미해결 조항 충돌 {review.result.state.enacted.contradictions.length}건</p> : null}
      <p className="cj-meta">검토는 집행하지 않습니다. 승인 요청 후 실제 기록과 잔액에서 반영 여부를 확인하세요.</p>{stale ? <p className="cj-warning">검토 후 주차·국가·권한·자원 또는 헌정 상태가 바뀌었습니다. 다시 검토하세요.</p> : null}<div className="cj-actions"><button type="button" className="cj-primary" disabled={stale || busy} onClick={approve}>작업 승인</button>{stale ? <button type="button" disabled={busy} onClick={() => requestReview(review.order)}>최신 조건으로 다시 검토</button> : null}<button type="button" onClick={clearReview}>검토 닫기</button></div>
    </section> : null}
    <div id={contentId}>
      {view === 'draft' ? <section className="cj-panel" aria-label="헌법 초안 작업"><span className="cj-eyebrow">DRAFT / 일곱 장의 헌정 선택</span><h4>{state.status === 'enacted' ? '공포된 헌법 열람' : '헌법 초안 검토'}</h4>
        {state.status === 'awaiting-authority' ? <><p>초안 작성·수정·비준에는 국가 최고위 1급 권한이 필요합니다. 최고위 보직에 도달하면 제헌 초안 작성이 자동으로 열립니다. 사법 인사는 보직별 인사권에 따라 별도로 검토할 수 있습니다.</p>{reviewButton('제헌 개시 검토')}</> : null}
        {state.enacted ? <div className="cj-callout"><strong>{state.enacted.name}</strong><p>제 {state.enacted.enactedWeek + 1}주 공포 · 지지 {state.enacted.publicSupport}/100</p><small>헌법에 기록된 개헌 요건: {state.enacted.amendmentThreshold}. 현재 화면에는 개헌 집행 기능이 없습니다.</small></div> : null}
        <div className="cj-split"><label className="cj-select">검토할 장<select value={axis} onChange={(event) => { setAxis(event.target.value as ConstitutionAxis); clearReview(); }}>{axes.map((item, index) => <option key={item} value={item}>제 {index + 1}장 · {constitutionAxisLabels[item].name}{state.draft[item] ? ' · 초안 있음' : ''}</option>)}</select></label><label className="cj-select">조항 선택 · 열람은 무료<select value={clause.id} onChange={(event) => { setClauseChoices((previous) => ({ ...previous, [axis]: event.target.value })); clearReview(); }}>{constitutionClauses.filter((item) => item.axis === axis).map((item) => <option key={item.id} value={item.id}>{item.name}{(state.enacted?.clauses[axis] ?? state.draft[axis]) === item.id ? ' · 현재 채택' : ''}</option>)}</select></label></div>
        <article className="cj-detail"><span className="cj-meta">{constitutionAxisLabels[axis].question}</span><h5>{clause.name}</h5><p>{clause.summary}</p><p><strong>구성 기관</strong> · {clause.institution}</p><dl className="cj-kpis"><div><dt>강점</dt><dd>{clause.strength}</dd></div><div><dt>위험</dt><dd>{clause.risk}</dd></div></dl><p className="cj-meta">비준 산식의 조항 계수 · 법원 {signed(clause.independence)} · 권리 {signed(clause.rights)} · 행정부 {signed(clause.executive)} · 안정 {signed(clause.stability)} · 정통성 {signed(clause.legitimacy)}. 이 수치가 지금 그대로 가산되는 것은 아닙니다.</p>{(state.enacted?.clauses[axis] ?? state.draft[axis]) === clause.id ? <p className="cj-complete">현재 채택된 조항입니다. 다른 조항은 위 목록에서 직접 선택하세요.</p> : null}</article>
        {state.status === 'drafting' ? <><p>채택·수정 승인마다 정치력 1을 사용합니다. 비준 전에는 변경할 수 있으며, 현재 선택만으로는 초안을 수정하지 않습니다.</p>{reviewButton('조항 채택 비용 검토')}<div className="cj-actions"><button type="button" onClick={() => openProcedure('ratification')}>비준 조건과 절차 보기 <ArrowRight size={16} /></button></div></> : null}
        {contradictions.length ? <details className="cj-fold"><summary>현재 초안의 조항 충돌 {contradictions.length}건</summary>{contradictions.map((warning) => <p key={warning}>{warning}</p>)}</details> : null}
      </section> : null}
      {view === 'appointments' ? <section className="cj-panel" aria-label="사법 인사 검토"><span className="cj-eyebrow"><Gavel size={16} /> PERSONNEL / 한 보직 · 한 후보</span><h4>사법 인사 검토</h4><p>인사권·공석·헌법상 기관 설치 여부를 확인하세요. 후보는 게임 속 가상 법조인이며 실제 역사 인물의 약력이 아닙니다.</p>
        <label className="cj-select">검토할 보직<select value={office.id} onChange={(event) => { setOfficeId(event.target.value as JudicialOfficeId); clearReview(); }}>{judicialOffices.map((item) => <option key={item.id} value={item.id}>{item.name}{!isJudicialOfficeConstitutionallyEnabled(state, item.id) ? ' · 헌법상 미설치' : state.appointments.some((current) => current.officeId === item.id && current.termEndWeek > context.week) ? ' · 현직 있음' : ' · 공석'}</option>)}</select></label>
        <article className="cj-detail"><h5>{office.name}</h5><p>{office.scope}</p><p className="cj-meta">{office.minimumTier}급 이내 인사권 · 임기 {office.termWeeks}주 · {office.branch === 'judge' ? '법원' : '검찰'}</p>{incumbent ? <><strong>현직 · {incumbent.candidateName}</strong><p>제 {incumbent.appointedWeek + 1}주 임명 · 제 {incumbent.termEndWeek + 1}주 임기 종료 · {incumbent.termEndWeek - context.week}주 남음</p><p className="cj-meta">인준 지지 {incumbent.confirmationSupport} · 독립 {incumbent.independence} · 청렴 {incumbent.integrity} · 전문성 {incumbent.competence}</p><p>임기 종료 뒤 후임을 지명할 수 있습니다. 이 화면에서 현직을 중도 해임하지 않습니다.</p></> : <p>{isJudicialOfficeConstitutionallyEnabled(state, office.id) ? '현재 공석' : '현재 헌법에 설치되지 않은 기관입니다.'}</p>}</article>
        {candidate ? <><label className="cj-select">후보 선택 · 열람은 무료<select value={candidate.id} onChange={(event) => { setCandidateId(event.target.value); clearReview(); }}>{state.candidates.map((item) => <option value={item.id} key={item.id}>{item.name} · {philosophyLabels[item.philosophy]}</option>)}</select></label><article className="cj-detail"><span className="cj-meta">가상 법조인 · {candidate.school}</span><h5>{candidate.name}</h5><p>{candidate.profile}</p><dl className="cj-kpis">{([['전문성', candidate.competence], ['청렴', candidate.integrity], ['독립', candidate.independence], ['경험', candidate.experience], ['공공 신뢰', candidate.publicTrust], ['연정 지지', candidate.coalitionSupport], ['안보 우려', candidate.securityConcern]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}/100</dd></div>)}</dl><p className="cj-warning">검증 쟁점 · {candidate.disclosure}</p></article><Costs politicalCost={office.politicalCost} treasuryCost={office.treasuryCost} context={context} formatMoney={formatMoney} /><p>지명 승인 시 비용을 지출하고 검증 2주 → 청문 1주 → 인준 결정을 거칩니다. 후보 선택은 지명이 아닙니다.</p>{reviewButton('지명 비용과 절차 검토')}</> : <p className="cj-warning">확인할 수 있는 후보가 없습니다.</p>}
        {nomination ? <div className="cj-actions"><button type="button" onClick={() => openProcedure('nomination')}>진행 중인 인사 처리</button></div> : null}
      </section> : null}
      {view === 'procedure' ? <section className="cj-panel" aria-label="헌정·사법 절차 진행"><span className="cj-eyebrow">PROCEDURE / 확인 시점과 승인 조건</span><h4>{showNomination ? '인사 절차 진행' : '헌법 비준 절차'}</h4>
        {nomination && state.status === 'drafting' ? <label className="cj-select">검토할 절차<select value={showNomination ? 'nomination' : 'ratification'} onChange={(event) => { setProcedureChoice(event.target.value as 'nomination' | 'ratification'); clearReview(); }}><option value="nomination">진행 중인 사법 인사</option><option value="ratification">헌법 비준</option></select></label> : null}
        {showNomination && nomination ? <><ol className="cj-steps" aria-label="인사 단계">{([['vetting', '1 · 신원·재산 검증'], ['hearing', '2 · 공개 청문'], ['confirmation', '3 · 인준·임명']] as const).map(([id, label]) => <li key={id} aria-current={nomination.stage === id ? 'step' : undefined}>{label}</li>)}</ol><article className="cj-detail"><h5>{nominationOffice?.name ?? '보직 확인 필요'} · {nominationCandidate?.name ?? '후보 확인 필요'}</h5><p>{nominationCandidate?.profile}</p><p className="cj-meta">가상 법조인 · 제 {nomination.openedWeek + 1}주 지명</p><dl className="cj-kpis"><div><dt>검증 점수</dt><dd>{nomination.vettingScore}/100</dd></div><div><dt>청문 지지도</dt><dd>{nomination.hearingSupport}/100</dd></div></dl><p className="cj-warning">{nomination.concern}</p></article>
          <ul className="cj-requirements"><li>{nominationOffice?.minimumTier ?? '?'}급 이내 인준 권한 · 현재 {context.role.tier}급</li><li>일반 인준: 청문 지지도 50 이상, 정치력 2</li><li>강행: 국가 최고위 1급, 정치력 8 · 안정·신뢰·독립성 불이익</li><li>철회·보강검증을 포함한 최종 결정은 인준 대기 단계에서 가능</li></ul>
          {nomination.stage !== 'confirmation' ? <p className="cj-callout">제 {nomination.nextReviewWeek + 1}주 주간 결산에서 {nomination.stage === 'vetting' ? '검증 공개 후 청문 시작' : '청문 종료 후 인준 대기'}를 확인하세요. {nomination.stage === 'vetting' ? '청문은 그다음 한 주가 더 필요합니다.' : ''} 열람만으로 시간이 진행되거나 임명되지 않습니다.</p> : <><label className="cj-select">검토할 결정<select value={decisionId} onChange={(event) => { setDecisionId(event.target.value as NominationDecisionId); clearReview(); }}>{decisions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><p>{decision.id === 'return-vetting' ? `정치력 3 · ${formatMoney(4)} · 검증 2주와 청문 1주를 다시 거칩니다.` : decision.detail}</p>{reviewButton('인사 결정과 결과 검토')}</>}
        </> : state.status === 'drafting' ? <><p>현재 초안 {progress}/7장 · 1급 비준 권한 · 선택한 방식의 비용이 필요합니다. 지지 수치는 결과에 반영되지만 별도 통과 문턱은 없습니다.</p><ul className="cj-requirements">{axes.map((item) => <li key={item}>{constitutionAxisLabels[item].name} · {constitutionClauses.find((entry) => entry.id === state.draft[item])?.name ?? '미작성'}</li>)}</ul><label className="cj-select">비준 방식 선택<select value={methodId} onChange={(event) => { setMethodId(event.target.value as RatificationMethodId); clearReview(); }}>{ratificationMethods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><article className="cj-detail"><h5>{method.name}</h5><p>{method.detail}</p><p className="cj-warning">{method.risk}</p><Costs politicalCost={method.politicalCost} treasuryCost={method.treasuryCost} context={context} formatMoney={formatMoney} /><p>비준은 승인 즉시 공포되며 별도 투표 대기 주차는 없습니다.</p></article>{contradictions.length ? <div className="cj-callout"><strong>조항 충돌 {contradictions.length}건 · 비준을 막지는 않음</strong>{contradictions.map((warning) => <p key={warning}>{warning}</p>)}</div> : null}{reviewButton('비준 비용과 결과 검토')}</> : <><p>{state.status === 'enacted' ? '헌법은 이미 공포되었습니다. 현재 진행 중인 인사 절차가 없습니다.' : '아직 제헌 초안 작성이 열리지 않았으며 진행 중인 인사 절차도 없습니다.'}</p><div className="cj-actions"><button type="button" onClick={() => changeView('draft')}>헌법 열람</button><button type="button" onClick={() => changeView('appointments')}>사법 인사 검토</button></div></>}
        {nomination && state.status === 'drafting' ? <p className="cj-meta">헌법 초안 {progress}/7장도 보관되어 있습니다. 위 절차 선택에서 인사 진행과 헌법 비준을 각각 검토할 수 있습니다.</p> : null}
      </section> : null}
      {view === 'records' ? <section className="cj-panel" aria-label="헌정·사법 기록"><span className="cj-eyebrow">RECORDS / 실제 반영된 상태</span><h4>헌정·사법 기록</h4><dl className="cj-kpis">{metrics.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{amount(state[key])}/100</dd></div>)}</dl>{state.enacted ? <article className="cj-detail"><h5>{state.enacted.name}</h5><p>제 {state.enacted.enactedWeek + 1}주 공포 · {ratificationMethods.find((item) => item.id === state.enacted?.ratificationMethodId)?.name} · 지지 {state.enacted.publicSupport}/100</p><p>기록된 개헌 요건: {state.enacted.amendmentThreshold}</p>{state.enacted.contradictions.map((warning) => <p className="cj-warning" key={warning}>{warning}</p>)}<div className="cj-actions"><button type="button" onClick={() => changeView('draft')}>공포 조항 열람</button></div></article> : <p>아직 공포된 헌법이 없습니다.</p>}
        {record ? <><label className="cj-select">열람할 기록<select value={record.id} onChange={(event) => setRecordId(event.target.value)}>{state.history.map((item, index) => <option key={`${item.id}-${index}`} value={item.id}>제 {item.week + 1}주 · {item.title}</option>)}</select></label><article className="cj-detail"><span className="cj-meta">제 {record.week + 1}주 · 실제 기록</span><h5>{record.title}</h5><p>{record.detail}</p></article><p className="cj-meta">현재 저장된 기록 {state.history.length}건을 열람합니다. 미승인 전망은 기록에 추가하지 않습니다.</p></> : <p>아직 헌정·사법 인사 기록이 없습니다. 미승인 전망은 기록에 추가하지 않습니다.</p>}
      </section> : null}
    </div>
  </section>;
}
