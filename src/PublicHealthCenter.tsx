import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, BookOpenCheck, ExternalLink, HeartPulse } from 'lucide-react';
import { HealthMeter } from './HealthMeter';
import { advancePublicHealthWeek, applyPublicHealthInvestment, calculateWeeklyOutbreakRisk, canFundPublicHealthInvestment, formatOutbreakPhase, getOutbreakRiskBreakdown, getOutbreakTemplate, getPublicHealthPolicy, outbreakTemplates, publicHealthInvestments, publicHealthPolicies, recommendPublicHealthPolicy } from './publicHealth';
import type { PublicHealthContext, PublicHealthInvestmentId, PublicHealthPolicyId, PublicHealthState } from './publicHealth';
import type { GameState } from './types';
import './PublicHealthCenter.css';

export type PublicHealthView = 'overview' | 'policy' | 'investments' | 'records';
export interface PublicHealthCenterProps {
  state: PublicHealthState; game: GameState; context: PublicHealthContext;
  onPolicyChange: (policyId: PublicHealthPolicyId) => void;
  onInvestment: (investmentId: PublicHealthInvestmentId) => void;
  busy?: boolean; initialView?: PublicHealthView; formatMoney?: (value: number) => string;
}
export type PublicHealthOrder = { kind: 'policy'; id: PublicHealthPolicyId } | { kind: 'investment'; id: PublicHealthInvestmentId };
export type PublicHealthReviewInput = Pick<PublicHealthCenterProps, 'state' | 'game' | 'context' | 'busy'>;
type HealthResources = Pick<GameState, 'treasury' | 'politicalPower' | 'steel' | 'manpower'>;
export interface PublicHealthWeekPreview {
  week: number; resolved: boolean; weeklyCases: number; weeklyDeaths: number;
  rEffective: number | null; hospitalLoad: number | null; publicTrust: number;
  treasuryCost: number; politicalPowerCost: number;
}
export interface PublicHealthReview {
  order: PublicHealthOrder; fingerprint: string; title: string;
  immediateCost: HealthResources; resourcesAfter: HealthResources;
  capacityChanges: { label: string; before: number; after: number }[];
  baseline: PublicHealthWeekPreview | null; forecast: PublicHealthWeekPreview | null;
  riskBefore: number; riskAfter: number; confirmationWeek: number; timing: string; warnings: string[];
}
const numberFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });
const formatNumber = (value: number) => Number.isFinite(value) ? numberFormatter.format(value) : '확인 필요';
const formatCases = (value: number) => formatNumber(Math.round(value));
const formatRisk = (value: number) => Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : '확인 필요';
const defaultMoney = (value: number) => `국고 ${formatNumber(value)}`;
const capacityFields = [['preparedness', '사전 대비'], ['surveillance', '감시·탐지'], ['medicalCapacity', '의료 수용력'], ['publicTrust', '공공 신뢰'], ['countermeasureProgress', '대응책 진척']] as const;
const fingerprint = (input: PublicHealthReviewInput, order: PublicHealthOrder) => JSON.stringify([input.state, input.game, input.context, order]);
const finiteNumbers = (value: unknown): boolean => typeof value === 'number' ? Number.isFinite(value) : value !== null && typeof value === 'object' ? Object.values(value).every(finiteNumbers) : true;
const resourcesFrom = (game: GameState): HealthResources => ({ treasury: game.treasury, politicalPower: game.politicalPower, steel: game.steel, manpower: game.manpower });

export function resolvePublicHealthInvestmentChoice(state: PublicHealthState, selectedId?: string) {
  return publicHealthInvestments.find((item) => item.id === selectedId)
    ?? publicHealthInvestments.find((item) => !state.completedInvestments.includes(item.id))
    ?? publicHealthInvestments[0];
}
export function resolvePublicHealthPolicyChoice(state: PublicHealthState, game: GameState, selectedId?: string) {
  return publicHealthPolicies.find((item) => item.id === selectedId)
    ?? getPublicHealthPolicy(recommendPublicHealthPolicy(state, game).policyId);
}

