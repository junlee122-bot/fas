import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, CalendarClock, CircleAlert, HeartHandshake, ShieldCheck, WalletCards, X } from 'lucide-react';
import { assessRecruitmentOffer, type RecruitmentOffer } from './recruitment';
import { assessPersonnelAction, assessPersonnelReview, confirmPersonnelReview, createPersonnelReview, createPersonnelReviewGate, isPersonnelReviewSubmitted, type PersonnelContext, type PersonnelReview, type PersonnelReviewGate } from './personnelActions';
import type { StaffCandidate } from './types';
import './RecruitmentNegotiation.css';

export interface RecruitmentNegotiationProps {
  candidate: StaffCandidate;
  offer: RecruitmentOffer;
  politicalPower: number;
  treasury: number;
  reputation: number;
  context?: PersonnelContext;
  busy?: boolean;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onChange: (offer: RecruitmentOffer) => void;
  onClose: () => void;
  onSubmit: () => boolean | void;
}

export interface RecruitmentDeskReview {
  quote: PersonnelReview;
  selection: string;
  candidate: StaffCandidate;
  week: number;
  politicalPower: number;
  treasury: number;
}

const selectionKey = (props: RecruitmentNegotiationProps) => JSON.stringify([props.candidate.id, props.candidate.personId, props.offer]);
const reviewContext = (props: RecruitmentNegotiationProps) => props.context ? { ...props.context, busy: props.busy || props.context.busy } : null;

export function getRecruitmentDeskAvailability(props: RecruitmentNegotiationProps) {
  const context = reviewContext(props);
  if (!context) return { allowed: false as const, reason: '인사 권한과 현재 명부를 연결하지 못했습니다. 조건을 읽을 수 있지만 제출할 수 없습니다.' };
  const liveCandidate = context.candidates.find((entry) => entry.id === props.candidate.id);
  if (!liveCandidate || liveCandidate.personId !== props.candidate.personId) return { allowed: false as const, reason: '선택한 후보가 이동했거나 다른 인물로 바뀌었습니다. 후보 시장에서 다시 선택하십시오.' };
  return assessPersonnelAction(context, { kind: 'recruit', candidateId: props.candidate.id, offer: props.offer });
}

export function createRecruitmentDeskReview(props: RecruitmentNegotiationProps): RecruitmentDeskReview | null {
  const context = reviewContext(props);
  if (!context || !getRecruitmentDeskAvailability(props).allowed) return null;
  const quote = createPersonnelReview(context, { kind: 'recruit', candidateId: props.candidate.id, offer: props.offer });
  return quote ? { quote: structuredClone(quote), selection: selectionKey(props), candidate: structuredClone(quote.assessment.result.candidate), week: context.game.week, politicalPower: context.game.politicalPower, treasury: context.game.treasury } : null;
}

export function assessRecruitmentDeskReview(review: RecruitmentDeskReview, props: RecruitmentNegotiationProps) {
  const context = reviewContext(props);
  if (!context || review.selection !== selectionKey(props)) return { allowed: false as const, reason: '후보 또는 제안 조건이 바뀌었습니다. 비용·인사 영향을 다시 검토하십시오.' };
  const available = getRecruitmentDeskAvailability(props);
  if (!available.allowed) return available;
  return assessPersonnelReview(review.quote, context);
}

export function confirmRecruitmentDeskReview(review: RecruitmentDeskReview, props: RecruitmentNegotiationProps, gate: PersonnelReviewGate) {
  const checked = assessRecruitmentDeskReview(review, props);
  const context = reviewContext(props);
  if (!context || !checked.allowed) return { ok: false, reason: checked.reason, submitted: false };
  const outcome = confirmPersonnelReview(review.quote, context, () => props.onSubmit(), gate);
  return { ...outcome, submitted: isPersonnelReviewSubmitted(review.quote, gate) };
}

