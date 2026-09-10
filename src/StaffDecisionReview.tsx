import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRightLeft, BadgeCheck, Check, ClipboardCheck, ShieldAlert, X } from 'lucide-react';
import {
  assessStaffDecision, assessStaffReview, confirmStaffReview, createStaffReview,
  createStaffReviewGate, getStaffDecisionReceipt, isStaffReviewSubmitted,
} from './staffDecisions';
import type { StaffDecisionAction, StaffDecisionInput, StaffDecisionResult } from './staffDecisions';
import { getStaffContractWeeks, getStaffMorale, getStaffRoleSatisfaction } from './staffManagement';
import { getStaffSeatTitle } from './staffOrganization';
import './StaffDecisionReview.css';

export const staffDecisionLabels: Record<StaffDecisionAction['kind'], string> = {
  promote: '참모 승급', renew: '계약 연장', assign: '보직 재배치',
};

type StaffQuote = NonNullable<ReturnType<typeof createStaffReview>>;
type StaffGate = ReturnType<typeof createStaffReviewGate>;
type MoneyFormatter = (value: number, options?: { signed?: boolean; exact?: boolean }) => string;

export interface StaffDeskContext {
  input: StaffDecisionInput | null;
  formatMoney: MoneyFormatter;
  onUpgradeStaff: (staffId: string) => boolean | void;
  onRenewStaff: (staffId: string) => boolean | void;
  onAssignStaff: (staffId: string, department: Extract<StaffDecisionAction, { kind: 'assign' }>['department']) => boolean | void;
}

interface StaffDeskMetric { label: string; before: string; after: string }
export interface StaffDeskReview {
  quote: StaffQuote;
  title: string;
  subject: string;
  cost: string;
  metrics: StaffDeskMetric[];
  people: {
    id: string; name: string; from: string; to: string;
    metrics: StaffDeskMetric[]; additionalMetrics: StaffDeskMetric[]; promiseBefore: string; promiseAfter: string;
  }[];
  focus: string;
  acknowledgement: string | null;
  currencyNote: string;
}

export function getStaffDeskAvailability(input: StaffDecisionInput | null, action: StaffDecisionAction) {
  return input ? assessStaffDecision(input, action) : {
    allowed: false as const, reason: '인사·국고 기록을 연결하지 못했습니다. 열람은 가능하지만 승급·계약·배치를 승인할 수 없습니다.',
  };
}

export function getStaffDeskReceiptHeading(status: ReturnType<typeof getStaffDecisionReceipt>['status'] | undefined) {
  if (status === 'confirmed') return '실제 참모·자원·육성 기록과 일치합니다.';
  if (status === 'changed') return '승인 이후 현재 상태가 달라졌습니다.';
  return '전달 성공만으로 완료 처리하지 않습니다.';
}

/** Format once: a later currency reform must not silently rewrite an already reviewed cost. */
export function createStaffDeskReview(context: StaffDeskContext, action: StaffDecisionAction): StaffDeskReview | null {
  if (!context.input) return null;
  const quote = createStaffReview(context.input, action);
  if (!quote) return null;
  const input = context.input;
  const result = quote.assessment.result;
  const money = (value: number) => context.formatMoney(value, { exact: true });
  const seat = (department: StaffDecisionResult['memberBefore']['department']) => getStaffSeatTitle(department, input.campaignPhase, input.nationStatus);
  const number = (value: number) => String(Math.round(value * 100) / 100);
  const primaryLabels = action.kind === 'assign' ? ['보직 적합도', '책임 위임', '충성 / 사기 / 역할 만족']
    : action.kind === 'renew' ? ['주급', '잔여 계약', '충성 / 사기 / 역할 만족']
      : ['성장 등급 · 3단계', '성장도', '능력 / 잠재력', '주급', '충성 / 사기 / 역할 만족'];
  const people = result.changes.map(({ before, after, fitBefore, fitAfter, promiseBefore, promiseAfter }) => ({
    id: before.personId, name: before.name, from: seat(before.department), to: seat(after.department),
    metrics: [
      { label: '보직 적합도', before: `${fitBefore.score} · ${fitBefore.label}`, after: `${fitAfter.score} · ${fitAfter.label}` },
      { label: '성장 등급 · 3단계', before: `${before.grade}/3`, after: `${after.grade}/3` },
      { label: '성장도', before: number(before.development) + '%', after: number(after.development) + '%' },
      { label: '능력 / 잠재력', before: `${before.ability} / ${before.potential}`, after: `${after.ability} / ${after.potential}` },
      { label: '주급', before: money(before.weeklyCost), after: money(after.weeklyCost) },
      { label: '잔여 계약', before: `${getStaffContractWeeks(before)}주`, after: `${getStaffContractWeeks(after)}주` },
      { label: '책임 위임', before: before.delegated ? '위임 중' : '직접 결재', after: after.delegated ? '위임 중' : '직접 결재' },
      { label: '충성 / 사기 / 역할 만족', before: `${number(before.loyalty)} / ${getStaffMorale(before)} / ${getStaffRoleSatisfaction(before)}`, after: `${number(after.loyalty)} / ${getStaffMorale(after)} / ${getStaffRoleSatisfaction(after)}` },
    ],
    promiseBefore: `${promiseBefore.label} · ${promiseBefore.summary}`,
    promiseAfter: `${promiseAfter.label} · ${promiseAfter.summary}`,
  })).map((person) => ({ ...person, metrics: person.metrics.filter((metric) => primaryLabels.includes(metric.label)),
    additionalMetrics: person.metrics.filter((metric) => !primaryLabels.includes(metric.label)) }));
  const focusName = (id: string | null, roster: StaffDecisionInput['staff']) => id ? roster.find((member) => member.id === id)?.name ?? '기록 확인 필요' : '지정 없음';
  return {
    quote, title: staffDecisionLabels[action.kind], subject: result.memberBefore.name,
    cost: `정치력 ${result.cost.politicalPower} · 국고 ${money(result.cost.treasury)}`,
    metrics: [
      { label: '즉시 국고', before: money(input.game.treasury), after: money(result.gameAfter.treasury) },
      { label: '즉시 정치력', before: number(input.game.politicalPower), after: number(result.gameAfter.politicalPower) },
      { label: '전체 참모 주급 · 다음 주부터', before: money(result.weeklyPayrollBefore), after: money(result.weeklyPayrollAfter) },
    ],
    people,
    focus: `${focusName(input.developmentFocusId, input.staff)} → ${focusName(result.developmentFocusAfter, result.staffAfter)}`,
    acknowledgement: action.kind === 'assign' ? '이동하는 모든 인물의 보직·위임·육성 대상·임명 약속 변화를 확인했습니다.' : null,
    currencyNote: '금액은 검토 시점의 표시 통화로 고정했습니다. 통화 개혁이나 소속 변경 후에도 이 검토서의 표기는 바뀌지 않습니다.',
  };
}