/** Read-only projection; dormant outbreak rolls are not revealed as certain future events. */
export function previewPublicHealthWeek(state: PublicHealthState, context: PublicHealthContext): PublicHealthWeekPreview | null {
  if (!state.activeOutbreak || !finiteNumbers([state, context])) return null;
  const result = advancePublicHealthWeek(state, context);
  const outbreak = result.state.activeOutbreak;
  const closed = result.state.history.find((record) => record.id === state.activeOutbreak!.id && record.resolvedWeek === context.week);
  return {
    week: context.week, resolved: outbreak === null,
    weeklyCases: outbreak?.weeklyCases ?? Math.max(0, (closed?.cases ?? state.activeOutbreak.estimatedCases) - state.activeOutbreak.estimatedCases),
    weeklyDeaths: Math.max(0, result.state.totalDeaths - state.totalDeaths),
    rEffective: outbreak?.rEffective ?? null, hospitalLoad: outbreak?.hospitalLoad ?? null,
    publicTrust: result.state.publicTrust,
    treasuryCost: Math.max(0, -(result.gameDelta.treasury ?? 0)),
    politicalPowerCost: Math.max(0, -(result.gameDelta.politicalPower ?? 0)),
  };
}

export function createPublicHealthReview(input: PublicHealthReviewInput, order: PublicHealthOrder): { review: PublicHealthReview | null; reason: string } {
  const { state, game, context } = input;
  const blocked = (reason: string) => ({ review: null, reason });
  if (input.busy) return blocked('주간 진행 중입니다. 결산이 끝난 뒤 작업을 검토하세요.');
  if (!finiteNumbers([state, game, context]) || !Number.isSafeInteger(game.week) || !Number.isSafeInteger(context.week) || game.week < 0 || context.week < 0) return blocked('주차와 보건·자원 정보를 확인할 수 없습니다. 최신 상태를 확인하세요.');
  let title: string; let proposed = state;
  let immediateCost: HealthResources = { treasury: 0, politicalPower: 0, steel: 0, manpower: 0 };
  let timing: string;
  if (order.kind === 'policy') {
    const policy = publicHealthPolicies.find((candidate) => candidate.id === order.id);
    if (!policy) return blocked('등록된 대응 정책을 선택하세요.');
    if (state.policyId === order.id) return blocked('이미 적용 중인 대응 정책입니다.');
    title = `${policy.name} 대응 정책`;
    proposed = { ...state, policyId: policy.id };
    timing = '승인하면 대응 태세가 바뀝니다. 즉시 비용은 없으며 전파·사망·신뢰와 정책 운영비는 다음 주 보건 결산에서 확인합니다.';
  } else {
    const investment = publicHealthInvestments.find((candidate) => candidate.id === order.id);
    if (!investment) return blocked('등록된 역량 사업을 선택하세요.');
    if (state.completedInvestments.includes(order.id)) return blocked('이미 구축한 사업입니다. 중복 투자할 수 없습니다.');
    if ((investment.requiredKnowledge ?? 0) > (state.activeOutbreak?.knowledge ?? 0)) return blocked(`병원체 지식 ${investment.requiredKnowledge}%가 필요합니다. 현재 ${formatNumber(state.activeOutbreak?.knowledge ?? 0)}%입니다.`);
    if (!canFundPublicHealthInvestment(state, order.id, game)) return blocked('사업에 필요한 국고·정치력·강철·인력이 부족합니다. 아래 비용과 현재 자원을 확인하세요.');
    title = investment.name;
    immediateCost = { treasury: investment.treasuryCost, politicalPower: investment.politicalPowerCost ?? 0, steel: investment.steelCost ?? 0, manpower: investment.manpowerCost ?? 0 };
    proposed = applyPublicHealthInvestment(state, order.id);
    timing = '승인하면 비용을 한 번 지출하고 역량이 즉시 반영됩니다. 별도 건설 대기시간은 없으며 유행에 미친 영향은 다음 주 보건 결산에서 확인합니다.';
  }
  const baseline = previewPublicHealthWeek(state, context);
  const forecast = previewPublicHealthWeek(proposed, context);
  const resourcesAfter = resourcesFrom(game);
  for (const key of Object.keys(immediateCost) as (keyof HealthResources)[]) resourcesAfter[key] -= immediateCost[key];
  const warnings = ['예상 결과는 현재 보건 정보와 같은 주간 조건을 비교한 값입니다. 주차·보급·전선·정책이 달라지면 결과도 바뀝니다.', '표시한 주간 지출은 보건 분야의 기여분입니다. 다른 국가 세입·지출이나 전투 결과는 포함하지 않습니다.'];
  if (!state.activeOutbreak) warnings.push('유행이 없거나 처음 탐지하는 주에는 정책 운영비가 없습니다. 그 뒤 활성 유행을 진행하는 주부터 선택 정책의 비용이 발생합니다.');
  if (forecast && (resourcesAfter.treasury < forecast.treasuryCost || resourcesAfter.politicalPower < forecast.politicalPowerCost)) warnings.push('현재 잔여 자원으로는 예상 주간 정책비용이 부족합니다. 정책 변경 자체는 가능하지만 다음 결산의 전체 재정을 함께 확인하세요.');
  const capacityChanges = capacityFields.map(([key, label]) => ({ label, before: state[key], after: proposed[key] })).filter((change) => change.before !== change.after);
  if (order.kind === 'investment' && capacityChanges.length === 0) warnings.push('관련 역량이 이미 상한에 도달해 이번 사업의 즉시 지표 상승은 없습니다. 사업 비용과 구축 기록은 그대로 적용됩니다.');
  return { review: { order: { ...order }, fingerprint: fingerprint(input, order), title, immediateCost, resourcesAfter, capacityChanges, baseline, forecast, riskBefore: calculateWeeklyOutbreakRisk(state, context), riskAfter: calculateWeeklyOutbreakRisk(proposed, context), confirmationWeek: context.week, timing, warnings }, reason: '아직 승인하지 않았습니다. 비용과 확인 시점을 검토하세요.' };
}