/** A callback is not proof of an appointment. Only the live roster/market can confirm it. */
export function getRecruitmentDeskReceipt(review: RecruitmentDeskReview, context?: PersonnelContext) {
  if (!context) return { state: 'waiting' as const, title: '처리 결과 확인 중', detail: '실제 인사 명부가 반영되기 전에는 임명을 확정 표시하지 않습니다.' };
  const result = review.quote.assessment.result;
  const recruitment = result.recruitment!;
  if (recruitment.success) {
    const member = context.staff.find((entry) => entry.id === recruitment.incumbent.id);
    const exact = member?.personId === review.candidate.personId && member.weeklyCost === recruitment.assessment.weeklyCost && member.joinedWeek === review.week;
    if (exact) return { state: 'success' as const, title: `${review.candidate.name} 임명 확인`, detail: `${recruitment.incumbent.name}의 보직을 인계했습니다. 참모 스쿼드에서 새 담당자와 계약을 확인할 수 있습니다.` };
  } else {
    const candidate = context.candidates.find((entry) => entry.id === review.candidate.id && entry.personId === review.candidate.personId);
    const expected = result.updatedCandidate;
    if (candidate && expected && candidate.signingCost === expected.signingCost && candidate.interest === expected.interest && candidate.relationship === expected.relationship && candidate.rivalInterest === expected.rivalInterest) return { state: 'failed' as const, title: '협상 결렬 기록 확인', detail: '정치력 3을 사용했으며 계약금은 지출하지 않았습니다. 기존 참모는 유임하고 후보의 다음 요구 계약금이 올랐습니다.' };
  }
  return { state: 'waiting' as const, title: '처리 결과 확인 중', detail: '제출 요청을 보냈습니다. 실제 인사 명부가 반영되기 전에는 재제출하지 마십시오.' };
}

export function getRecruitmentDeskSummary(review: RecruitmentDeskReview, formatMoney: RecruitmentNegotiationProps['formatMoney']) {
  const result = review.quote.assessment.result;
  const recruitment = result.recruitment!;
  const money = (value: number) => formatMoney(value, { exact: true });
  const offer = review.quote.action.offer!;
  const score = `설득 점수 ${recruitment.assessment.score}/${recruitment.assessment.threshold} · 무작위 확률 판정이 아닙니다.`;
  return recruitment.success ? [
    score,
    `보직 인계: ${recruitment.incumbent.name} → ${review.candidate.name}. 전임자는 후보 시장에서 다시 검토할 수 있습니다.`,
    `정치력 6과 계약금 ${money(recruitment.assessment.signingCost)}를 사용합니다. 계약 임기는 ${offer.termWeeks}주입니다.`,
    `조직 전체 주급: ${money(recruitment.weeklyPayrollBefore)} → ${money(recruitment.weeklyPayrollAfter)}.`,
    '기존 책임 위임과 인물별 면담 기록은 승계하지 않습니다. 새 권한·보직 약속은 이후 주간 만족도에 반영됩니다.',
  ] : [
    score,
    '정치력 3을 사용하고 계약금은 지급하지 않습니다. 기존 담당자는 유임합니다.',
    `관심 ${review.candidate.interest} → ${result.updatedCandidate!.interest} · 관계 ${review.candidate.relationship} → ${result.updatedCandidate!.relationship} · 경쟁 압력 ${review.candidate.rivalInterest} → ${result.updatedCandidate!.rivalInterest}.`,
    `다음 요구 기본 계약금: ${money(review.candidate.signingCost)} → ${money(result.updatedCandidate!.signingCost)}. 다음 제안의 계약금 비율은 이 금액을 기준으로 계산합니다.`,
  ];
}

const authorityChoices = [['advisor', '자문 권한', '조언 중심'], ['executive', '집행 권한', '위임 업무 책임'], ['autonomous', '독립 권한', '넓은 재량 보장']] as const;

