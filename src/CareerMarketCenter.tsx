import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, BadgeCheck, BriefcaseBusiness, Check, Clock3, Eye, Handshake, History,
  Landmark, LockKeyhole, MessageSquareReply, Radio, Search, ShieldAlert, ShieldCheck, UserRoundSearch, X,
} from 'lucide-react';
import { getRole, nations } from './campaign';
import {
  careerAffiliationLabels, careerApproachLabels, careerOfferKindLabels, careerOfferStatusLabels,
  getCareerOfferExplorationCount, getCareerOfferNegotiationCount,
} from './careerMarket';
import type { CareerApproachKind, CareerMarketState, CareerOfferResponse, ForeignCareerOffer } from './careerMarket';
import {
  applyCareerGameDelta, assessCareerDecision, assessCareerReview, confirmCareerReview, createCareerReview,
  createCareerReviewGate, getCareerDecisionReceipt, isCareerReviewSubmitted,
} from './careerDecisions';
import type { CareerDecisionAction, CareerDecisionInput, CareerDecisionResult, CareerDecisionReview, CareerReviewGate } from './careerDecisions';
import { NationFlag } from './NationFlag';
import type { CareerRole, GameState, NationId } from './types';
import { ClandestineCareerCenter } from './ClandestineCareerCenter';
import type { ClandestineIncidentResponse, ClandestineMissionResponse, ClandestinePosture } from './clandestineCareer';
import './CareerMarketCenter.css';

export interface CareerMarketCenterProps {
  state: CareerMarketState;
  currentNationId: NationId;
  role: CareerRole;
  week: number;
  intelNetwork: number;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  canTurnApproach: boolean;
  /** Without the complete live context the desk remains read-only. */
  decisionInput?: CareerDecisionInput;
  initialOfferId?: string | null;
  initialView?: CareerMarketView;
  initialMissionId?: string | null;
  onRespond: (offerId: string, response: CareerOfferResponse) => boolean | void;
  onApproach: (nationId: NationId, kind: CareerApproachKind) => boolean | void;
  onClandestineMissionResponse: (missionId: string, response: ClandestineMissionResponse) => void;
  onClandestineIncidentResponse: (response: ClandestineIncidentResponse) => void;
  onClandestinePostureChange: (posture: ClandestinePosture) => void;
  onClose: () => void;
}

export type CareerMarketView = 'inbox' | 'opportunities' | 'clandestine' | 'history';

const motiveLabels: Record<ForeignCareerOffer['motive'], string> = {
  money: '금전·생활보장', ideology: '이념·정치노선', compromise: '약점·강압',
  ego: '인정·자존심', security: '신변·가족 안전', revenge: '조직에 대한 원한',
};
const autonomyLabels = { limited: '제한적 재량', operational: '작전 재량', independent: '독립 지휘권' };
const responseLabels: Record<Exclude<CareerOfferResponse, 'defer'>, { title: string; detail: string }> = {
  explore: { title: '탐색 회신', detail: '제안당 한 번 · 진위 확인과 노출 증가를 함께 검토' },
  negotiate: { title: '조건 재협상', detail: '제안당 한 번 · 최종 조건과 2주 연장을 검토' },
  accept: { title: '제안 수락', detail: '실제 이적 또는 비밀 소속 전환 내용을 먼저 검토' },
  reject: { title: '명시적 거절', detail: '연락선을 닫을 때 신임·노출·상대 신뢰 확인' },
  report: { title: '현 소속에 보고', detail: '방첩망 제출 후 자원·신임 변화 확인' },
  turn: { title: '포섭 연락망 역이용', detail: '정치력 3 · 상대 연락망을 이용하는 대응 검토' },
};
const resourceLabels: Record<keyof GameState, string> = {
  week: '주차', manpower: '가용 인력', politicalPower: '정치력', fuel: '연료', steel: '강철',
  factories: '군수 공장', stability: '안정도', warSupport: '전쟁 지지도', commandPoints: '지휘력',
  treasury: '국고', victoryScore: '전략 점수', airPower: '항공력', navalPower: '해상력',
  intelNetwork: '정보망', enemyPressure: '적 압력',
};
const signed = (value: number) => (value > 0 ? '+' : '') + Math.round(value * 10) / 10;
const isTransferOffer = (offer: ForeignCareerOffer) => ['official-appointment', 'asylum-and-post', 'government-in-exile'].includes(offer.kind);

export interface CareerDeskReview {
  quote: CareerDecisionReview;
  title: string;
  subject: string;
  summary: string[];
  resources: { label: string; before: string; after: string }[];
  identity: { before: string; after: string } | null;
  acknowledgement: string | null;
  resets: string[];
  preserved: string[];
  currencyNote: string;
}