export function confirmPublicHealthReview(review: PublicHealthReview, input: PublicHealthReviewInput, callbacks: Pick<PublicHealthCenterProps, 'onPolicyChange' | 'onInvestment'>, gate: { lastFingerprint: string | null }): { status: 'sent' | 'stale' | 'blocked'; reason: string } {
  if (input.busy) return { status: 'blocked', reason: '주간 진행 중입니다. 결산이 끝난 뒤 승인하세요.' };
  if (review.fingerprint !== fingerprint(input, review.order)) return { status: 'stale', reason: '검토 후 주차·국가·자원 또는 보건 상태가 바뀌었습니다. 최신 조건으로 다시 검토하세요.' };
  if (gate.lastFingerprint === review.fingerprint) return { status: 'blocked', reason: '같은 검토안의 요청을 이미 전달했습니다. 실제 반영 결과를 확인하세요.' };
  const current = createPublicHealthReview(input, review.order);
  if (!current.review) return { status: 'blocked', reason: current.reason };
  gate.lastFingerprint = review.fingerprint;
  if (review.order.kind === 'policy') callbacks.onPolicyChange(review.order.id);
  else callbacks.onInvestment(review.order.id);
  return { status: 'sent', reason: '요청을 전달했습니다. 현재 정책·역량·자원과 주간 보건 기록에서 반영 결과를 확인하세요.' };
}