export function assessStaffDeskReview(review: StaffDeskReview, context: StaffDeskContext, selection?: StaffDecisionAction) {
  if (!context.input || (selection && JSON.stringify(selection) !== JSON.stringify(review.quote.action))) return {
    allowed: false as const, reason: '선택한 인물·보직 또는 인사 기록이 바뀌었습니다. 최신 상태에서 다시 검토하십시오.',
  };
  return assessStaffReview(review.quote, context.input);
}

export function confirmStaffDeskReview(review: StaffDeskReview, context: StaffDeskContext, gate: StaffGate, acknowledged: boolean, selection?: StaffDecisionAction) {
  const assessment = assessStaffDeskReview(review, context, selection);
  if (!context.input || !assessment.allowed) return { ok: false, submitted: false, reason: assessment.reason, result: null as StaffDecisionResult | null };
  if (review.acknowledgement && !acknowledged) return {
    ok: false, submitted: false, reason: '보직 이동이 모든 당사자에게 미치는 영향을 확인해야 승인할 수 있습니다.', result: null as StaffDecisionResult | null,
  };
  const captured: { result: StaffDecisionResult | null } = { result: null };
  const outcome = confirmStaffReview(review.quote, context.input, (result) => {
    captured.result = result;
    const action = review.quote.action;
    if (action.kind === 'assign') return context.onAssignStaff(action.staffId, action.department);
    if (action.kind === 'renew') return context.onRenewStaff(action.staffId);
    return context.onUpgradeStaff(action.staffId);
  }, gate);
  return { ...outcome, submitted: isStaffReviewSubmitted(review.quote, gate), result: captured.result };
}

function Metrics({ entries }: { entries: StaffDeskMetric[] }) {
  return <dl className="staff-review-metrics">{entries.map((entry) => <div key={entry.label}>
    <dt>{entry.label}</dt><dd><span><small>검토 당시</small>{entry.before}</span><span><small>승인 후</small>{entry.after}</span></dd>
  </div>)}</dl>;
}

interface StaffDecisionReviewProps {
  review: StaffDeskReview;
  context: StaffDeskContext;
  gate: StaffGate;
  onClose: () => void;
}