function liveDecisionInput(props: CareerMarketCenterProps) {
  const input = props.decisionInput;
  if (!input || input.context.career.nationId !== props.currentNationId || input.context.week !== props.week
    || JSON.stringify(input.state) !== JSON.stringify(props.state)) return null;
  return input;
}

export function getCareerDeskAvailability(props: CareerMarketCenterProps, action: CareerDecisionAction) {
  const input = liveDecisionInput(props);
  return input ? assessCareerDecision(input, action) : {
    allowed: false as const,
    reason: '현재 소속·자원·경력 기록을 연결하지 못했습니다. 제안을 읽을 수 있지만 승인할 수 없습니다.',
  };
}

/** Frozen display strings retain the original currency when a transfer changes the app formatter. */
export function createCareerDeskReview(props: CareerMarketCenterProps, action: CareerDecisionAction): CareerDeskReview | null {
  const input = liveDecisionInput(props);
  if (!input) return null;
  const quote = createCareerReview(input, action);
  if (!quote) return null;
  const preview = quote.assessment.preview;
  const money = (value: number) => props.formatMoney(value, { exact: true });
  const resources: CareerDeskReview['resources'] = [];
  const summary: string[] = [];
  const currentNation = nations.find((nation) => nation.id === quote.basis.nationId)!;
  let identity: CareerDeskReview['identity'] = null;
  let acknowledgement: string | null = null;
  let title: string;
  let subject: string;
  const resets: string[] = [];
  const preserved: string[] = [];
  if (preview.kind === 'approach' && action.kind === 'approach') {
    const forecast = preview.approach;
    title = careerApproachLabels[action.approach].title;
    subject = nations.find((nation) => nation.id === action.nationId)?.name ?? action.nationId;
    resources.push({ label: '정치력 · 회신 실패 때도 사용', before: String(quote.basis.politicalPower), after: String(quote.basis.politicalPower - 2) });
    summary.push(
      '정치력 2는 성공·실패와 관계없이 사용합니다. 국고에서 계약금을 지급하지 않습니다.',
      '지도부 신임 ' + signed(Math.max(0, Math.min(100, input.context.career.councilTrust + forecast.trustDelta)) - input.context.career.councilTrust) + ' · 접촉 노출 ' + signed(forecast.exposureDelta) + '. 회신 여부와 무관하게 반영됩니다.',
      '회신 판정 기준 ' + Math.round(forecast.successChance) + '%. 같은 주차·국가·방식은 저장을 다시 불러와도 같은 판정값을 사용합니다. 결과는 승인 이후 확인합니다.',
      '다음 연락은 제 ' + (forecast.nextApproachWeek + 1) + '주부터 가능합니다. 국가나 접촉 방식을 바꾸어도 대기는 유지됩니다.',
      '회신이 오면 받은 제안을 직접 검토합니다. 접근 승인만으로 이적하거나 비밀 계약을 체결하지 않습니다.',
    );
  } else if (preview.kind === 'respond' && action.kind === 'respond') {
    const forecast = preview.response;
    const offer = forecast.offer!;
    title = action.response === 'defer' ? '제안 보류' : responseLabels[action.response].title;
    subject = offer.title;
    const gameAfter = preview.transfer?.nextGame ?? applyCareerGameDelta(input.context.game, forecast.gameDelta);
    const fields = preview.transfer?.resourceChanges.map((entry) => entry.field)
      ?? (Object.keys(forecast.gameDelta) as (keyof GameState)[]);
    for (const field of fields) resources.push({
      label: resourceLabels[field],
      before: field === 'treasury' ? money(input.context.game[field]) : String(Math.round(input.context.game[field] * 10) / 10),
      after: field === 'treasury' ? money(gameAfter[field]) : String(Math.round(gameAfter[field] * 10) / 10),
    });
    if (!fields.length) summary.push('국고·정치력 등 국가 자원은 즉시 변하지 않습니다.');
    const careerBefore = input.context.career;
    const careerAfter = preview.transfer?.nextCareer ?? {
      reputation: Math.max(0, Math.min(100, careerBefore.reputation + forecast.careerDelta.reputation)),
      councilTrust: Math.max(0, Math.min(100, careerBefore.councilTrust + forecast.careerDelta.councilTrust)),
      legacy: Math.max(0, careerBefore.legacy + forecast.careerDelta.legacy),
    };
    summary.push(
      '즉시 정치력 비용 ' + forecast.politicalPowerCost + '. 검토만으로는 비용을 사용하지 않습니다.',
      '평판 ' + careerBefore.reputation + ' → ' + careerAfter.reputation + ' · 신임 ' + careerBefore.councilTrust + ' → ' + careerAfter.councilTrust + ' · 경력 유산 ' + careerBefore.legacy + ' → ' + careerAfter.legacy + ' · 접촉 노출 ' + signed(forecast.exposureDelta) + '.',
    );
    if (action.response === 'explore') summary.push(
      '제안 신뢰도 ' + offer.credibility + ' → ' + Math.min(100, offer.credibility + 8) + ' · 제안 노출 위험 ' + offer.exposureRisk + ' → ' + Math.min(100, offer.exposureRisk + 4) + '. 탐색은 제안당 한 번이며 기한은 연장하지 않습니다.',
    );
    if (action.response === 'negotiate') summary.push(
      '계약금 ' + money(forecast.termsBefore!.signingBonus) + ' → ' + money(forecast.termsAfter!.signingBonus) + '. 아직 계약금을 받지 않습니다.',
      '신변보호 지수 ' + forecast.termsBefore!.protection + ' → ' + forecast.termsAfter!.protection + '. 지수는 탈출 성공 확률이 아닙니다. 실제 보직의 결재 권한은 재협상으로 바뀌지 않습니다.',
      '재협상은 제안당 한 번입니다. 이 수정안이 최종 조건이며 마감을 2주 연장합니다.',
    );
    summary.push('이 제안의 회신 마감: 제 ' + ((forecast.deadlineWeek ?? offer.deadlineWeek) + 1) + '주까지. 다음 주부터 만료됩니다.');
    if (action.response === 'accept') {
      summary.push('받은 제안의 수락에는 추가 확률 판정이 없습니다. 승인하면 표시된 계약을 체결합니다.');
      if (preview.transfer) {
        const plan = preview.transfer;
        identity = { before: currentNation.name + ' · ' + input.context.role.title, after: plan.nextNation.name + ' · ' + plan.nextRole.title };
        acknowledgement = '국가·보직과 운영 자산이 인계되며 기존 참모·부대를 그대로 가져가지 않는다는 점을 확인했습니다.';
        resets.push(...plan.resets);
        preserved.push(...plan.preserved);
        summary.push('계약금 ' + money(offer.terms.signingBonus) + '는 새 소속의 국고 설정에 합산됩니다. 이전 국고에 단순히 더하지 않습니다.',
          '지도부 신임 ' + input.context.career.councilTrust + ' → ' + plan.nextCareer.councilTrust + ' · 경험 ' + input.context.career.experience + ' → ' + plan.nextCareer.experience + '.',
          '공식 보직에는 주간 비밀수당이 지급되지 않습니다.');
      } else {
        identity = { before: currentNation.name + ' · ' + input.context.role.title, after: '현 보직 유지 + ' + nations.find((nation) => nation.id === offer.sourceNationId)?.shortName + ' 비밀 협조' };
        acknowledgement = '현 보직을 유지한 비밀 협조로 신임·노출·발각 위험이 바뀐다는 점을 확인했습니다.';
        summary.push('계약금 ' + money(offer.terms.signingBonus) + '는 승인 즉시 반영합니다.',
          '계약상 주간 비밀수당 ' + money(forecast.weeklyRetainer) + '. 즉시 지급이 아니라 다음 비밀 경력 주간 처리에서 활동 상태·상한에 따라 반영됩니다.');
        if (input.state.clandestine && input.state.clandestine.status !== 'closed') resets.push('기존 비밀 소속의 연락관·임무·작전 자금은 새 계약으로 교체됩니다.');
      }
    }
    if (action.response === 'turn') summary.push('포섭 연락망 역이용 결과를 기록합니다. 외국 보직으로 이적하거나 새로운 비밀 경력·임무를 생성하는 행동은 아닙니다.');
  } else return null;
  return {
    quote, title, subject, summary, resources, identity, acknowledgement, resets, preserved,
    currencyNote: '금액은 검토 시점의 ' + currentNation.shortName + ' 표시 통화 환산액입니다. 이적 후에도 이 검토서의 금액 표기는 바뀌지 않습니다.',
  };
}