function WeekOutcome({ title, forecast, formatMoney }: { title: string; forecast: PublicHealthWeekPreview | null; formatMoney: (value: number) => string }) {
  return <section className="ph-outcome" aria-label={title}><h4>{title}</h4>{forecast ? <><p className="ph-meta">제 {forecast.week + 1}주 보건 결산 예상 · {forecast.resolved ? '유행 종결 조건 충족 예상' : '활성 유행 진행'}</p><dl className="ph-kpis">
    <div><dt>주간 추정 사례</dt><dd>{formatCases(forecast.weeklyCases)}</dd></div><div><dt>주간 사망</dt><dd>{formatCases(forecast.weeklyDeaths)}</dd></div>
    <div><dt>유효 재생산지수</dt><dd>{forecast.rEffective === null ? '종결 후 미표시' : forecast.rEffective.toFixed(2)}</dd></div><div><dt>병상 부하</dt><dd>{forecast.hospitalLoad === null ? '종결 후 미표시' : `${formatNumber(forecast.hospitalLoad)}%`}</dd></div>
    <div><dt>공공 신뢰</dt><dd>{formatNumber(forecast.publicTrust)}</dd></div><div><dt>주간 보건 지출</dt><dd>{formatMoney(forecast.treasuryCost)} · 정치 {forecast.politicalPowerCost}</dd></div>
  </dl></> : <p>현재 활성 유행이 없어 전파·사망 전망을 제시하지 않습니다. 새 유행의 발생과 병원체는 확정하지 않습니다.</p>}</section>;
}
function ResourceCosts({ costs, after, formatMoney }: { costs: HealthResources; after?: HealthResources; formatMoney: (value: number) => string }) {
  return <dl className="ph-costs"><div><dt>승인 시 국고 지출</dt><dd>{formatMoney(costs.treasury)}</dd>{after ? <small>승인 직후 잔고 {formatMoney(after.treasury)}</small> : null}</div><div><dt>정치력</dt><dd>{costs.politicalPower}</dd>{after ? <small>승인 직후 {formatNumber(after.politicalPower)}</small> : null}</div><div><dt>강철</dt><dd>{costs.steel}</dd>{after ? <small>승인 직후 {formatNumber(after.steel)}</small> : null}</div><div><dt>인력</dt><dd>{costs.manpower}K</dd>{after ? <small>승인 직후 {formatNumber(after.manpower)}K</small> : null}</div></dl>;
}
function CapacityReadout({ state }: { state: PublicHealthState }) {
  return <div className="ph-capacity-grid"><HealthMeter label="사전 대비" value={state.preparedness} detail="비축·훈련·계획의 종합 수준" tone="green" /><HealthMeter label="감시·탐지" value={state.surveillance} detail="유행을 더 작을 때 포착하는 능력" tone="blue" /><HealthMeter label="의료 수용력" value={state.medicalCapacity} detail="중증 환자 생존과 병상 부담에 반영" tone="amber" /><HealthMeter label="공공 신뢰" value={state.publicTrust} detail="정책·병상 부담·유행 회복의 영향을 반영" tone={state.publicTrust < 40 ? 'red' : 'blue'} /></div>;
}