export function RecruitmentNegotiation(props: RecruitmentNegotiationProps) {
  const { candidate, offer, formatMoney, onChange, onClose } = props;
  const money = (value: number) => formatMoney(value, { exact: true });
  const titleId = useId();
  const promiseId = useId();
  const [review, setReview] = useState<RecruitmentDeskReview | null>(null);
  const [submitted, setSubmitted] = useState<RecruitmentDeskReview | null>(null);
  const [feedback, setFeedback] = useState('');
  const gate = useRef(createPersonnelReviewGate());
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const editHeading = useRef<HTMLHeadingElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const available = getRecruitmentDeskAvailability(props);
  const liveCandidate = props.context?.candidates.find((entry) => entry.id === candidate.id && entry.personId === candidate.personId) ?? candidate;
  const assessment = assessRecruitmentOffer(liveCandidate, props.context?.reputation ?? props.reputation, offer);
  const liveReview = review ? assessRecruitmentDeskReview(review, props) : null;
  const result = review?.quote.assessment.result;
  const receipt = submitted ? getRecruitmentDeskReceipt(submitted, props.context) : null;
  const incumbent = review?.quote.assessment.result.recruitment?.incumbent ?? props.context?.staff.find((entry) => entry.department === candidate.department);
  const blocked = Boolean(props.busy || props.context?.busy);
  const alreadySubmitted = Boolean(review && isPersonnelReviewSubmitted(review.quote, gate.current));
  useEffect(() => {
    if (submitted) resultHeading.current?.focus();
    else if (review) reviewHeading.current?.focus();
    else editHeading.current?.focus();
  }, [review, submitted]);
  const edit = (next: RecruitmentOffer) => { setReview(null); setFeedback(''); onChange(next); };
  const reopenEditor = () => { setReview(null); setFeedback(''); };

  return <section className="recruitment-desk" aria-labelledby={titleId}>
    <header className="recruitment-desk-header"><HeartHandshake size={26} aria-hidden="true" /><div><span className="recruitment-kicker">APPOINTMENT DESK · 인재 영입</span><h2 id={titleId}>{candidate.name} 임명 조건</h2><p>{candidate.role} · 조건을 조정하거나 검토하는 동안 자원은 사용하지 않습니다.</p></div><button type="button" className="recruitment-close" onClick={onClose} aria-label="협상 작업대 닫기"><X size={20} /></button></header>
    <ol className="recruitment-steps" aria-label="임명 제안 절차"><li aria-current={!review && !submitted ? 'step' : undefined}><b>1</b> 조건 편집</li><li aria-current={review && !submitted ? 'step' : undefined}><b>2</b> 비용·인사 검토</li><li aria-current={submitted ? 'step' : undefined}><b>3</b> 승인·결과 확인</li></ol>
    {receipt ? <section className={`recruitment-receipt ${receipt.state}`} aria-live="polite"><BadgeCheck size={25} /><div><h3 ref={resultHeading} tabIndex={-1}>{receipt.title}</h3><p>{receipt.detail}</p>{submitted && <ul>{getRecruitmentDeskSummary(submitted, formatMoney).map((line) => <li key={line}>{line}</li>)}</ul>}{receipt.state === 'failed' && <p>조건을 새로 검토하려면 작업대를 닫고 이 후보를 다시 선택하십시오. 이전 승인은 재사용할 수 없습니다.</p>}<button type="button" onClick={onClose}>후보 시장으로 돌아가기 <ArrowRight size={15} /></button></div></section> : <>
      <div className="recruitment-identity-row"><span><small>현재 보직 담당자</small><strong>{incumbent?.name ?? '명부 확인 필요'}</strong></span><ArrowRight size={18} /><span><small>새로 임명할 후보</small><strong>{candidate.name}</strong></span><p>성공하면 같은 보직의 기존 담당자를 교체합니다. 인원을 추가하는 영입이 아닙니다.</p></div>
      {!review ? <div className="recruitment-editor-layout"><section className="recruitment-editor" aria-label="제안 조건 편집"><h3 ref={editHeading} tabIndex={-1}>어떤 조건으로 맡기겠습니까?</h3>
        <fieldset disabled={blocked}><legend>맡길 권한</legend><div className="recruitment-option-grid">{authorityChoices.map(([value, label, detail]) => <button key={value} type="button" aria-pressed={offer.authority === value} onClick={() => edit({ ...offer, authority: value })}><strong>{label}</strong><small>{detail}</small></button>)}</div></fieldset>
        <fieldset disabled={blocked}><legend>보장할 임기</legend><div className="recruitment-option-grid">{([52, 104, 156] as const).map((weeks) => <button key={weeks} type="button" aria-pressed={offer.termWeeks === weeks} onClick={() => edit({ ...offer, termWeeks: weeks })}><strong>{weeks / 52}년</strong><small>{weeks}주 계약</small></button>)}</div></fieldset>
        <fieldset disabled={blocked}><legend>보수 · 후보 요구액 기준</legend><div className="recruitment-pay-editor">{(['salaryMultiplier', 'signingMultiplier'] as const).map((field) => <div key={field}><strong>{field === 'salaryMultiplier' ? '매주 지급할 주급' : '한 번 지급할 계약금'}</strong><div className="recruitment-option-grid">{([0.9, 1, 1.15] as const).map((multiplier) => <button key={multiplier} type="button" aria-pressed={offer[field] === multiplier} onClick={() => edit({ ...offer, [field]: multiplier })}>{multiplier === 1 ? '요구액' : multiplier < 1 ? '10% 감액' : '15% 증액'}</button>)}</div></div>)}</div></fieldset>
        <label className="recruitment-promise" htmlFor={promiseId}><strong>보직 약속</strong><select id={promiseId} value={offer.promise} disabled={blocked} onChange={(event) => edit({ ...offer, promise: event.target.value as RecruitmentOffer['promise'] })}><option value="none">추가 약속 없음</option><option value="resources">예산·인력 우선 지원</option><option value="succession">차기 지도부 승계선 보장</option><option value="security">신변·정치적 안전 보장</option></select><small>약속은 임명 계약에 기록됩니다. 자원·승계·안전을 지금 즉시 지급하거나 법적으로 보장하는 행동은 아닙니다.</small></label>
      </section><aside className="recruitment-forecast" aria-label="합의 판단과 비용"><span className="recruitment-kicker">현재 조건의 판단</span><h3 className={assessment.score >= assessment.threshold ? 'ready' : 'risk'}>{assessment.score} <small>/ {assessment.threshold}점</small></h3><strong>{assessment.score >= assessment.threshold ? '합의 기준 충족' : `합의까지 ${assessment.threshold - assessment.score}점 부족`}</strong><p>무작위 확률이 아닙니다. 승인 시 설득 점수가 72점 이상이면 합의하고, 미만이면 결렬됩니다.</p>
        <dl className="recruitment-costs"><div><dt><WalletCards size={15} /> 성공 시 계약금</dt><dd>{money(assessment.signingCost)}</dd></div><div><dt><CalendarClock size={15} /> 새 담당자 주급</dt><dd>{money(assessment.weeklyCost)}</dd></div><div><dt>기존 담당자 주급</dt><dd>{incumbent ? money(incumbent.weeklyCost) : '명부 확인 필요'}</dd></div></dl>
        <details><summary>설득 점수 계산 보기</summary><dl className="recruitment-factors">{assessment.factors.map((factor) => <div key={factor.label}><dt>{factor.label}</dt><dd>{factor.points > 0 ? '+' : ''}{factor.points}</dd></div>)}</dl></details><p className="recruitment-reserve-note">제출 조건: 정치력 6과 계약금 전액을 보유해야 합니다. 검토 중 예약·지출되지는 않습니다. 실패하더라도 정치력 3은 사용합니다.</p>
      </aside></div> : <section className="recruitment-review" aria-label="최종 임명 제안 검토"><header><ShieldCheck size={22} /><div><span className="recruitment-kicker">제{review.week + 1}주 · 승인 전 확인</span><h3 ref={reviewHeading} tabIndex={-1}>{result?.recruitment?.success ? '이 조건이면 임명됩니다' : '이 조건으로는 협상이 결렬됩니다'}</h3></div></header><p>검토 대상은 <strong>{review.candidate.name}</strong>입니다. 아래 내용은 아직 집행하지 않은 결과 예상입니다.</p>
        {result?.recruitment && <><div className="recruitment-review-grid"><article><small>즉시 정치력</small><strong>{review.politicalPower} → {review.politicalPower + result.gameDelta.politicalPower}</strong><p>{result.recruitment.success ? '임명 수속 6 사용' : '협상 비용 3 사용'}</p></article><article><small>즉시 국고</small><strong>{money(review.treasury)} → {money(review.treasury + result.gameDelta.treasury)}</strong><p>{result.recruitment.success ? '계약금 한 번 지급' : '계약금은 지급하지 않음'}</p></article><article><small>조직 전체 주급</small><strong>{money(result.recruitment.weeklyPayrollBefore)} → {money(result.recruitment.weeklyPayrollAfter)}</strong><p>{result.recruitment.success ? `${result.recruitment.incumbent.name} 주급을 새 담당자 주급으로 대체` : '기존 담당자 유임 · 주급 유지'}</p></article></div><ul>{getRecruitmentDeskSummary(review, formatMoney).map((line) => <li key={line}>{line}</li>)}</ul>{!result.recruitment.success && <p className="recruitment-risk-note"><CircleAlert size={18} /> 결렬 시 후보의 기본 요구 계약금이 {money(12)} 오릅니다. 다음 제안에서는 여기에 선택한 계약금 비율이 적용됩니다.</p>}</>}
        <p className="recruitment-reserve-note">최종 승인 때 후보·보직 담당자·인사권·주차·자원을 다시 검사합니다. 검토 이후 바뀌었다면 재검토해야 합니다.</p>
      </section>}
      <div className="recruitment-message" role="status">{feedback || (review && liveReview && !liveReview.allowed ? liveReview.reason : !available.allowed ? available.reason : '아직 제출하지 않았습니다. 비용·인사 검토 후 최종 승인할 수 있습니다.')}</div>
      <footer className="recruitment-desk-footer"><button type="button" onClick={review ? reopenEditor : onClose}>{review ? '조건 편집으로 돌아가기' : '비용 없이 협상 보류'}</button>{review ? <button type="button" className="primary" disabled={!liveReview?.allowed || blocked || alreadySubmitted} onClick={() => { const response = confirmRecruitmentDeskReview(review, props, gate.current); setFeedback(response.reason); if (response.submitted) setSubmitted(review); }}><HeartHandshake size={17} /> {result?.recruitment?.success ? '임명 제안 최종 승인' : '결렬 비용을 확인하고 제출'}</button> : <button type="button" className="primary" disabled={!available.allowed || blocked} onClick={() => { const next = createRecruitmentDeskReview(props); if (next) setReview(next); else setFeedback(getRecruitmentDeskAvailability(props).reason); }}>비용·인사 영향 검토 <ArrowRight size={17} /></button>}</footer>
    </>}
  </section>;
}