export function assessCareerDeskReview(review: CareerDeskReview, props: CareerMarketCenterProps, selection?: CareerDecisionAction) {
  const input = liveDecisionInput(props);
  if (!input || (selection && JSON.stringify(selection) !== JSON.stringify(review.quote.action))) return {
    allowed: false as const, reason: '현재 소속 또는 선택한 대상이 바뀌었습니다. 최신 조건을 다시 검토하십시오.',
  };
  return assessCareerReview(review.quote, input);
}

export function confirmCareerDeskReview(review: CareerDeskReview, props: CareerMarketCenterProps, gate: CareerReviewGate, acknowledged: boolean, selection?: CareerDecisionAction) {
  const input = liveDecisionInput(props);
  const assessment = assessCareerDeskReview(review, props, selection);
  if (!input || !assessment.allowed) return { ok: false, submitted: false, reason: assessment.reason, result: null as CareerDecisionResult | null };
  if (review.acknowledgement && !acknowledged) return { ok: false, submitted: false, reason: '소속 전환의 주요 영향을 확인해야 승인할 수 있습니다.', result: null as CareerDecisionResult | null };
  const captured: { result: CareerDecisionResult | null } = { result: null };
  const outcome = confirmCareerReview(review.quote, input, (result) => {
    captured.result = result;
    const action = review.quote.action;
    return action.kind === 'respond' ? props.onRespond(action.offerId, action.response) : props.onApproach(action.nationId, action.approach);
  }, gate);
  return { ...outcome, submitted: isCareerReviewSubmitted(review.quote, gate), result: captured.result };
}