export function PublicHealthCenter({ state, game, context, onPolicyChange, onInvestment, busy = false, initialView = 'overview', formatMoney = defaultMoney }: PublicHealthCenterProps) {
  const [view, setView] = useState<PublicHealthView>(initialView);
  const [policyChoice, setPolicyChoice] = useState<PublicHealthPolicyId>(() => resolvePublicHealthPolicyChoice(state, game).id);
  const [investmentChoice, setInvestmentChoice] = useState<PublicHealthInvestmentId>(() => resolvePublicHealthInvestmentChoice(state).id);
  const [sourceChoice, setSourceChoice] = useState('');
  const [recordChoice, setRecordChoice] = useState('');
  const [review, setReview] = useState<PublicHealthReview | null>(null);
  const [message, setMessage] = useState('');
  const reviewRef = useRef<HTMLElement | null>(null);
  const resultRef = useRef<HTMLParagraphElement | null>(null);
  const focusResultAfterApproval = useRef(false);
  const gate = useRef<{ lastFingerprint: string | null }>({ lastFingerprint: null });
  const contentId = useId();
  useEffect(() => {
    if (review) reviewRef.current?.focus();
    else if (focusResultAfterApproval.current) {
      focusResultAfterApproval.current = false;
      resultRef.current?.focus();
    }
  }, [review]);
  const outbreak = state.activeOutbreak;
  const template = outbreak ? getOutbreakTemplate(outbreak.templateId) : null;
  const activePolicy = getPublicHealthPolicy(state.policyId);
  const recommendation = recommendPublicHealthPolicy(state, game);
  const selectedPolicy = resolvePublicHealthPolicyChoice(state, game, policyChoice);
  const selectedInvestment = resolvePublicHealthInvestmentChoice(state, investmentChoice);
  const selectedSource = outbreakTemplates.find((item) => item.id === sourceChoice) ?? template ?? outbreakTemplates[0];
  const selectedRecord = state.history.find((item) => item.id === recordChoice) ?? state.history.at(-1);
  const input = { state, game, context, busy };
  const draftOrder: PublicHealthOrder = view === 'investments' ? { kind: 'investment', id: selectedInvestment.id } : { kind: 'policy', id: selectedPolicy.id };
  const draft = view === 'policy' || view === 'investments' ? createPublicHealthReview(input, draftOrder) : null;
  const baseline = view === 'policy' ? previewPublicHealthWeek(state, context) : null;
  const policyForecast = view === 'policy' ? previewPublicHealthWeek({ ...state, policyId: selectedPolicy.id }, context) : null;
  const investmentAfter = view === 'investments' ? applyPublicHealthInvestment(state, selectedInvestment.id) : state;
  const risk = calculateWeeklyOutbreakRisk(state, context);
  const riskFactors = view === 'overview' ? getOutbreakRiskBreakdown(state, context).filter((item) => Math.abs(item.contribution) >= 0.00005).sort((left, right) => Math.abs(right.contribution) - Math.abs(left.contribution)) : [];
  const emergenceEligible = !outbreak && context.week >= 4 && context.week - state.lastEventWeek >= 8;
  const reviewStale = Boolean(review && review.fingerprint !== fingerprint(input, review.order));
  const changeView = (next: PublicHealthView) => { setView(next); setReview(null); setMessage(''); };
  const requestReview = (order: PublicHealthOrder) => { const result = createPublicHealthReview(input, order); setReview(result.review); setMessage(result.reason); };
  const confirm = () => {
    if (!review) return;
    const result = confirmPublicHealthReview(review, input, { onPolicyChange, onInvestment }, gate.current);
    setMessage(`${review.title} · ${result.reason}`);
    if (result.status === 'sent') {
      if (review.order.kind === 'investment') setInvestmentChoice(review.order.id);
      else setPolicyChoice(review.order.id);
      focusResultAfterApproval.current = true;
      setReview(null);
    }
  };

  return <div className="public-health-center health-command-edition">
    <header className="ph-heading" id="health-intro"><div><span className="ph-eyebrow"><HeartPulse size={18} /> PUBLIC HEALTH COMMAND</span><h2>{outbreak ? `${outbreak.codeName} 위기 지휘실` : '국가 보건 대비 본부'}</h2><p>{template ? `${template.name} · ${formatOutbreakPhase(outbreak!.phase)}` : '현재 활성 유행이 없습니다. 감시와 대응 역량을 점검하세요.'}</p><small>{context.theater === 'asia' ? '아시아·태평양' : '유럽·지중해'} 감시 전구 · 현재 정책 {activePolicy.name}</small></div><div className="ph-status"><span>{outbreak ? '현재 유효 재생산지수' : '현재 조건의 주간 위험지표'}</span><strong>{outbreak ? outbreak.rEffective.toFixed(2) : formatRisk(risk)}</strong><small>{outbreak ? outbreak.rEffective > 1 ? '1 초과 · 유행 확산' : '1 이하 · 유행 감소' : emergenceEligible ? '다음 결산의 유행 압력 갱신으로 달라질 수 있음' : '초기 주차 또는 종결 직후로 새 유행 발생 보류'}</small></div></header>
    <nav className="ph-workviews" aria-label="보건 본부 작업보기">{([['overview', '위기 개요'], ['policy', '대응 정책'], ['investments', '역량 투자'], ['records', '기록·사료']] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={view === id} aria-controls={contentId} onClick={() => changeView(id)}>{label}</button>)}</nav>
    {busy ? <p className="ph-warning" role="status">주간 결산 중입니다. 정보는 열람할 수 있으며 작업 승인은 결산 후 가능합니다.</p> : null}
    <p className="ph-meta ph-result-status" role="status" aria-label="보건 작업 결과 안내" aria-live="polite" tabIndex={-1} ref={resultRef}>{message || '정책과 사업은 검토 후 승인합니다. 화면을 열거나 대상을 선택하는 것만으로는 실행되지 않습니다.'}</p>
    {review ? <section className="ph-panel ph-review" aria-label="보건 작업 승인 검토" tabIndex={-1} ref={reviewRef}><span className="ph-eyebrow">REVIEW / 아직 승인 전</span><h3>{review.title}</h3><p>{review.timing}</p><ResourceCosts costs={review.immediateCost} after={review.resourcesAfter} formatMoney={formatMoney} />{review.capacityChanges.length ? <ul className="ph-capacity-changes">{review.capacityChanges.map((change) => <li key={change.label}><span>{change.label}</span><strong>{formatNumber(change.before)} → {formatNumber(change.after)}</strong></li>)}</ul> : null}<p className="ph-meta">현재 조건의 위험지표 {formatRisk(review.riskBefore)} → {formatRisk(review.riskAfter)} · 다음 결산의 유행 압력 갱신 전 비교입니다.</p><WeekOutcome title="승인안의 다음 주 전망" forecast={review.forecast} formatMoney={formatMoney} /><p className="ph-meta">확인 시점: 제 {review.confirmationWeek + 1}주 통합 주간 브리핑. 승인 직후 잔고에는 이후 주간 지출을 미리 차감하지 않았습니다.</p><ul>{review.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>{reviewStale ? <p role="alert" className="ph-warning">검토 후 주차·국가·자원 또는 보건 상태가 바뀌었습니다. 최신 조건으로 다시 검토하세요.</p> : null}<div className="ph-actions"><button type="button" className="ph-primary" disabled={busy || reviewStale} onClick={confirm}>작업 승인</button>{reviewStale ? <button type="button" disabled={busy} onClick={() => requestReview(review.order)}>최신 조건으로 재검토</button> : null}<button type="button" onClick={() => { setReview(null); setMessage('검토를 취소했습니다. 실행 요청은 보내지 않았습니다.'); }}>검토 취소</button></div></section> : null}
    <div className="ph-content" id={contentId}>
      {view === 'overview' ? <>
        <section className="ph-panel" aria-label="이번 주 보건 우선순위"><span className="ph-eyebrow">THIS WEEK / 다음 행동</span><h3>{outbreak ? `참모 권고 · ${getPublicHealthPolicy(recommendation.policyId).name}` : '감시를 유지하고 부족한 역량을 확인하세요'}</h3><p>{recommendation.reason}</p><div className="ph-actions"><button type="button" className="ph-primary" onClick={() => { setPolicyChoice(recommendation.policyId); changeView('policy'); }}>권고 정책 살펴보기 <ArrowRight size={16} /></button><button type="button" onClick={() => changeView('investments')}>역량 투자 조건 확인</button></div></section>
        {outbreak ? <section className="ph-panel"><h3>현재 유행 지표</h3><dl className="ph-kpis"><div><dt>누적 추정 사례</dt><dd>{formatCases(outbreak.estimatedCases)}</dd><small>이번 주 {formatCases(outbreak.weeklyCases)}건</small></div><div><dt>병상 부하</dt><dd>{formatNumber(outbreak.hospitalLoad)}%</dd><small>{outbreak.hospitalLoad >= 100 ? '수용 역량 초과' : '가용 범위'}</small></div><div><dt>누적 사망</dt><dd>{formatCases(outbreak.deaths)}</dd><small>변이 계통 {outbreak.variantCount}개</small></div><div><dt>감시 단계</dt><dd>{formatOutbreakPhase(outbreak.phase)}</dd><small>{outbreak.origin} · {outbreak.weeksActive}주 진행</small></div></dl><div className="ph-capacity-grid"><HealthMeter label="병원체 지식" value={outbreak.knowledge} detail="공개 과학·감시·과학 자문으로 축적됩니다." /><HealthMeter label="대응책 진척" value={state.countermeasureProgress} detail="누적 연구 진척이 전파 억제에 반영됩니다." tone="green" /></div></section> : null}
        <details className="ph-fold"><summary>국가 대응 역량 · 구축 {state.completedInvestments.length}/{publicHealthInvestments.length}</summary><CapacityReadout state={state} /></details>
        <details className="ph-fold"><summary>위험지표 {formatRisk(risk)}의 계산 근거</summary><ul className="ph-risk-list">{riskFactors.map((factor) => <li key={factor.id}>{factor.label} · {factor.contribution >= 0 ? '+' : ''}{(factor.contribution * 100).toFixed(2)}%p<small>{factor.detail}</small></li>)}</ul><p className="ph-meta">현재 조건의 게임 내 위험지표이며 0.10~4.50% 범위입니다. 다음 결산의 유행 압력 갱신을 포함한 확정 확률이 아닙니다. 활성 유행 중·초기 4주 전·직전 탐지나 종결 이후 8주 미만에는 새 유행을 중복 생성하지 않습니다.</p></details>
      </> : null}
      {view === 'policy' ? <section className="ph-panel" aria-label="선택 대응 정책"><span className="ph-eyebrow">RESPONSE POLICY / 선택은 미집행</span><h3>대응 정책 검토</h3><label className="ph-select">검토할 정책<select value={selectedPolicy.id} onChange={(event) => { setPolicyChoice(event.target.value as PublicHealthPolicyId); setReview(null); setMessage(''); }}>{publicHealthPolicies.map((policy) => <option value={policy.id} key={policy.id}>{policy.name}{policy.id === state.policyId ? ' · 현재 적용' : ''}{policy.id === recommendation.policyId ? ' · 참모 권고' : ''}</option>)}</select></label>
        <article className="ph-policy-detail"><h4>{selectedPolicy.name} · {selectedPolicy.posture}</h4><p>{selectedPolicy.description}</p><p className="ph-warning">{selectedPolicy.tradeoff}</p><dl className="ph-costs"><div><dt>승인 시 즉시 비용</dt><dd>{formatMoney(0)} · 정치 0</dd></div><div><dt>활성 유행 주간 운영비</dt><dd>{formatMoney(selectedPolicy.weeklyTreasury)} · 정치 {selectedPolicy.weeklyPoliticalPower}</dd></div><div><dt>전파 억제 계수</dt><dd>−{selectedPolicy.transmissionControl.toFixed(2)} R</dd></div><div><dt>정책 지식 증가 계수</dt><dd>+{selectedPolicy.knowledgeGain}/주</dd><small>감시·자문과 상한이 추가 반영됩니다.</small></div></dl></article>
        <h4 id="health-forecast-title">현재 정책과 선택안의 다음 주 전망</h4><div className="ph-split"><WeekOutcome title={`현재 · ${activePolicy.name}`} forecast={baseline} formatMoney={formatMoney} /><WeekOutcome title={`선택안 · ${selectedPolicy.name}`} forecast={policyForecast} formatMoney={formatMoney} /></div><p className="ph-meta">같은 현재 정보로 계산한 1주 전망이며 정책을 적용하지 않습니다. 유행이 없거나 처음 탐지하는 주에는 운영비가 없습니다. 실제 반영은 제 {context.week + 1}주 통합 주간 브리핑에서 확인하세요.</p>{draft?.reason ? <p className={draft.review ? 'ph-meta' : 'ph-warning'}>{draft.reason}</p> : null}<div className="ph-actions"><button type="button" className="ph-primary" disabled={!draft?.review || busy} onClick={() => requestReview({ kind: 'policy', id: selectedPolicy.id })}>정책 변경 검토</button></div>
      </section> : null}
      {view === 'investments' ? <section className="ph-panel" aria-label="선택 보건 역량 투자"><span className="ph-eyebrow">CAPACITY BUILDING / 영구 역량</span><h3>역량 투자 검토</h3><label className="ph-select">검토할 사업<select value={selectedInvestment.id} onChange={(event) => { setInvestmentChoice(event.target.value as PublicHealthInvestmentId); setReview(null); setMessage(''); }}>{publicHealthInvestments.map((investment) => <option value={investment.id} key={investment.id}>{investment.name}{state.completedInvestments.includes(investment.id) ? ' · 구축 완료' : ''}</option>)}</select></label>
        <article className="ph-investment-detail"><h4>{selectedInvestment.name}</h4>{state.completedInvestments.includes(selectedInvestment.id) ? <p className="ph-complete">구축 완료 · 보건 역량 기록에 반영되어 있습니다. 다른 사업은 위 목록에서 직접 선택하세요.</p> : null}<p>{selectedInvestment.description}</p><p>{selectedInvestment.effectLabel} · 지표 상한 100 적용</p><ResourceCosts costs={{ treasury: selectedInvestment.treasuryCost, politicalPower: selectedInvestment.politicalPowerCost ?? 0, steel: selectedInvestment.steelCost ?? 0, manpower: selectedInvestment.manpowerCost ?? 0 }} formatMoney={formatMoney} /><p className="ph-meta">현재 {formatMoney(game.treasury)} · 정치 {formatNumber(game.politicalPower)} · 강철 {formatNumber(game.steel)} · 인력 {formatNumber(game.manpower)}K{selectedInvestment.requiredKnowledge ? ` · 필요 지식 ${selectedInvestment.requiredKnowledge}% / 현재 ${formatNumber(outbreak?.knowledge ?? 0)}%` : ''}</p><h4>승인 조건 충족 시 즉시 역량 변화</h4><ul className="ph-capacity-changes">{capacityFields.filter(([key]) => state[key] !== investmentAfter[key]).map(([key, label]) => <li key={key}><span>{label}</span><strong>{formatNumber(state[key])} → {formatNumber(investmentAfter[key])}</strong></li>)}</ul>{capacityFields.every(([key]) => state[key] === investmentAfter[key]) ? <p>이미 구축했거나 관련 역량이 상한에 도달해 즉시 상승할 지표가 없습니다.</p> : null}<p>승인하면 비용을 한 번 지출하고 역량과 구축 기록이 즉시 반영됩니다. 별도 공사 기간은 없으며 유행에 미친 영향은 다음 주 기록에서 확인합니다.</p></article>{draft?.reason ? <p className={draft.review ? 'ph-meta' : 'ph-warning'}>{draft.reason}</p> : null}<div className="ph-actions"><button type="button" className="ph-primary" disabled={!draft?.review || busy} onClick={() => requestReview({ kind: 'investment', id: selectedInvestment.id })}>투자 비용과 결과 검토</button></div><details className="ph-fold"><summary>현재 전체 대응 역량</summary><CapacityReadout state={state} /></details>
      </section> : null}
      {view === 'records' ? <>
        <section className="ph-panel" aria-label="종결된 유행 기록"><span className="ph-eyebrow">CONFIRMED RECORDS</span><h3>종결된 유행 기록</h3><p className="ph-meta">총 누적 사망 {formatCases(state.totalDeaths)}명 · 보관된 종결 기록 {state.history.length}건</p>{selectedRecord ? <><label className="ph-select">검토할 기록<select value={selectedRecord.id} onChange={(event) => setRecordChoice(event.target.value)}>{[...state.history].reverse().map((record) => <option key={record.id} value={record.id}>{record.codeName} · 제 {record.resolvedWeek + 1}주 종결</option>)}</select></label><article className="ph-history-detail"><h4>{selectedRecord.codeName} · {getOutbreakTemplate(selectedRecord.templateId).shortName}</h4><p>제 {selectedRecord.detectedWeek + 1}–{selectedRecord.resolvedWeek + 1}주 · {selectedRecord.outcome === 'contained' ? '조기 억제' : selectedRecord.outcome === 'managed' ? '관리 종결' : '국가적 재난'}</p><dl className="ph-costs"><div><dt>누적 추정 사례</dt><dd>{formatCases(selectedRecord.cases)}</dd></div><div><dt>누적 사망</dt><dd>{formatCases(selectedRecord.deaths)}</dd></div></dl></article></> : <p>아직 종결된 유행 기록이 없습니다. 전망을 실제 기록으로 추가하지 않습니다.</p>}</section>
        <section className="ph-panel" aria-label="보건 시나리오 사료"><span className="ph-eyebrow"><BookOpenCheck size={16} /> HISTORICAL SCENARIOS</span><h3>시나리오와 사료</h3><p>실제 SARS-CoV·SARS-CoV-2가 1940년대에 존재했다는 설정이 아닙니다. SARS형·COVID형은 후대 유행의 역학·대응 양상을 참고한 대체역사 병원체입니다.</p><label className="ph-select">확인할 시나리오<select value={selectedSource.id} onChange={(event) => setSourceChoice(event.target.value)}>{outbreakTemplates.map((profile) => <option value={profile.id} key={profile.id}>{profile.name} · {profile.alternateHistory ? '대체역사' : '사료 기반'}</option>)}</select></label><article className="ph-source-detail"><span className="ph-eyebrow">{selectedSource.family === 'respiratory' ? '호흡기' : selectedSource.family === 'vector' ? '매개체' : '수인성'} · {selectedSource.alternateHistory ? '대체역사' : '사료 기반'}</span><h4>{selectedSource.name}</h4><small>{selectedSource.historicalAnalogue} · {selectedSource.historicalYear}</small><p>{selectedSource.historicalNote}</p><dl className="ph-costs"><div><dt>기초 R</dt><dd>{selectedSource.reproductionNumber.toFixed(2)}</dd></div><div><dt>등장 가중치</dt><dd>{selectedSource.baseWeight}</dd></div><div><dt>치명률 모형</dt><dd>{(selectedSource.fatalityRate * 100).toFixed(1)}%</dd></div></dl><a href={selectedSource.sourceUrl} target="_blank" rel="noreferrer">{selectedSource.sourceLabel} <ExternalLink size={14} /></a></article></section>
      </> : null}
    </div>
  </div>;
}