export function StaffDecisionReview({ review, context, gate, onClose }: StaffDecisionReviewProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitted, setSubmitted] = useState<{ result: StaffDecisionResult | null; message: string } | null>(null);
  const [feedback, setFeedback] = useState('');
  const headingId = useId();
  const section = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const assessment = assessStaffDeskReview(review, context);
  const receipt = submitted?.result && context.input ? getStaffDecisionReceipt(submitted.result, context.input) : null;
  const isSubmitted = isStaffReviewSubmitted(review.quote, gate);
  const available = !submitted && !isSubmitted && assessment.allowed && (!review.acknowledgement || acknowledged);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    // Scroll the complete header into view; targeting h4 hides its eyebrow and close
    // control above the nested deck viewport, underneath the crisis ribbon.
    section.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [submitted]);

  return <section ref={section} className={`staff-decision-review ${submitted ? 'is-receipt' : ''}`} aria-labelledby={headingId}>
    <header><div><span className="staff-review-eyebrow">{submitted ? 'APPROVAL RECORD · 실제 반영 확인' : 'STAFF DECISION · 인사 검토서'}</span>
      <h4 id={headingId} ref={heading} tabIndex={-1}>{submitted ? receipt?.title ?? '인사 처리 기록 확인 필요' : `${review.subject} · ${review.title}`}</h4></div>
      <button type="button" onClick={onClose} aria-label="인사 검토서 닫기"><X size={18} /></button></header>
    {submitted ? <div className={`staff-review-receipt ${receipt?.confirmed ? 'confirmed' : 'pending'}`} role="status">
      {receipt?.confirmed ? <BadgeCheck size={24} /> : <ShieldAlert size={24} />}
      <div><strong>{getStaffDeskReceiptHeading(receipt?.status)}</strong>
        <p>{receipt?.detail ?? submitted.message}</p>
        {receipt?.status === 'pending' && <p>{submitted.message}</p>}
        {receipt && <ul>{receipt.checks.map((check) => <li key={check.label}>{receipt.status === 'changed' ? check.confirmed ? '현재도 일치' : '이후 변경' : check.confirmed ? '확인' : '미확인'} · {check.label}</li>)}</ul>}
        {receipt?.status === 'changed' ? <p>아래 검토서는 당시 승인 내용입니다. 최신 참모 명부와 결산에서 이후 변화를 확인하십시오.</p> : !receipt?.confirmed && <p>현재 상태를 확인한 뒤 검토서를 닫으십시오. 같은 승인 요청은 다시 보내지 않습니다.</p>}
      </div>
    </div> : <p className="staff-review-intro">대상 선택 → 조건 검토 → 최종 승인 → 실제 반영 확인. 검토·취소는 무료이며 승인할 때만 비용을 사용합니다.</p>}
    <div className="staff-review-cost"><ClipboardCheck size={19} /><span><small>{submitted ? '승인 요청의 비용' : '이번 승인에 사용할 비용'}</small><strong>{review.cost}</strong></span></div>
    <Metrics entries={review.metrics} />
    <div className="staff-review-people">{review.people.map((person) => <article key={person.id}>
      <header><strong>{person.name}</strong><span>{person.from}<ArrowRightLeft size={15} aria-hidden="true" />{person.to}</span></header>
      <Metrics entries={person.metrics} />
      <details className="staff-review-additional"><summary>추가 상태 비교</summary><Metrics entries={person.additionalMetrics} /></details>
      <details className="staff-review-promises" open={review.quote.action.kind === 'assign'}><summary>임명 약속의 변화</summary><p><strong>현재</strong> {person.promiseBefore}</p><p><strong>승인 후</strong> {person.promiseAfter}</p></details>
    </article>)}</div>
    <p className="staff-review-focus"><strong>육성 대상</strong> {review.focus}</p>
    <ul className="staff-review-summary">{review.quote.assessment.result.summary.map((line, index) => <li key={index}>{line}</li>)}</ul>
    {review.quote.action.kind === 'promote' && <p>참모의 성장 등급은 3단계입니다. 시작 보직의 별 5단계·국가 인사권과는 다르며, 승급만으로 새 보직이나 결재 권한을 얻지 않습니다.</p>}
    {review.quote.action.kind === 'renew' && <p>현재 남은 계약을 없애지 않고 104주를 더합니다. 보너스는 지금 한 번 지급하며, 표시된 새 주급은 이후 주간 결산에 반영됩니다.</p>}
    {review.quote.assessment.result.warnings.length > 0 && <div className="staff-review-warnings"><strong><ShieldAlert size={17} /> 승인 전 유의 사항</strong><ul>{review.quote.assessment.result.warnings.map((line, index) => <li key={index}>{line}</li>)}</ul></div>}
    <small className="staff-review-currency-note">{review.currencyNote}</small>
    {!submitted && !assessment.allowed && <p className="staff-review-warnings" role="status">{assessment.reason} 조건이 바뀌었으므로 검토서를 닫고 다시 선택하십시오.</p>}
    {!submitted && feedback && <p role="status" className="staff-review-warnings">{feedback}</p>}
    {!submitted && review.acknowledgement && <label className="staff-review-acknowledgement"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span>{review.acknowledgement}</span></label>}
    <footer><button type="button" onClick={onClose}>{submitted ? '참모 관리로 돌아가기' : '검토 취소 · 무료'}</button>
      {!submitted && <button type="button" className="primary" disabled={!available} onClick={() => {
        const outcome = confirmStaffDeskReview(review, context, gate, acknowledged);
        setFeedback(outcome.reason);
        if (outcome.submitted) setSubmitted({ result: outcome.result, message: outcome.reason });
      }}><Check size={17} />{isSubmitted ? '이미 전달한 승인' : `${review.title} 최종 승인`}</button>}
    </footer>
  </section>;
}