export function getCareerDeskSelectedOffer(state: CareerMarketState, selectedId: string | null) {
  return state.offers.find((offer) => offer.id === selectedId) ?? null;
}

export function getCareerDeskStatus(confirmed: boolean, feedback: string, connected: boolean) {
  if (confirmed) return '소속·제안·자원에 실제 반영된 것을 확인했습니다. 경력 기록에서 결과를 다시 볼 수 있습니다.';
  return feedback || (!connected ? '경력 기록 연결 필요 · 읽기 전용' : '최고 국가수반(TIER 1)은 통상적인 외국 보직 제안 대상에서 제외됩니다.');
}

function OfferRisk({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const tone = inverse ? value >= 65 ? 'good' : value < 38 ? 'bad' : 'neutral' : value >= 65 ? 'bad' : value < 38 ? 'good' : 'neutral';
  return <div className={'career-offer-risk ' + tone}><span>{label}</span><i aria-hidden="true"><b style={{ width: Math.max(0, Math.min(100, value)) + '%' }} /></i><strong>{Math.round(value)}점</strong></div>;
}

const responseIcons = { explore: Eye, negotiate: Handshake, accept: BadgeCheck, report: ShieldCheck, turn: Search, reject: X };

export function CareerMarketCenter(props: CareerMarketCenterProps) {
  const { state, currentNationId, role, week, intelNetwork, formatMoney, initialOfferId, initialView, initialMissionId, onClose } = props;
  const actionableOffers = useMemo(() => state.offers.filter((offer) => ['pending', 'exploring', 'negotiating'].includes(offer.status) && week <= offer.deadlineWeek), [state.offers, week]);
  const [view, setView] = useState<CareerMarketView>(initialView ?? (state.clandestine?.incident ? 'clandestine' : actionableOffers.length ? 'inbox' : state.clandestine ? 'clandestine' : 'opportunities'));
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(initialOfferId ?? actionableOffers[0]?.id ?? null);
  const [selectedApproachNationId, setSelectedApproachNationId] = useState<NationId>(nations.find((nation) => nation.id !== currentNationId)?.id ?? 'britain');
  const [review, setReview] = useState<CareerDeskReview | null>(null);
  const [submitted, setSubmitted] = useState<{ review: CareerDeskReview; result: CareerDecisionResult | null; message: string } | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [feedback, setFeedback] = useState('');
  const gate = useRef(createCareerReviewGate());
  const dialogRef = useRef<HTMLElement>(null);
  const stageHeading = useRef<HTMLHeadingElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hadStage = useRef(false);
  const lastExternalOffer = useRef(initialOfferId);
  const lastExternalView = useRef(initialView);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const dialog = dialogRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCloseRef.current(); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])'))
        .filter((element) => !element.closest('[inert]') && element.getClientRects().length > 0);
      const first = focusable[0]; const last = focusable.at(-1);
      if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    dialog?.addEventListener('keydown', onKeyDown);
    return () => { dialog?.removeEventListener('keydown', onKeyDown); if (returnFocus?.isConnected) returnFocus.focus(); };
  }, []);

  useEffect(() => {
    if (lastExternalOffer.current === initialOfferId) return;
    lastExternalOffer.current = initialOfferId;
    if (initialOfferId) { setSelectedOfferId(initialOfferId); setView(initialView ?? 'inbox'); setReview(null); setSubmitted(null); setAcknowledged(false); }
  }, [initialOfferId, initialView]);
  useEffect(() => {
    if (lastExternalView.current === initialView) return;
    lastExternalView.current = initialView;
    if (initialView) { setView(initialView); setReview(null); setSubmitted(null); setAcknowledged(false); }
  }, [initialView]);
  useEffect(() => {
    if (review || submitted) stageHeading.current?.focus();
    else if (hadStage.current) {
      const visibleChoice = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('.career-mobile-selector select, .career-desktop-selection button[aria-pressed="true"], .career-market-tabs button[aria-current="page"]') ?? [])
        .find((element) => element.getClientRects().length > 0 && !element.matches(':disabled'));
      visibleChoice?.focus();
    }
    hadStage.current = Boolean(review || submitted);
  }, [review, submitted]);

  const selectedOffer = getCareerDeskSelectedOffer(state, selectedOfferId);
  const selectedNation = nations.find((nation) => nation.id === selectedApproachNationId);
  const dismissed = state.affiliationStatus === 'dismissed' || state.affiliationStatus === 'unattached';
  const approachCooldown = Math.max(0, 2 - (week - state.lastApproachWeek));
  const input = liveDecisionInput(props);
  const assessment = review ? assessCareerDeskReview(review, props) : null;
  const receipt = submitted?.result && input ? getCareerDecisionReceipt(submitted.result, input) : null;
  const money = (value: number) => formatMoney(value, { exact: true });
  const clearStage = () => { setReview(null); setSubmitted(null); setAcknowledged(false); setFeedback(''); };
  const changeView = (next: CareerMarketView) => { clearStage(); setView(next); };
  const selectOffer = (id: string) => { clearStage(); setSelectedOfferId(id || null); };
  const choose = (action: CareerDecisionAction) => {
    const next = createCareerDeskReview(props, action);
    if (next) { setReview(next); setSubmitted(null); setAcknowledged(false); setFeedback(''); }
    else setFeedback(getCareerDeskAvailability(props, action).reason);
  };
  const reviewAvailable = Boolean(assessment?.allowed && review && !isCareerReviewSubmitted(review.quote, gate.current) && (!review.acknowledgement || acknowledged));
  const openResultOffer = () => {
    const id = submitted?.result?.kind === 'approach' ? submitted.result.approachResult.offer?.id : null;
    if (id && state.offers.some((offer) => offer.id === id)) { clearStage(); setSelectedOfferId(id); setView('inbox'); }
  };

  return <div className="career-market-backdrop career-desk-v7">
    <section ref={dialogRef} tabIndex={-1} className="career-market-modal" role="dialog" aria-modal="true" aria-labelledby="career-market-title">
      <header className="career-market-header"><div className="career-market-seal"><BriefcaseBusiness size={25} aria-hidden="true" /></div><div><span className="eyebrow">CAREER & LIAISON · 경력 연락실</span><h1 id="career-market-title">다음 경력을 선택하십시오</h1><p>대상 선택 → 비용·소속 영향 검토 → 승인 → 실제 결과 확인</p></div><button ref={closeRef} type="button" className="icon-button" onClick={onClose} aria-label="국제 경력 시장 닫기"><X size={20} /></button></header>
      <div className="career-market-status"><div><span>현재 신분</span><strong>{careerAffiliationLabels[state.affiliationStatus]}</strong><small>{role.title}</small></div><div><span>답변 가능한 제안</span><strong>{actionableOffers.length}건</strong><small>제 {week + 1}주 기준</small></div><div><span>접촉 노출</span><strong>{Math.round(state.exposure)}점</strong><small>발각 확률이 아닌 위험 지수</small></div><div><span>사용 가능한 정치력</span><strong>{input ? Math.round(input.context.game.politicalPower) : '확인 필요'}</strong><small>직접 접근 2 · 연락망 역이용 3</small></div></div>
      <nav className="career-market-tabs" aria-label="국제 경력 화면">
        <button type="button" aria-current={view === 'inbox' ? 'page' : undefined} className={view === 'inbox' ? 'active' : ''} onClick={() => changeView('inbox')}><Radio size={16} /> 받은 제안 <em>{actionableOffers.length}</em></button>
        <button type="button" aria-current={view === 'opportunities' ? 'page' : undefined} className={view === 'opportunities' ? 'active' : ''} onClick={() => changeView('opportunities')}><UserRoundSearch size={16} /> 직접 접근</button>
        <button type="button" aria-current={view === 'clandestine' ? 'page' : undefined} className={view === 'clandestine' ? 'active' : ''} onClick={() => changeView('clandestine')}><LockKeyhole size={16} /> 비밀 소속{state.clandestine?.incident && <em>!</em>}</button>
        <button type="button" aria-current={view === 'history' ? 'page' : undefined} className={view === 'history' ? 'active' : ''} onClick={() => changeView('history')}><History size={16} /> 경력 기록 <em>{state.history.length}</em></button>
      </nav>

      {submitted ? <section className="career-decision-stage career-decision-receipt" aria-live="polite">
        <div className="career-stage-heading"><BadgeCheck size={26} /><div><span className="eyebrow">승인 후 · 실제 기록 확인</span><h2 ref={stageHeading} tabIndex={-1}>{receipt?.title ?? '실제 반영 확인 중'}</h2><p>{submitted.review.subject}</p></div></div>
        <p>{receipt?.detail ?? submitted.message}</p>
        <div className="career-receipt-checks">{(receipt?.checks ?? [{ label: '현재 소속·제안·자원 연결', confirmed: false }]).map((check) => <span key={check.label}><strong>{check.confirmed ? '확인' : '확인 중'}</strong>{check.label}</span>)}</div>
        {!receipt?.confirmed && <p className="career-decision-warning">실제 저장 상태가 확인되기 전에는 성공으로 표시하지 않습니다. 동일한 요청은 다시 보내지 마십시오.</p>}
        <details className="career-review-summary"><summary>승인한 비용·인계 내용 다시 보기</summary><p>{submitted.review.currencyNote}</p><ul>{submitted.review.summary.map((line) => <li key={line}>{line}</li>)}</ul>{submitted.review.resources.length > 0 && <dl className="career-resource-comparison">{submitted.review.resources.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.before}<ArrowRight size={14} aria-label="에서" />{row.after}</dd></div>)}</dl>}</details>
        <div className="career-decision-buttons">{submitted.result?.kind === 'approach' && submitted.result.approachResult.offer && receipt?.confirmed && <button type="button" className="primary" onClick={openResultOffer}>도착한 제안 직접 검토 <ArrowRight size={16} /></button>}<button type="button" onClick={clearStage}>{submitted.review.quote.action.kind === 'respond' ? '같은 제안으로 돌아가기' : '접근 대상 화면으로 돌아가기'}</button><button type="button" onClick={() => changeView('history')}>경력 기록 보기</button></div>
      </section> : review ? <section className="career-decision-stage" aria-label="국제 경력 최종 검토">
        <div className="career-stage-heading"><ShieldCheck size={26} /><div><span className="eyebrow">제 {review.quote.basis.week + 1}주 · 아직 집행하지 않았습니다</span><h2 ref={stageHeading} tabIndex={-1}>{review.title} 검토</h2><p>{review.subject}</p></div></div>
        {review.identity && <div className="career-transfer-identity"><div><span>현재</span><strong>{review.identity.before}</strong></div><ArrowRight size={20} aria-hidden="true" /><div><span>승인 후</span><strong>{review.identity.after}</strong></div></div>}
        {review.resources.length > 0 && <dl className="career-resource-comparison">{review.resources.map((row) => <div key={row.label}><dt>{row.label}</dt><dd><span>{row.before}</span><ArrowRight size={14} aria-label="에서" /><strong>{row.after}</strong></dd></div>)}</dl>}
        <p className="career-currency-note">{review.currencyNote}</p><ul className="career-review-lines">{review.summary.map((line) => <li key={line}>{line}</li>)}</ul>
        {(review.resets.length > 0 || review.preserved.length > 0) && <div className="career-handover-grid">{review.resets.length > 0 && <article><h3><ShieldAlert size={18} /> 인계·교체되는 항목</h3><ul>{review.resets.map((line) => <li key={line}>{line}</li>)}</ul></article>}{review.preserved.length > 0 && <article><h3><History size={18} /> 이어지는 세계선</h3><ul>{review.preserved.map((line) => <li key={line}>{line}</li>)}</ul></article>}</div>}
        {review.acknowledgement && <label className="career-acknowledgement"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span>{review.acknowledgement}</span></label>}
        <p className="career-decision-status" role="status">{feedback || (assessment && !assessment.allowed ? assessment.reason : '최종 승인 때 주차·소속·보직·자원·제안을 다시 검사합니다. 변경이 있으면 새로 검토해야 합니다.')}</p>
        <div className="career-decision-buttons"><button type="button" onClick={clearStage}>비용 없이 선택으로 돌아가기</button><button type="button" className="primary" disabled={!reviewAvailable} onClick={() => { const outcome = confirmCareerDeskReview(review, props, gate.current, acknowledged); setFeedback(outcome.reason); if (outcome.submitted) setSubmitted({ review, result: outcome.result, message: outcome.reason }); }}><ShieldCheck size={17} /> {review.title} 최종 승인</button></div>
      </section> : view === 'inbox' ? <div className="career-market-workspace">
        <aside className="career-offer-list" aria-label="외국 제안 목록"><label className="career-mobile-selector">검토할 제안<select value={selectedOfferId ?? ''} onChange={(event) => selectOffer(event.target.value)}><option value="">제안을 선택하십시오</option>{state.offers.map((offer) => <option key={offer.id} value={offer.id}>{offer.title} · {careerOfferStatusLabels[offer.status]}</option>)}</select></label><div className="career-desktop-selection">{state.offers.length === 0 ? <div className="career-market-empty"><Radio size={26} /><strong>도착한 제안이 없습니다</strong><p>직접 접근하거나 성과·평판에 따른 연락을 기다릴 수 있습니다.</p></div> : state.offers.map((offer) => <button type="button" key={offer.id} aria-pressed={selectedOfferId === offer.id} className={selectedOfferId === offer.id ? 'active' : ''} onClick={() => selectOffer(offer.id)}><NationFlag nationId={offer.sourceNationId} decorative /><span><strong>{offer.title}</strong><small>{week > offer.deadlineWeek && ['pending', 'exploring', 'negotiating'].includes(offer.status) ? '회신 기한 경과' : careerOfferStatusLabels[offer.status]} · 제 {offer.deadlineWeek + 1}주 마감</small></span></button>)}</div></aside>
        <section className="career-offer-detail">{selectedOffer ? <>
          <div className="career-offer-heading"><NationFlag nationId={selectedOffer.sourceNationId} size="large" decorative /><div><span>{careerOfferKindLabels[selectedOffer.kind]} · {selectedOffer.origin === 'foreign-initiated' ? '상대가 먼저 접근' : '내 접근에 대한 회신'}</span><h2>{selectedOffer.title}</h2><p>{selectedOffer.sender} · {selectedOffer.coverChannel}</p></div><em>{careerOfferStatusLabels[selectedOffer.status]}</em></div>
          <div className="career-offer-contract"><div><span>제안 보직</span><strong>{getRole(selectedOffer.targetRoleId, selectedOffer.sourceNationId).title}</strong><small>{autonomyLabels[selectedOffer.terms.autonomy]} · 제안 권한 지수 {selectedOffer.terms.authority}</small></div><div><span>수락 시 계약금</span><strong>{money(selectedOffer.terms.signingBonus)}</strong><small>{isTransferOffer(selectedOffer) ? '공식 보직 · 정기 비밀수당 없음' : '계약상 주간 비밀수당 ' + money(selectedOffer.terms.weeklyRetainer)}</small></div><div><span>보호·탈출 지원 지수</span><strong>{Math.round(selectedOffer.terms.protection)} / {Math.round(selectedOffer.terms.extraction)}점</strong><small>지원 수준이며 성공 확률이 아닙니다</small></div><div><span>회신 가능한 기한</span><strong>{week > selectedOffer.deadlineWeek ? '마감 경과' : selectedOffer.deadlineWeek === week ? '이번 주까지' : (selectedOffer.deadlineWeek - week) + '주 남음'}</strong><small>제 {selectedOffer.deadlineWeek + 1}주까지</small></div></div>
          <article className="career-offer-letter"><MessageSquareReply size={18} /><div><span>접촉 전문</span><p>{selectedOffer.pitch}</p></div></article>
          <div className="career-offer-demand"><span><LockKeyhole size={15} /> 상대가 요구하는 것</span><strong>{selectedOffer.demand}</strong><p>접근 동기: {motiveLabels[selectedOffer.motive]}. 신뢰 지수는 계약의 장기 안전을 보장하지 않습니다.</p></div>
          <details className="career-offer-intelligence"><summary>위험 지수·장기 결과 자세히 보기</summary><div className="career-offer-risks"><OfferRisk label="제안 노출 위험" value={selectedOffer.exposureRisk} /><OfferRisk label="제안 신뢰" value={selectedOffer.credibility} inverse /><OfferRisk label="통신 보안" value={selectedOffer.secrecy} inverse /></div><p>수락에는 별도의 확률 판정이 없습니다. 위 지수는 위험·정보 수준을 설명합니다.</p><ul className="career-offer-consequences">{selectedOffer.consequencePreview.map((item) => <li key={item}><ArrowRight size={13} />{item}</li>)}</ul></details>
          {['pending', 'exploring', 'negotiating'].includes(selectedOffer.status) ? <><div className="career-action-intro"><h3>어떻게 답하시겠습니까?</h3><p>선택하면 검토서만 열립니다. 최종 승인 전에는 연락·비용이 발생하지 않습니다.</p><small>탐색 {getCareerOfferExplorationCount(selectedOffer)}/1회 · 재협상 {getCareerOfferNegotiationCount(selectedOffer)}/1회</small></div><div className="career-offer-actions">{(['explore', 'negotiate', 'accept', 'report', 'turn', 'reject'] as const).map((response) => { const action: CareerDecisionAction = { kind: 'respond', offerId: selectedOffer.id, response }; const available = getCareerDeskAvailability(props, action); const Icon = responseIcons[response]; return <button key={response} type="button" className={response} disabled={!available.allowed} onClick={() => choose(action)}><Icon size={18} /><span><strong>{responseLabels[response].title}</strong><small>{available.allowed ? responseLabels[response].detail : available.reason}</small></span><ArrowRight size={15} /></button>; })}</div></> : <div className="career-offer-resolved"><Check size={18} />이 제안은 {careerOfferStatusLabels[selectedOffer.status]} 상태로 기록됐습니다. 다른 제안을 자동으로 선택하지 않습니다.</div>}
        </> : <div className="career-market-empty"><BriefcaseBusiness size={30} /><strong>{selectedOfferId ? '선택한 제안을 찾을 수 없습니다' : '검토할 제안을 선택하십시오'}</strong><p>{selectedOfferId ? '다른 제안으로 자동 이동하지 않았습니다. 목록에서 직접 선택하십시오.' : '받은 제안을 비교하거나 직접 접근에서 새 연락을 시작할 수 있습니다.'}</p><button type="button" onClick={() => changeView('opportunities')}>직접 접근 살펴보기</button></div>}</section>
      </div> : view === 'opportunities' ? <div className="career-opportunity-workspace">
        <aside className="career-nation-list"><label className="career-mobile-selector">접근할 국가<select value={selectedApproachNationId} onChange={(event) => { clearStage(); setSelectedApproachNationId(event.target.value as NationId); }}>{nations.filter((nation) => nation.id !== currentNationId).map((nation) => <option key={nation.id} value={nation.id}>{nation.name}</option>)}</select></label><div className="career-desktop-selection">{nations.filter((nation) => nation.id !== currentNationId).map((nation) => <button type="button" key={nation.id} className={selectedApproachNationId === nation.id ? 'active' : ''} aria-pressed={selectedApproachNationId === nation.id} onClick={() => { clearStage(); setSelectedApproachNationId(nation.id); }}><NationFlag nationId={nation.id} decorative /><span><strong>{nation.shortName}</strong><small>{nation.status === 'sovereign' ? '주권국' : nation.status === 'government-in-exile' ? '망명정부' : '독립·저항 조직'}</small></span></button>)}</div></aside>
        <section className="career-approach-detail">{selectedNation && selectedNation.id !== currentNationId ? <><header><NationFlag nationId={selectedNation.id} size="large" decorative /><div><span>접근 대상</span><h2>{selectedNation.name}</h2><p>{selectedNation.summary}</p></div></header>{!dismissed && <div className="career-market-warning"><ShieldAlert size={18} /><span><strong>현재 보직을 유지한 외부 접촉</strong><small>회신이 없어도 지도부 신임과 노출이 바뀝니다. 구체적인 비용·위험은 검토서에 표시합니다.</small></span></div>}{approachCooldown > 0 && <div className="career-market-cooldown"><Clock3 size={17} />다음 연락까지 {approachCooldown}주 · 국가·방식 변경으로 단축되지 않습니다.</div>}<div className="career-action-intro"><h3>어떤 방식으로 접근하겠습니까?</h3><p>정치력 2를 사용합니다. 응답을 받는 것과 계약 수락은 별개의 결정입니다.</p></div><div className="career-approach-grid">{(Object.keys(careerApproachLabels) as CareerApproachKind[]).map((kind) => { const action: CareerDecisionAction = { kind: 'approach', nationId: selectedNation.id, approach: kind }; const available = getCareerDeskAvailability(props, action); return <button type="button" key={kind} disabled={!available.allowed} onClick={() => choose(action)}>{kind === 'apply' ? <BriefcaseBusiness size={18} /> : kind === 'request-asylum' ? <Landmark size={18} /> : kind === 'appeal' ? <Handshake size={18} /> : <LockKeyhole size={18} />}<span><strong>{careerApproachLabels[kind].title}</strong><small>{available.allowed ? careerApproachLabels[kind].detail : available.reason}</small></span><ArrowRight size={15} /></button>; })}</div><footer><p>지원 → 회신 → 조건 검토 → 계약 승인 → 소속 인계. 회신이 오지 않은 연락도 경력 기록에 남습니다.</p></footer></> : <div className="career-market-empty"><strong>외국을 직접 선택하십시오</strong><p>소속이 바뀐 뒤 이전 접근 대상을 다른 국가로 자동 교체하지 않습니다.</p></div>}</section>
      </div> : view === 'history' ? <div className="career-market-history">{state.history.length === 0 ? <div className="career-market-empty"><History size={28} /><strong>아직 국제 경력 기록이 없습니다</strong><p>제안 탐색·재협상·접근 실패를 포함한 실제 처리 결과가 이곳에 남습니다.</p></div> : state.history.map((record) => <article key={record.id}><NationFlag nationId={record.nationId} decorative /><time>제 {record.week + 1}주</time><div><strong>{record.title}</strong><p>{record.detail}</p></div><em>{record.outcome === 'approach-failed' ? '접촉 실패' : careerOfferStatusLabels[record.outcome]}</em></article>)}</div> : <ClandestineCareerCenter state={state.clandestine} role={role} week={week} intelNetwork={intelNetwork} exposure={state.exposure} formatMoney={formatMoney} initialMissionId={initialMissionId} onMissionResponse={props.onClandestineMissionResponse} onIncidentResponse={props.onClandestineIncidentResponse} onPostureChange={props.onClandestinePostureChange} />}
      <footer className="career-market-footer"><span role="status"><ShieldCheck size={15} />{getCareerDeskStatus(Boolean(receipt?.confirmed), feedback, Boolean(input))}</span><button type="button" onClick={onClose}>경력실 닫기</button></footer>
    </section>
  </div>;
}
